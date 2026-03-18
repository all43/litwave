import { App } from '@capacitor/app';
import { Injectable, NgZone } from '@angular/core';
import { MorseService } from './morse.service';
import { MESSAGE_PRESETS } from './presets';
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

interface MessageConfig {
  binaryEncoded: boolean[];
  sequenceLength: number;
  repeatEvery: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message$ = new BehaviorSubject<string>(MESSAGE_PRESETS[0].message);
  public countDown$: Observable<number>;
  public stream$: Observable<boolean>;
  private ditLength = 300; // dit length in milliseconds
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

        // take binary morse stream and emit values with timed delay
        const morseStream$ = from(config.binaryEncoded).pipe(
          concatMap((val) => of(val).pipe(
            delay(this.ditLength),
          )),
          distinctUntilChanged(),
          endWith(false), // switch off at the end
        );

        const stream$ = sequenceInterval$.pipe(
          switchMap(() => morseStream$.pipe(
            takeUntil(this.trigger$.pipe(
                filter((val) => val === false),
              ),
            ),
            endWith(false),
          )),
          share(),
        );

        // emits number of milliseconds left until next seq. starts
        const countDown$ = merge(
            timeToNextSequence$,
            sequenceInterval$
              .pipe(
                delay(config.sequenceLength),
                map(() => config.repeatEvery - config.sequenceLength),
              ),
          ).pipe(
          switchMap((timeout) => interval(this.countDownAccuracy).pipe(
            scan((acc, _) => acc - this.countDownAccuracy, timeout),
            takeWhile((remaining) => remaining >= 0),
            endWith(0),
          )),
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
    this.trigger$.next(true);
  }

  stopTimer(): void {
    this.trigger$.next(false);
  }

  private buildConfig(message: string): MessageConfig {
    const binaryEncoded = this.morse.encodeBinary(message);
    const sequenceLength = binaryEncoded.length * this.ditLength;
    const pauseLength = this.ditLength * 14;
    const repeatEvery = sequenceLength + pauseLength >= 30000 ? 60000 : 30000;
    return { binaryEncoded, sequenceLength, repeatEvery };
  }

  private calcTimeToNextSequence(repeatEvery: number): number {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1, 0, 0);
    const diff = next.getTime() - Date.now();
    return diff < repeatEvery ? diff : diff - repeatEvery;
  }
}
