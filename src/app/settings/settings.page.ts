import { Component, OnInit } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { AlertController } from '@ionic/angular';
import { Torch } from '@capawesome/capacitor-torch';
import { LanguageItem, SettingsService } from '../settings.service';
import { NotificationsService } from '../notifications.service';
import { DIT_LENGTH_MS } from '../message-timing';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: false,
})
export class SettingsPage implements OnInit {
  languages: LanguageItem[] = [];
  msFormatter = (value: number) => `${value}ms`;

  testActive = false;
  showAdvancedSettings = false;
  private testTimeouts: ReturnType<typeof setTimeout>[] = [];

  get screenTransition(): string {
    const ms = this.settings.screenTransitionMs;
    return ms > 0 ? `opacity ${ms}ms` : 'none';
  }

  constructor(
    public settings: SettingsService,
    public notifications: NotificationsService,
    private translate: TranslateService,
    private alertController: AlertController,
  ) {
    this.languages = [...settings.languages];
    this.languages.unshift({ code: 'auto', name: this.translate.instant('common.autoLanguage') });
  }

  ngOnInit() {}

  ionViewDidLeave() {
    this.cancelTest();
  }

  // O = – – – — three dahs, long flashes are easier to judge alignment
  runTest() {
    this.cancelTest();
    const dit = DIT_LENGTH_MS;
    const dah = dit * 3;
    const gap = dit;       // inter-element gap
    const torchDelay = this.settings.flashlightDelayMs;

    // dah on/off edges: on─dah─off─gap─on─dah─off─gap─on─dah─off
    const onAt  = [0,              dah + gap,              (dah + gap) * 2          ];
    const offAt = [dah,            dah + gap + dah,        (dah + gap) * 2 + dah    ];

    onAt.forEach(t => {
      this.testTimeouts.push(setTimeout(() => { this.testActive = true; },  t));
      this.testTimeouts.push(setTimeout(() => { this.tryTorch(true); }, t + torchDelay));
    });
    offAt.forEach(t => {
      this.testTimeouts.push(setTimeout(() => { this.testActive = false; }, t));
      this.testTimeouts.push(setTimeout(() => { this.tryTorch(false); }, t + torchDelay));
    });
  }

  private cancelTest() {
    this.testTimeouts.forEach(clearTimeout);
    this.testTimeouts = [];
    this.testActive = false;
    this.tryTorch(false);
  }

  private tryTorch(on: boolean): void {
    (on ? Torch.enable() : Torch.disable()).catch(() => {}); // no-op on web
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
