import { Injectable } from '@angular/core';
import { Torch } from '@capawesome/capacitor-torch';
import { MessageService } from './message.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlashlightService {

  private subscription: Subscription;

  constructor(private message: MessageService) { }

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
  }

  unsync() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.off();
  }
}
