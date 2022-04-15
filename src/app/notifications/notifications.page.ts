import { Component } from '@angular/core';
import { Weekday } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from '../notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {

  notificationOptions = [
    {
      title: 'never',
      value: null,
    },
    {
      title: 'everyDay',
      value: [
        Weekday.Monday,
        Weekday.Tuesday,
        Weekday.Wednesday,
        Weekday.Thursday,
        Weekday.Friday,
        Weekday.Saturday,
        Weekday.Sunday,
      ],
    },
    {
      title: 'workdays',
      value: [
        Weekday.Monday,
        Weekday.Tuesday,
        Weekday.Wednesday,
        Weekday.Thursday,
        Weekday.Friday,
      ],
    },
    {
      title: 'weekends',
      value: [
        Weekday.Saturday,
        Weekday.Sunday,
      ],
    },
  ];

  constructor(
    public notifications: NotificationsService,
    private translate: TranslateService,
    private toast: ToastController,
  ) { }

  get notificationTime() {
    return `${this.notifications.eventHour}:00`;
  }

  get showRequestButton() {
    return this.notifications.permission === 'prompt' || this.notifications.permission === 'prompt-with-rationale';
  }

  get showSettingsButton() {
    return this.notifications.permission === 'denied';
  }

  get showControls() {
    return this.notifications.permission === 'granted';
  }

  get notificationOption() {
    return null;
  }

  set notificationOption(value: null | Weekday[]) {
    if (value === null) {
      this.notifications.cancel().then(() => this.presentToast('disabled'));
    } else {
      const body = this.translate.instant('page.notifications.messageBody');
      const title = this.translate.instant('page.notifications.messageTitle');
      this.notifications.set(value, body, title).then(() => this.presentToast());
    }
  }

  async presentToast(message = 'saved') {
    const toast = await this.toast.create({
      message: this.translate.instant(`pages.notifications.${message}`),
      duration: 1500,
    });
    toast.present();
  }
}
