import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { LitwaveEvent } from './models/event.model';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly storageKey = 'litwave-events';
  private readonly activeKey = 'litwave-active-event';

  events$ = new BehaviorSubject<LitwaveEvent[]>([]);
  activeEventId$ = new BehaviorSubject<string | null>(null);

  constructor(private messageService: MessageService) {
    this.load();
  }

  async addEvent(event: LitwaveEvent): Promise<void> {
    const events = this.events$.value;
    const existing = events.findIndex((e) => e.id === event.id);
    if (existing >= 0) {
      events[existing] = event;
    } else {
      events.push(event);
    }
    this.events$.next([...events]);
    await this.save();
  }

  async removeEvent(id: string): Promise<void> {
    const events = this.events$.value.filter((e) => e.id !== id);
    this.events$.next(events);
    if (this.activeEventId$.value === id) {
      this.activeEventId$.next(null);
      await Preferences.remove({ key: this.activeKey });
    }
    await this.save();
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
    const params = new URLSearchParams();
    params.set('msg', event.message);
    if (event.scheduledTime) {
      params.set('t', event.scheduledTime.toString());
    }
    if (event.name) {
      params.set('name', event.name);
    }
    return `https://litwave.app/event?${params.toString()}`;
  }

  generateDeepLink(event: LitwaveEvent): string {
    const params = new URLSearchParams();
    params.set('msg', event.message);
    if (event.scheduledTime) {
      params.set('t', event.scheduledTime.toString());
    }
    if (event.name) {
      params.set('name', event.name);
    }
    return `litwave://event?${params.toString()}`;
  }

  parseUrl(url: string): LitwaveEvent | null {
    try {
      // Handle both litwave:// and https://litwave.app/event? formats
      let searchParams: URLSearchParams;
      if (url.startsWith('litwave://')) {
        const queryString = url.split('?')[1];
        if (!queryString) { return null; }
        searchParams = new URLSearchParams(queryString);
      } else {
        const parsed = new URL(url);
        searchParams = parsed.searchParams;
      }

      const msg = searchParams.get('msg');
      if (!msg) { return null; }

      const event: LitwaveEvent = {
        id: this.generateId(),
        message: msg.toUpperCase(),
      };

      const t = searchParams.get('t');
      if (t) {
        const timestamp = parseInt(t, 10);
        if (!isNaN(timestamp)) {
          event.scheduledTime = timestamp;
        }
      }

      const name = searchParams.get('name');
      if (name) {
        event.name = name;
      }

      return event;
    } catch {
      return null;
    }
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  private async load(): Promise<void> {
    const { value: eventsJson } = await Preferences.get({ key: this.storageKey });
    const events: LitwaveEvent[] = eventsJson ? JSON.parse(eventsJson) : [];
    this.events$.next(events);

    const { value: activeId } = await Preferences.get({ key: this.activeKey });
    if (activeId && events.some((e) => e.id === activeId)) {
      this.activeEventId$.next(activeId);
    }
  }

  private async save(): Promise<void> {
    await Preferences.set({
      key: this.storageKey,
      value: JSON.stringify(this.events$.value),
    });
  }
}
