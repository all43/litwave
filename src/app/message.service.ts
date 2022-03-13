import { App } from '@capacitor/app';
import { Injectable, NgZone } from '@angular/core';
import { MorseService } from './morse.service';
import {
  from,
  Observable,
  Subject,
  ReplaySubject,
  of,
  merge,
  timer,
  interval,
} from 'rxjs';
import {
  concatMap,
  delay,
  distinctUntilChanged,
  endWith,
  scan,
  switchMap,
  share,
  tap,
  takeWhile,
  startWith,
  filter,
  finalize,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message = 'STOP WAR'; // TODO: move to config
  countDownAccuracy = 100; // number of milliseconds to update coundtowd timer
  public cycleLength: number;
  public repeatEvery: number;
  public countDown$: Observable<number>;
  public morseStream$: Observable<boolean>;
  public stream$: Observable<boolean>;
  // replay subject used because regular subject could emit first value before subscriber connects
  private trigger$ = new ReplaySubject<number | null>(1);
  private resetCountdown$ = new Subject<number>();
  private ditLength = 300; // dit length in milliseconds

  constructor(morse: MorseService, private ngZone: NgZone) {
    const morseBinaryEncoded = morse.encodeBinary(this.message);
    this.cycleLength = morseBinaryEncoded.length * this.ditLength;
    // minimum pause between sequences, used to calculate how many sequences we can do per minute
    const pauseLength = this.ditLength * 14;
    // repeat every 30 or 60 seconds depenging on cycle length
    this.repeatEvery = this.cycleLength + pauseLength >= 30000 ? 60000 : 30000;
    // take binary morse stream and emit values with timed delay
    this.morseStream$ = from(morseBinaryEncoded).pipe(
      concatMap((val) => of(val).pipe(
        delay(this.ditLength),
      )),
      distinctUntilChanged(),
      endWith(false), // switch off at the end
      finalize(() => this.resetCountdown$.next(this.repeatEvery - this.cycleLength)),
    );

    this.stream$ = this.trigger$.pipe(
      tap(() => console.log('stream pipe')),
      switchMap((val) => val !== null ?
        timer(val, this.repeatEvery).pipe(
          switchMap(() => this.morseStream$),
        )
        : of(false)),
      // tap(console.log),
      share(), // supposed to be shared by multiple subscribers
    );

    this.countDown$ = merge(this.trigger$, this.resetCountdown$).pipe(
      tap((v) => console.log('countdown', v)),
      filter((val) => val !== null),
      switchMap((timeout) => interval(this.countDownAccuracy).pipe(
        // startWith(timeout),
        scan((acc, _) => acc - this.countDownAccuracy, timeout),
        tap(console.log),
        takeWhile((remaining) => remaining >= 0),
        endWith(0),
      )),
    );

    this.updateTimer();

    // stop timer if app is in backround, reset on resume
    App.addListener('appStateChange', ({ isActive }) => {
      /*
        without ngZone angular loses change detection
        on resume from background on mobile platforms
      */
      this.ngZone.run(() => {
      if (isActive) {
        this.updateTimer();
        console.log('active');
      } else {
        this.stopTimer();
        console.log('background');
      }
      });
    });
  }

  updateTimer(): void {
    const timeout = this.timeToNextCycle();
    this.trigger$.next(timeout);
  }

  stopTimer() {
    this.trigger$.next(null);
  }

  timeToNextCycle(): number {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1, 0, 0);
    const diff = next.getTime() - Date.now(); // time until beginning of the next minute
    return diff < this.repeatEvery ? diff : diff - this.repeatEvery;
  }
}
