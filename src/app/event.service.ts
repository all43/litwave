import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';
import { LitwaveEvent } from './models/event.model';
import { MessageService } from './message.service';
import { NotificationsService } from './notifications.service';

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
    return `https://litwave.app/event?d=${this.encodePayload(event)}`;
  }

  generateDeepLink(event: LitwaveEvent): string {
    return `litwave://event?d=${this.encodePayload(event)}`;
  }

  parseUrl(url: string): LitwaveEvent | null {
    try {
      let searchParams: URLSearchParams;
      if (url.startsWith('litwave://')) {
        const queryString = url.split('?')[1];
        if (!queryString) { return null; }
        searchParams = new URLSearchParams(queryString);
      } else {
        const parsed = new URL(url);
        searchParams = parsed.searchParams;
      }

      // New base64 payload format
      const d = searchParams.get('d');
      if (d) {
        return this.decodePayload(d);
      }

      // Legacy plain-param format (backwards compat)
      const msg = searchParams.get('msg');
      if (!msg) { return null; }
      const event: LitwaveEvent = { id: this.generateId(), message: msg.toUpperCase() };
      const t = searchParams.get('t');
      if (t) {
        const ts = parseInt(t, 10);
        if (!isNaN(ts)) { event.scheduledTime = ts; }
      }
      const name = searchParams.get('name');
      if (name) { event.name = name; }
      return event;
    } catch {
      return null;
    }
  }

  private encodePayload(event: LitwaveEvent): string {
    const payload: Record<string, string | number> = { msg: event.message };
    if (event.name) { payload.name = event.name; }
    if (event.scheduledTime) { payload.t = event.scheduledTime; }
    // URL-safe base64 (no +, /, or padding =); TextEncoder handles non-Latin1
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const binary = String.fromCharCode(...bytes);
    return btoa(binary)
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private decodePayload(encoded: string): LitwaveEvent | null {
    try {
      // Restore standard base64 padding
      const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
        + '=='.slice(0, (4 - encoded.length % 4) % 4);
      const binary = atob(padded);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const payload = JSON.parse(new TextDecoder().decode(bytes));
      if (!payload.msg) { return null; }
      const event: LitwaveEvent = { id: this.generateId(), message: String(payload.msg).toUpperCase() };
      if (payload.name) { event.name = String(payload.name); }
      if (payload.t) {
        const ts = Number(payload.t);
        if (!isNaN(ts)) { event.scheduledTime = ts; }
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
