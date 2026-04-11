import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
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
  isActive = false;
  syncFlashlight: boolean;
  private shutoffSub: Subscription;

  messageFontSize$ = this.messageService.message$.pipe(
    map(msg => {
      const len = (msg || '').length;
      if (len <= 6)  return '2.5rem';
      if (len <= 10) return '2rem';
      if (len <= 16) return '1.6rem';
      if (len <= 22) return '1.3rem';
      return '1.1rem';
    })
  );

  get screenTransition(): string {
    const ms = this.settings.screenTransitionMs;
    return ms > 0 ? `background-color ${ms}ms` : 'none';
  }

  constructor(
    public messageService: MessageService,
    private flashlight: FlashlightService,
    private settings: SettingsService,
    private toastCtrl: ToastController,
    private translate: TranslateService,
  ) {
    switch (settings.autoSyncFlash) {
      case 'never':
        this.syncFlashlight = false;
        break;
      case 'always':
        this.syncFlashlight = true;
        break;
      case 'useRecent':
        this.syncFlashlight = settings.lastSyncFlashlightValue;
        break;
    }
  }

  ngOnInit(): void {
    this.shutoffSub = this.flashlight.shutoff$.subscribe(() => {
      this.syncFlashlight = false;
      this.showShutoffToast();
    });
  }

  ngOnDestroy() {
    this.isActive = false;
    this.flashlight.unsync();
    this.shutoffSub?.unsubscribe();
  }

  deactivate() {
    if (this.isActive) {
      this.isActive = false;
      this.flashlight.unsync();
    }
  }

  toggleActive() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      if (this.syncFlashlight) {
        this.flashlight.sync();
      }
    } else {
      this.flashlight.unsync();
    }
  }

  toggleFlash(val: boolean) {
    this.syncFlashlight = val;
    if (this.settings.autoSyncFlash === 'useRecent') {
      this.settings.lastSyncFlashlightValue = val;
    }
    if (this.isActive) {
      this.flashlight[val ? 'sync' : 'unsync']();
    }
  }

  private async showShutoffToast() {
    const message = await this.translate.get('signal.autoShutoff').toPromise();
    const toast = await this.toastCtrl.create({ message, duration: 4000, position: 'bottom' });
    toast.present();
  }
}
