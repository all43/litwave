import { App } from '@capacitor/app';
import { Injectable, NgZone } from '@angular/core';
import { MESSAGE_PRESETS } from './presets';
import { BehaviorSubject, Observable } from 'rxjs';
import { createSignalEngine } from '../lib/signal-engine';
import { encodeBinaryWithBoundaries } from './morse-encode';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message$ = new BehaviorSubject<string>(MESSAGE_PRESETS[0].message);
  public countDown$: Observable<number>;
  public stream$: Observable<boolean>;
  private trigger$ = new BehaviorSubject<boolean>(true);

  constructor(private ngZone: NgZone) {
    const engine = createSignalEngine({
      message$: this.message$,
      trigger$: this.trigger$,
      encodeFn: (msg) => encodeBinaryWithBoundaries(msg),
    });

    this.stream$ = engine.stream$;
    this.countDown$ = engine.countDown$;

    App.addListener('appStateChange', ({ isActive }) => {
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
    this.trigger$.next(false);
    this.trigger$.next(true);
  }

  stopTimer(): void {
    this.trigger$.next(false);
  }
}
