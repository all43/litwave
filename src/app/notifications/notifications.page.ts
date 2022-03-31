import { Component, OnInit } from '@angular/core';
import { PermissionState } from '@capacitor/core';
import { LocalNotifications, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  permission: PermissionState;
  pendingNotifications: PendingLocalNotificationSchema[] = [];

  constructor(private openNativeSettings: OpenNativeSettings) { }
  /* TODO: move notifications logic to a separate service once we have any external usage for it */

  ngOnInit() {
    this.init();
  }

  async init() {
    const { display: permission } = await LocalNotifications.checkPermissions();
    this.permission = permission;
    console.log({ permission });
    this.getPendingNotifications();
  }

  async getPendingNotifications() {
    const { notifications } = await LocalNotifications.getPending();
    this.pendingNotifications = notifications;
    console.log({ notifications });
    return notifications;
  }

  async requestPermissions() {
    const { display: permission } = await LocalNotifications.requestPermissions();
    this.permission = permission;
    const channels = await LocalNotifications.listChannels();
    console.log(channels);
    LocalNotifications.createChannel({
      id: 'eventAlarm',
      name: 'organise',
      sound: 'td.mp3',
      importance: 4,
      vibration: true,
      lights: true,
      lightColor: '#0000FF',
    });
    console.log({ permission });
  }

  async test() {
    const { notifications } = await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          body: 'test message',
          title: 'test title',
          // sound: 'td.mp3',
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

  cancel() {
    LocalNotifications.cancel({ notifications: [{ id: 1 }] });
  }

  openSettings() {
    this.openNativeSettings.open('application_details');
  }

}
