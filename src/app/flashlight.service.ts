import { Injectable } from '@angular/core';
import { Torch } from '@capawesome/capacitor-torch';
import { MessageService } from './message.service';
import { SettingsService } from './settings.service';
import { Subject, Subscription } from 'rxjs';

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
    this.subscription = this.message.stream$
      .subscribe((state) => {
      if (state) {
        Torch.enable();
      } else {
        Torch.disable();
      }
    });

    if (this.settings.flashlightAutoShutoff) {
      this.shutoffTimer = setTimeout(() => {
        this.unsync();
        this.shutoff$.next();
      }, SESSION_LIMIT_MS);
    }
  }

  unsync() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    clearTimeout(this.shutoffTimer);
    this.off();
  }
}
