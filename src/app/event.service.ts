import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { LitwaveEvent } from './models/event.model';
import { MessageService } from './message.service';
import { NotificationsService } from './notifications.service';
import { generateUrl, generateDeepLink, parseUrl, generateId } from '../lib/event-codec';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly storageKey = 'litwave-events';
  private readonly activeKey = 'litwave-active-event';

  events$ = new BehaviorSubject<LitwaveEvent[]>([]);
  activeEventId$ = new BehaviorSubject<string | null>(null);

  constructor(
    private messageService: MessageService,
    private notifications: NotificationsService,
  ) {
    this.load();
  }

  async addEvent(event: LitwaveEvent): Promise<void> {
    const events = this.events$.value;
    const existing = events.findIndex((e) => e.id === event.id);
    if (existing >= 0) {
      events[existing] = event;
    } else {
      events.unshift(event);
    }
    this.events$.next([...events]);
    await this.save();
    this.notifications.scheduleEventNotification(event);
  }

  async removeEvent(id: string): Promise<void> {
    const events = this.events$.value.filter((e) => e.id !== id);
    this.events$.next(events);
    if (this.activeEventId$.value === id) {
      this.activeEventId$.next(null);
      await Preferences.remove({ key: this.activeKey });
    }
    await this.save();
    this.notifications.cancelEventNotification(id);
  }

  async clearActiveEvent(): Promise<void> {
    this.activeEventId$.next(null);
    await Preferences.remove({ key: this.activeKey });
  }

  async setActiveEvent(id: string): Promise<void> {
    const event = this.events$.value.find((e) => e.id === id);
    if (event) {
      this.activeEventId$.next(id);
      this.messageService.setMessage(event.message);
      await Preferences.set({ key: this.activeKey, value: id });
    }
  }

  generateUrl(event: LitwaveEvent): string {
    return generateUrl(event);
  }

  generateDeepLink(event: LitwaveEvent): string {
    return generateDeepLink(event);
  }

  parseUrl(url: string): LitwaveEvent | null {
    return parseUrl(url);
  }

  private async load(): Promise<void> {
    const { value: eventsJson } = await Preferences.get({ key: this.storageKey });
    const events: LitwaveEvent[] = eventsJson ? JSON.parse(eventsJson) : [];
    this.events$.next(events);

    const { value: activeId } = await Preferences.get({ key: this.activeKey });
    const activeEvent = activeId ? events.find((e) => e.id === activeId) : null;
    if (activeEvent) {
      this.activeEventId$.next(activeEvent.id);
      this.messageService.setMessage(activeEvent.message);
    }
  }

  private async save(): Promise<void> {
    await Preferences.set({
      key: this.storageKey,
      value: JSON.stringify(this.events$.value),
    });
  }
}
