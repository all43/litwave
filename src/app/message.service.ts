import { App } from '@capacitor/app';
import { Injectable } from '@angular/core';
import { MorseService } from './morse.service';
import { from, Observable, Subject, ReplaySubject, of, timer,  } from 'rxjs';
import {
  concatMap,
  delay,
  distinctUntilChanged,
  endWith,
  switchMap,
  share,
  takeUntil,
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message = 'STOP WAR'; // TODO: move to config
  public stream: Observable<boolean>;
  public timeStream: Observable<number>;
  public morseStream: Observable<boolean>;
  public cycleLength: number;
  public repeatEvery: number;
  // replay subject used because regular subject could emit first value before subscriber connects
  private trigger = new ReplaySubject<number>(1);
  private stop = new Subject<void>();
  private ditLength = 300; // dit length in milliseconds

  constructor(morse: MorseService) {
    const morseBinaryEncoded = morse.encodeBinary(this.message);
    this.cycleLength = morseBinaryEncoded.length * this.ditLength;
    const pauseLength = this.ditLength * 14;
    // repeat every 30 or 60 seconds depenging on cycle length
    this.repeatEvery = this.cycleLength + pauseLength >= 30000 ? 60000 : 30000;
    this.timeStream = this.trigger.pipe(
      switchMap((initialDelay) => timer(initialDelay, this.repeatEvery)),
    );
    this.morseStream = from(morseBinaryEncoded).pipe(
      concatMap((val) => of(val).pipe(
        delay(this.ditLength),
      )),
      distinctUntilChanged(),
      endWith(false), // switch off at the end
    );
    this.stream = this.timeStream.pipe(
      switchMap(() => this.morseStream),
      takeUntil(this.stop),
      share(), // supposed to be shared by multiple subscribers
    );
    this.updateTimer();
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        this.updateTimer();
      }
    });
  }
  updateTimer(): void {
    // this.stop.next(); // cancel running timer
    setTimeout(() => {
      const timeout = this.timeToNextCycle();
      this.trigger.next(timeout);
    }, 0);
  }

  timeToNextCycle(): number {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1, 0, 0);
    const diff = next.getTime() - Date.now(); // time until beginning of the next minute
    return diff < this.repeatEvery ? diff : diff - this.repeatEvery;
  }
}
