import { App } from '@capacitor/app';
import { Injectable, NgZone } from '@angular/core';
import { MorseService } from './morse.service';
import { MESSAGE_PRESETS } from './presets';
import { MessageConfig, buildConfig, calcTimeToNextSequence, calcJoinBit, DIT_LENGTH_MS } from './message-timing';
import { encodeBinaryWithBoundaries } from './morse-encode';
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
  scan,
  switchMap,
  share,
  takeWhile,
  takeUntil,
  filter,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message$ = new BehaviorSubject<string>(MESSAGE_PRESETS[0].message);
  public countDown$: Observable<number>;
  public stream$: Observable<boolean>;
  private readonly ditLength = DIT_LENGTH_MS;
  private countDownAccuracy = 100; // number of milliseconds to update countdown timer
  /*
    BehaviorSubject used because regular subject could emit first value before subscriber connects,
    also we don't need to manually trigger for the first time
    Trigger is used to restart timer on resume from background
  */
  private trigger$ = new BehaviorSubject<boolean>(true);

  constructor(private morse: MorseService, private ngZone: NgZone) {
    // derive config from current message
    const messageConfig$ = this.message$.pipe(
      map((msg) => this.buildConfig(msg)),
    );

    // when message or trigger changes, rebuild the entire stream
    const engine$ = messageConfig$.pipe(
      switchMap((config) => {
        const timeToNextSequence$ = this.trigger$.pipe(
          filter((val) => val),
          switchMap(
            () => defer(() => of(this.calcTimeToNextSequence(config.repeatEvery)))
          ),
        );

        // emits every time we need to start new sequence
        const sequenceInterval$ = timeToNextSequence$.pipe(
          switchMap((val) => timer(val, config.repeatEvery)),
          share(),
        );

        // builds a morse bit stream for the given slice of binaryEncoded
        const makeMorseStream$ = (bits: boolean[]) =>
          from(bits).pipe(
            concatMap((val) => of(val).pipe(delay(this.ditLength))),
            distinctUntilChanged(),
            endWith(false),
          );

        // mid-cycle join: when trigger fires, jump to nearest upcoming letter boundary
        const joinPlay$ = this.trigger$.pipe(
          filter((val) => val),
          switchMap(() =>
            defer(() => {
              const joinBit = calcJoinBit(config, Date.now(), this.ditLength);
              if (joinBit === 0) {
                return of<boolean>(); // no join — wait for sequenceInterval$
              }
              const msUntilJoinBit = joinBit * this.ditLength - (Date.now() % config.repeatEvery);
              return timer(msUntilJoinBit).pipe(
                switchMap(() =>
                  makeMorseStream$(config.binaryEncoded.slice(joinBit)).pipe(
                    takeUntil(sequenceInterval$),
                    takeUntil(this.trigger$.pipe(filter((v) => v === false))),
                    endWith(false),
                  )
                ),
              );
            })
          ),
        );

        const stream$ = merge(
          // full plays on every epoch boundary
          sequenceInterval$.pipe(
            switchMap(() =>
              makeMorseStream$(config.binaryEncoded).pipe(
                takeUntil(this.trigger$.pipe(filter((val) => val === false))),
                endWith(false),
              )
            ),
          ),
          joinPlay$,
        ).pipe(share());

        // Countdown should show time to FIRST flash, not time to epoch boundary.
        // When a mid-cycle join is active the first flash is at msUntilJoinBit
        // (within the current cycle, potentially much sooner than the next epoch
        // boundary). Both calcJoinBit and calcTimeToNextSequence run in the same
        // defer so Date.now() is consistent with the joinPlay$ calculation.
        const timeToFirstFlash$ = this.trigger$.pipe(
          filter((val) => val),
          switchMap(() =>
            defer(() => {
              const joinBit = calcJoinBit(config, Date.now(), this.ditLength);
              if (joinBit === 0) {
                return of(this.calcTimeToNextSequence(config.repeatEvery));
              }
              const msUntilJoinBit = joinBit * this.ditLength - (Date.now() % config.repeatEvery);
              return of(msUntilJoinBit);
            })
          ),
        );

        // emits number of milliseconds left until next seq. starts
        const countDown$ = merge(
            timeToFirstFlash$,
            sequenceInterval$
              .pipe(
                delay(config.sequenceLength),
                map(() => config.repeatEvery - config.sequenceLength),
              ),
          ).pipe(
          switchMap((timeout) => {
            // Anchor to wall-clock time so the display stays accurate even if
            // the 100 ms interval is throttled by iOS/Android (e.g. after wake).
            const targetMs = Date.now() + timeout;
            return interval(this.countDownAccuracy).pipe(
              map(() => Math.max(0, targetMs - Date.now())),
              // inclusive takeWhile emits the terminal 0, replacing endWith(0)
              takeWhile((remaining) => remaining > 0, true),
              // stop immediately on background so stale value never shows on resume
              takeUntil(this.trigger$.pipe(filter(v => v === false))),
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

    this.stream$ = engine$.pipe(
      filter((e) => e.type === 'stream'),
      map((e) => e.val as boolean),
      share(),
    );

    this.countDown$ = engine$.pipe(
      filter((e) => e.type === 'countDown'),
      map((e) => e.val as number),
    );

    // stop timer if app is in background, reset on resume
    App.addListener('appStateChange', ({ isActive }) => {
      /*
        without ngZone angular loses change detection
        on resume from background on mobile platforms
      */
      this.ngZone.run(() => {
      if (isActive) {
        this.resetTimer();
      } else {
        this.stopTimer();
      }
      });
    });
  }

  setMessage(message: string): void {
    this.message$.next(message);
    this.resetTimer();
  }

  resetTimer(): void {
    // Explicit false before true guarantees any in-flight morse stream sees the
    // takeUntil(trigger$ === false) and stops cleanly before the new cycle starts.
    // Without this, if trigger$ is already true (e.g. appStateChange(false) was
    // missed on a quick lock/unlock) the old stream keeps playing until the next
    // sequenceInterval$ fires, which can be a full repeatEvery ms away.
    this.trigger$.next(false);
    this.trigger$.next(true);
  }

  stopTimer(): void {
    this.trigger$.next(false);
  }

  private buildConfig(message: string): MessageConfig {
    return buildConfig(
      message,
      (msg) => encodeBinaryWithBoundaries(msg),
      this.ditLength,
    );
  }

  private calcTimeToNextSequence(repeatEvery: number): number {
    return calcTimeToNextSequence(repeatEvery);
  }
}
