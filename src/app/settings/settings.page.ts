import { Component, OnInit } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
declare const __NPM_PACKAGE_VERSION__: string;
import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { LanguageItem, SettingsService } from '../settings.service';
import { NotificationsService } from '../notifications.service';
import { FlashlightService } from '../flashlight.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit {
  languages: LanguageItem[] = [];
  version = __NPM_PACKAGE_VERSION__;
  msFormatter = (value: number) => `${value}ms`;

  constructor(
    public settings: SettingsService,
    public notifications: NotificationsService,
    private translate: TranslateService,
    private alertController: AlertController,
    private flashlight: FlashlightService,
  ) {
    this.languages = [...settings.languages];
    this.languages.unshift({ code: 'auto', name: this.translate.instant('common.autoLanguage') });
  }

  ngOnInit() {
  }

  onScreenTransitionChange(event: CustomEvent) {
    this.settings.screenTransitionMs = event.detail.value as number;
  }

  onFlashlightDelayChange(event: CustomEvent) {
    this.settings.flashlightDelayMs = event.detail.value as number;
    this.flashlight.setDelay(event.detail.value as number);
  }

  async resetConfirm() {
    const alert = await this.alertController.create({
      header:  this.translate.instant('pages.settings.reset.title'),
      message:  this.translate.instant('pages.settings.reset.message'),
      buttons: [
        {
          text: this.translate.instant('common.cancel'),
          role: 'cancel',
        }, {
          text: this.translate.instant('common.ok'),
          handler: () => {
            this.settings.reset();
          }
        }
      ]
    });
    await alert.present();
  }
}
