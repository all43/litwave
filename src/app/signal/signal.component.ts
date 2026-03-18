import { Component, OnDestroy, OnInit,  } from '@angular/core';
import { FlashlightService } from '../flashlight.service';
import { MessageService } from '../message.service';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-signal',
  templateUrl: './signal.component.html',
  styleUrls: ['./signal.component.scss'],
  standalone: false,
})
export class SignalComponent implements OnInit, OnDestroy {
  syncFlashlight: boolean;
  constructor(public messageService: MessageService, private flashlight: FlashlightService, private settings: SettingsService) {
    switch(settings.autoSyncFlash) {
      case 'never':
        this.syncFlashlight = false;
        break;
      case 'always':
        this.syncFlashlight = true;
        break;
      case 'useRecent':
        this.syncFlashlight = settings.lastSyncFlashlightValue;
    }
  }

  ngOnInit(): void {
    this.toggleFlash(this.syncFlashlight);
  }

  ngOnDestroy() {
    this.syncFlashlight = false;
    this.flashlight.unsync();
  }

  toggleFlash(val) {
    const action = val ? 'sync' : 'unsync';
    this.flashlight[action]();
    this.syncFlashlight = val;
    if (this.settings.autoSyncFlash === 'useRecent') {
      this.settings.lastSyncFlashlightValue = val;
    }
  }
}
