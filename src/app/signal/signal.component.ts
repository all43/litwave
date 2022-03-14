import { Component, OnDestroy,  } from '@angular/core';
import { FlashlightService } from '../flashlight.service';
import { MessageService } from '../message.service';
import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';

@Component({
  selector: 'app-signal',
  templateUrl: './signal.component.html',
  styleUrls: ['./signal.component.scss'],
})
export class SignalComponent implements OnDestroy {
  syncFlashlight = false;
  constructor(public messageService: MessageService, private flashlight: FlashlightService, private insomnia: Insomnia) {}

  ionViewDidEnter() {
    this.insomnia.keepAwake();
  }

  ionViewDidLeave() {
    this.insomnia.allowSleepAgain();
  }

  ngOnDestroy() {
    this.syncFlashlight = false;
    this.flashlight.unsync();
  }

  toggleFlash(val) {
    const action = val ? 'sync' : 'unsync';
    this.flashlight[action]();
  }
}
