import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Platform } from '@ionic/angular';
import { NotificationsService } from '../notifications.service';
import { EventService } from '../event.service';
import { LitwaveEvent } from '../models/event.model';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: false,
})
export class NotificationsPage implements OnInit, OnDestroy {
  scheduledEvents: LitwaveEvent[] = [];
  private sub: Subscription;

  constructor(
    public notifications: NotificationsService,
    private eventService: EventService,
    private platform: Platform,
  ) {}

  ngOnInit() {
    this.notifications.refreshPending();
    this.sub = this.eventService.events$.subscribe(events => {
      this.scheduledEvents = events.filter(e => !!e.scheduledTime);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get showRequestButton() {
    const p = this.notifications.permission;
    return p === 'prompt' || p === 'prompt-with-rationale'
      || (p === 'denied' && !this.platform.is('capacitor'));
  }

  get showSettingsButton() {
    return this.notifications.permission === 'denied' && this.platform.is('capacitor');
  }

  get needsPermission() {
    return this.showRequestButton || this.showSettingsButton;
  }

  get showWebDeniedNote() {
    return this.notifications.permission === 'denied' && !this.platform.is('capacitor');
  }

  reminderTime(event: LitwaveEvent): string {
    const ms = (event.scheduledTime! - this.notifications.minutesBefore * 60) * 1000;
    return new Date(ms).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  isPast(event: LitwaveEvent): boolean {
    const ms = (event.scheduledTime! - this.notifications.minutesBefore * 60) * 1000;
    return ms <= Date.now();
  }

  async toggleNotification(event: LitwaveEvent): Promise<void> {
    if (this.notifications.isScheduled(event.id)) {
      await this.notifications.cancelEventNotification(event.id);
    } else {
      await this.notifications.scheduleEventNotification(event);
    }
  }
}
