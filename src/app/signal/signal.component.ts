import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
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
  private shutoffSub: Subscription;

  constructor(
    public messageService: MessageService,
    private flashlight: FlashlightService,
    private settings: SettingsService,
    private toastCtrl: ToastController,
    private translate: TranslateService,
  ) {
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

    this.shutoffSub = this.flashlight.shutoff$.subscribe(() => {
      this.syncFlashlight = false;
      this.showShutoffToast();
    });
  }

  ngOnDestroy() {
    this.syncFlashlight = false;
    this.flashlight.unsync();
    this.shutoffSub?.unsubscribe();
  }

  toggleFlash(val) {
    const action = val ? 'sync' : 'unsync';
    this.flashlight[action]();
    this.syncFlashlight = val;
    if (this.settings.autoSyncFlash === 'useRecent') {
      this.settings.lastSyncFlashlightValue = val;
    }
  }

  private async showShutoffToast() {
    const message = await this.translate.get('signal.autoShutoff').toPromise();
    const toast = await this.toastCtrl.create({ message, duration: 4000, position: 'bottom' });
    toast.present();
  }
}
