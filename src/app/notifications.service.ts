import { Injectable, NgZone } from '@angular/core';
import { PermissionState } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { LocalNotifications, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  // TODO: decide if we need permission state and notifications as observables

  permission: PermissionState;
  pendingNotifications: PendingLocalNotificationSchema[] = [];
  private resumeSubscription: Subscription;

  constructor(
      private openNativeSettings: OpenNativeSettings,
      private platform: Platform,
      private router: Router,
      private ngZone: NgZone,
    ) {
    this.init();
  }

  public async test() {
    const { notifications } = await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          body: 'test message',
          title: 'test title',
          sound: 'td.mp3',
          channelId: 'eventAlarm',
          schedule: {
            at: new Date(Date.now() + 3000),
            allowWhileIdle: true,
            // repeats: true,
            // on: {
            //   hour: 21,
            //   minute: 59,
            //   second: 35,
            // },
          },
        }
      ],
    });
    this.getPendingNotifications();
  }

  public cancel() {
    LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  public openSettings() {
    this.openNativeSettings.open('application_details');
  }

  public async checkPermission() {
    const { display: permission } = await LocalNotifications.checkPermissions();
    this.permission = permission;
    return this.permission;
  }

  async requestPermissions() {
    const { display: permission } = await LocalNotifications.requestPermissions();
    this.permission = permission;
  }

  private async getPendingNotifications() {
    const { notifications } = await LocalNotifications.getPending();
    this.pendingNotifications = notifications;
    return notifications;
  }

  private async createChannel() {
    LocalNotifications.createChannel({
      id: 'eventAlarm',
      name: 'organise',
      sound: 'td.mp3',
      importance: 4,
      vibration: true,
      lights: true,
      lightColor: '#0000FF',
    });
  }

  private async init() {
    const permission = await this.checkPermission();
    if (permission === 'denied' && (!this.resumeSubscription || this.resumeSubscription.closed)) {
      /*
        if permission was previously denied check for resume event in case went to device settings
        and allowed notifications there. If notifications is not denied anymore - stop listening to resume event
      */
      this.resumeSubscription = this.platform.resume.subscribe(async () => {
        this.ngZone.run(async () => {
          const p = await this.checkPermission();
          if (p !== 'denied') {
            this.resumeSubscription.unsubscribe();
          }
        });
      });
    }
    this.getPendingNotifications();
    this.attachListener();
    if (this.platform.is('android')) {
      // create channel on android if not yet created
      const { channels } = await LocalNotifications.listChannels();
      if (channels.length < 2) {
        this.createChannel();
      }
    }
  }

  private attachListener() {
    const listener = () => {
      this.ngZone.run(() => {
        this.router.navigate(['/'], { replaceUrl: true });
      });
    };
    LocalNotifications.addListener('localNotificationActionPerformed', listener);
  }
}
