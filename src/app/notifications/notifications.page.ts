import { Component } from '@angular/core';
import { Weekday } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NotificationsService } from '../notifications.service';

type NotificationOptionsKey = 'never' | 'everyDay' | 'workdays' | 'weekends';
type NotificationOptions = {
  [key in NotificationOptionsKey]: Weekday[] | null;
};;
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {

  notificationOptions: NotificationOptions = {
    never: null,
    everyDay: [
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
      Weekday.Saturday,
      Weekday.Sunday,
    ],
    workdays: [
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
    ],
    weekends: [
      Weekday.Saturday,
      Weekday.Sunday,
    ],
  };

  notificationOptionsKeys: NotificationOptionsKey[];

  constructor(
    public notifications: NotificationsService,
    private translate: TranslateService,
    private toast: ToastController,
  ) {
    this.notificationOptionsKeys = Object.keys(this.notificationOptions) as NotificationOptionsKey[];
  }

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

  get notificationOption(): NotificationOptionsKey {
    const notificationsLength = this.notifications.pendingNotifications.length;
    const mapping: {[key: number]: NotificationOptionsKey} = {
      0: 'never',
      2: 'weekends',
      5: 'workdays',
      7: 'everyDay',
    };
    return mapping[notificationsLength];
  }

  set notificationOption(value: NotificationOptionsKey) {
    if (value === 'never') {
      this.notifications.cancel().then(() => this.presentToast('disabled'));
    } else {
      const weekdays = this.notificationOptions[value];
      const body = this.translate.instant('page.notifications.messageBody');
      const title = this.translate.instant('page.notifications.messageTitle');
      this.notifications.set(weekdays, body, title).then(() => this.presentToast());
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
