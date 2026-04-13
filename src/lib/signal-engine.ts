import {
  from,
  Observable,
  of,
  merge,
  timer,
  interval,
  BehaviorSubject,
  defer,
} from 'rxjs';
import {
  concatMap,
  delay,
  distinctUntilChanged,
  endWith,
  map,
  switchMap,
  share,
  takeWhile,
  takeUntil,
  filter,
} from 'rxjs/operators';
import {
  MessageConfig,
  buildConfig,
  calcTimeToNextSequence,
  calcJoinBit,
  DIT_LENGTH_MS,
} from './message-timing';

export interface SignalEngineOptions {
  message$: Observable<string>;
  trigger$: BehaviorSubject<boolean>;
  encodeFn: (msg: string) => { bits: boolean[]; letterStarts: number[] };
  ditLength?: number;
  countDownAccuracy?: number;
}

export interface SignalEngine {
  stream$: Observable<boolean>;
  countDown$: Observable<number>;
}

export function createSignalEngine(options: SignalEngineOptions): SignalEngine {
  const ditLength = options.ditLength ?? DIT_LENGTH_MS;
  const countDownAccuracy = options.countDownAccuracy ?? 100;
  const { message$, trigger$, encodeFn } = options;

  const messageConfig$ = message$.pipe(
    map((msg) => buildConfig(msg, encodeFn, ditLength)),
  );

  const engine$ = messageConfig$.pipe(
    switchMap((config) => {
      const timeToNextSequence$ = trigger$.pipe(
        filter((val) => val),
        switchMap(
          () => defer(() => of(calcTimeToNextSequence(config.repeatEvery)))
        ),
      );

      const sequenceInterval$ = timeToNextSequence$.pipe(
        switchMap((val) => timer(val, config.repeatEvery)),
        share(),
      );

      const makeMorseStream$ = (bits: boolean[]) =>
        from(bits).pipe(
          concatMap((val) => of(val).pipe(delay(ditLength))),
          distinctUntilChanged(),
          endWith(false),
        );

      const joinPlay$ = trigger$.pipe(
        filter((val) => val),
        switchMap(() =>
          defer(() => {
            const joinBit = calcJoinBit(config, Date.now(), ditLength);
            if (joinBit === 0) {
              return of<boolean>();
            }
            const msUntilJoinBit = joinBit * ditLength - (Date.now() % config.repeatEvery);
            return timer(msUntilJoinBit).pipe(
              switchMap(() =>
                makeMorseStream$(config.binaryEncoded.slice(joinBit)).pipe(
                  takeUntil(sequenceInterval$),
                  takeUntil(trigger$.pipe(filter((v) => v === false))),
                  endWith(false),
                )
              ),
            );
          })
        ),
      );

      const stream$ = merge(
        sequenceInterval$.pipe(
          switchMap(() =>
            makeMorseStream$(config.binaryEncoded).pipe(
              takeUntil(trigger$.pipe(filter((val) => val === false))),
              endWith(false),
            )
          ),
        ),
        joinPlay$,
      ).pipe(share());

      const timeToFirstFlash$ = trigger$.pipe(
        filter((val) => val),
        switchMap(() =>
          defer(() => {
            const joinBit = calcJoinBit(config, Date.now(), ditLength);
            if (joinBit === 0) {
              return of(calcTimeToNextSequence(config.repeatEvery));
            }
            const msUntilJoinBit = joinBit * ditLength - (Date.now() % config.repeatEvery);
            return of(msUntilJoinBit);
          })
        ),
      );

      const countDown$ = merge(
          timeToFirstFlash$,
          sequenceInterval$
            .pipe(
              delay(config.sequenceLength),
              map(() => config.repeatEvery - config.sequenceLength),
            ),
        ).pipe(
        switchMap((timeout) => {
          const targetMs = Date.now() + timeout;
          return interval(countDownAccuracy).pipe(
            map(() => Math.max(0, targetMs - Date.now())),
            takeWhile((remaining) => remaining > 0, true),
            takeUntil(trigger$.pipe(filter(v => v === false))),
          );
        }),
      );

      return merge(
        stream$.pipe(map((val) => ({ type: 'stream' as const, val }))),
        countDown$.pipe(map((val) => ({ type: 'countDown' as const, val }))),
      );
    }),
    share(),
  );

  return {
    stream$: engine$.pipe(
      filter((e) => e.type === 'stream'),
      map((e) => e.val as boolean),
      share(),
    ),
    countDown$: engine$.pipe(
      filter((e) => e.type === 'countDown'),
      map((e) => e.val as number),
    ),
  };
}
