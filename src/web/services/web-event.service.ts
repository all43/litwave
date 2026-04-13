import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LitwaveEvent } from '../../lib/event.model';
import { parseUrl, generateUrl, generateDeepLink, generateId } from '../../lib/event-codec';

@Injectable({ providedIn: 'root' })
export class WebEventService {
  private readonly storageKey = 'litwave-events';
  events$ = new BehaviorSubject<LitwaveEvent[]>([]);

  constructor() {
    this.load();
  }

  addEvent(event: LitwaveEvent): void {
    const events = this.events$.value;
    const existing = events.findIndex((e) => e.id === event.id);
    if (existing >= 0) {
      events[existing] = event;
    } else {
      events.unshift(event);
    }
    this.events$.next([...events]);
    this.save();
  }

  removeEvent(id: string): void {
    const events = this.events$.value.filter((e) => e.id !== id);
    this.events$.next(events);
    this.save();
  }

  generateUrl = generateUrl;
  generateDeepLink = generateDeepLink;
  parseUrl = parseUrl;
  generateId = generateId;

  private load(): void {
    try {
      const json = localStorage.getItem(this.storageKey);
      const events: LitwaveEvent[] = json ? JSON.parse(json) : [];
      this.events$.next(events);
    } catch {
      this.events$.next([]);
    }
  }

  private save(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.events$.value));
  }
}
