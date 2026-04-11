import { Injectable } from '@angular/core';
import { Torch } from '@capawesome/capacitor-torch';
import { MessageService } from './message.service';
import { SettingsService } from './settings.service';
import { Subject, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

const SESSION_LIMIT_MS = 10 * 60 * 1000; // 10 minutes — protects LED from sustained thermal stress

@Injectable({
  providedIn: 'root'
})
export class FlashlightService {

  readonly shutoff$ = new Subject<void>();
  private subscription: Subscription;
  private shutoffTimer: ReturnType<typeof setTimeout>;

  constructor(private message: MessageService, private settings: SettingsService) { }

  on() {
    Torch.enable();
  }

  off() {
    Torch.disable();
  }

  sync() {
    this.buildSubscription();

    if (this.settings.flashlightAutoShutoff) {
      this.shutoffTimer = setTimeout(() => {
        this.unsync();
        this.shutoff$.next();
      }, SESSION_LIMIT_MS);
    }
  }

  unsync() {
    this.subscription?.unsubscribe();
    clearTimeout(this.shutoffTimer);
    this.off();
  }

  private buildSubscription() {
    this.subscription?.unsubscribe();
    const delayMs = this.settings.flashlightDelayMs;
    const source$ = delayMs > 0
      ? this.message.stream$.pipe(delay(delayMs))
      : this.message.stream$;
    this.subscription = source$.subscribe((state) => {
      state ? Torch.enable() : Torch.disable();
    });
  }
}
