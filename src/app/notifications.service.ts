import { Injectable, NgZone } from '@angular/core';
import { PermissionState } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { LocalNotifications, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { LitwaveEvent } from './models/event.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  readonly minutesBefore = 5; // notify N minutes before event start

  permission: PermissionState;
  pendingNotifications: PendingLocalNotificationSchema[] = [];
  private resumeSubscription: Subscription;

  constructor(
    private platform: Platform,
    private ngZone: NgZone,
    private translate: TranslateService,
  ) {
    this.init();
  }

  async scheduleEventNotification(event: LitwaveEvent): Promise<void> {
    if (!event.scheduledTime) { return; }
    const fireAt = (event.scheduledTime - this.minutesBefore * 60) * 1000;
    if (fireAt <= Date.now()) { return; } // already past, skip
    // PermissionState type omits 'granted' but the runtime value can be 'granted'
    if ((this.permission as string) !== 'granted') {
      await this.requestPermissions();
      if ((this.permission as string) !== 'granted') { return; }
    }
    await LocalNotifications.schedule({
      notifications: [{
        id: this.eventNotifId(event.id),
        title: event.name || event.message,
        body: this.translate.instant('pages.notifications.messageBody'),
        channelId: 'eventAlarm',
        schedule: { at: new Date(fireAt), allowWhileIdle: true },
        extra: { eventId: event.id },
      }],
    });
    await this.refreshPending();
  }

  async cancelEventNotification(eventId: string): Promise<void> {
    await LocalNotifications.cancel({ notifications: [{ id: this.eventNotifId(eventId) }] });
    await this.refreshPending();
  }

  isScheduled(eventId: string): boolean {
    const id = this.eventNotifId(eventId);
    return this.pendingNotifications.some(n => n.id === id);
  }

  public openSettings() {
    if (!this.platform.is('capacitor')) { return; }
    return NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
    });
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

  async refreshPending(): Promise<void> {
    const { notifications } = await LocalNotifications.getPending();
    this.pendingNotifications = notifications;
  }

  private eventNotifId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash + id.charCodeAt(i)) & 0x7fffffff;
    }
    return hash || 1;
  }

  private async createChannel() {
    LocalNotifications.createChannel({
      id: 'eventAlarm',
      name: 'litwave',
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
    this.refreshPending();
    if (this.platform.is('android')) {
      // create channel on android if not yet created
      const { channels } = await LocalNotifications.listChannels();
      if (channels.length < 2) {
        this.createChannel();
      }
    }
  }

}
