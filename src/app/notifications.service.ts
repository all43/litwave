import { Injectable } from '@angular/core';
import { PermissionState } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { LocalNotifications, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  // TODO: decide if we need permission state and notifications as observables

  permission: PermissionState;
  pendingNotifications: PendingLocalNotificationSchema[] = [];

  constructor(private openNativeSettings: OpenNativeSettings, private platform: Platform) {
    this.init();
  }

  async init() {
    const { display: permission } = await LocalNotifications.checkPermissions();
    this.permission = permission;
    console.log({ permission });
    this.getPendingNotifications();
    if (this.platform.is('android')) {
      // create channel on android if not yet created
      const { channels } = await LocalNotifications.listChannels();
      console.log(channels);
      if (channels.length < 2) {
        this.createChannel();
      }
    }
  }

  async getPendingNotifications() {
    const { notifications } = await LocalNotifications.getPending();
    this.pendingNotifications = notifications;
    console.log({ notifications });
    return notifications;
  }

  async createChannel() {
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

  async requestPermissions() {
    const { display: permission } = await LocalNotifications.requestPermissions();
    this.permission = permission;
    console.log({ permission });
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
}
