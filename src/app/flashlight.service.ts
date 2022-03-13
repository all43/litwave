import { Injectable } from '@angular/core';
import { Flashlight } from '@awesome-cordova-plugins/flashlight/ngx';
import { MessageService } from './message.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FlashlightService {

  private subscribtion: Subscription;

  constructor(private light: Flashlight, private message: MessageService) { }
  on() {
    this.light.switchOn();
  }

  off() {
    this.light.switchOff();
  }

  sync() {
    this.subscribtion = this.message.stream$
      .subscribe((state) => {
      const action = state ? 'switchOn' : 'switchOff';
      this.light[action]();
    });
  }

  unsync() {
    this.subscribtion.unsubscribe();
    this.off();
  }
}
