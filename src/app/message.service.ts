import { App } from '@capacitor/app';
import { Injectable, NgZone } from '@angular/core';
import { MorseService } from './morse.service';
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
  scan,
  switchMap,
  share,
  takeWhile,
  takeUntil,
  filter,
  mapTo,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message = 'STOP WAR'; // TODO: move to config
  public countDown$: Observable<number>;
  public morseStream$: Observable<boolean>;
  public stream$: Observable<boolean>;
  public repeatEvery: number;
  private ditLength = 300; // dit length in milliseconds
  private sequenceLength: number;
  private countDownAccuracy = 100; // number of milliseconds to update coundtown timer
  /*
    BehaviorSubject used because regular subject could emit first value before subscriber connects,
    also we don't need to manually trigger for the first time
    Trigger is used to restart timer on resume from background
  */
  private trigger$ = new BehaviorSubject<boolean>(true);
  private timeToNextSequence$: Observable<number>;
  private sequenceInterval$: Observable<number>;

  constructor(morse: MorseService, private ngZone: NgZone) {
    const morseBinaryEncoded = morse.encodeBinary(this.message);
    this.sequenceLength = morseBinaryEncoded.length * this.ditLength;
    // minimum pause between sequences, used to calculate how many sequences we can do per minute
    const pauseLength = this.ditLength * 14;
    // repeat every 30 or 60 seconds depenging on sequence length
    this.repeatEvery = this.sequenceLength + pauseLength >= 30000 ? 60000 : 30000;

    // take binary morse stream and emit values with timed delay
    this.morseStream$ = from(morseBinaryEncoded).pipe(
      concatMap((val) => of(val).pipe(
        delay(this.ditLength),
      )),
      distinctUntilChanged(),
      endWith(false), // switch off at the end
    );


    this.timeToNextSequence$ = this.trigger$.pipe(
      filter((val) => val),
      switchMap(
        () => defer(() => of(this.calcTimeToNextSequence()))
      ),
    );

    // emits every time we need to start new sequence
    this.sequenceInterval$ = this.timeToNextSequence$.pipe(
      switchMap((val) => timer(val, this.repeatEvery)),
      share(),
    );

    // emits number of milliseconds left until next seq. starts
    this.countDown$ = merge(
        this.timeToNextSequence$,
        this.sequenceInterval$
          .pipe(
            delay(this.sequenceLength), // wait until sequence ends
            mapTo(this.repeatEvery - this.sequenceLength), // emit value until next sequence
          ),
      ).pipe(
      switchMap((timeout) => interval(this.countDownAccuracy).pipe(
        scan((acc, _) => acc - this.countDownAccuracy, timeout),
        takeWhile((remaining) => remaining >= 0),
        endWith(0),
      )),
    );

    this.stream$ = this.sequenceInterval$.pipe(
      switchMap(() => this.morseStream$.pipe(
        takeUntil(this.trigger$.pipe(
            filter((val) => val === false),
          ),
        ),
        endWith(false),
      )),
      share(), // stream is shared between signal component and flash service
    );


    // stop timer if app is in backround, reset on resume
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

  resetTimer(): void {
    this.trigger$.next(true);
  }

  stopTimer() {
    this.trigger$.next(false);
  }

  calcTimeToNextSequence(): number {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1, 0, 0);
    const diff = next.getTime() - Date.now(); // time until beginning of the next minute
    return diff < this.repeatEvery ? diff : diff - this.repeatEvery;
  }
}
