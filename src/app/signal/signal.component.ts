import { Component, OnDestroy,  } from '@angular/core';
import { FlashlightService } from '../flashlight.service';
import { MessageService } from '../message.service';

@Component({
  selector: 'app-signal',
  templateUrl: './signal.component.html',
  styleUrls: ['./signal.component.scss'],
})
export class SignalComponent implements OnDestroy {
  syncFlashlight = false;
  constructor(public messageService: MessageService, private flashlight: FlashlightService) {}

  ngOnDestroy() {
    this.syncFlashlight = false;
    this.flashlight.unsync();
  }

  toggleFlash(val) {
    const action = val ? 'sync' : 'unsync';
    this.flashlight[action]();
  }
}
