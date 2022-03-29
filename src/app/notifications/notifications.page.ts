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
    console.log({ permission });
  }

  async test() {
    const { notifications } = await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          body: 'test message',
          title: 'test title',
        }
      ],
    });
    this.getPendingNotifications();
  }

  openSettings() {
    this.openNativeSettings.open('application_details');
  }

}
