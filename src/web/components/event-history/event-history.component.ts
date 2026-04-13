import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebEventService } from '../../services/web-event.service';
import { LitwaveEvent } from '../../../lib/event.model';

@Component({
  selector: 'web-event-history',
  standalone: false,
  template: `
    <div class="card">
      <h2>Event History</h2>
      <div *ngIf="!events.length" class="empty-state">No events yet. Create one above.</div>
      <div *ngFor="let ev of events" class="history-item">
        <div class="history-info">
          <h3>{{ ev.name || ev.message }}</h3>
          <p>{{ ev.message }} &middot; {{ formatTime(ev) }}</p>
        </div>
        <div class="history-actions">
          <button class="btn btn-outline btn-sm" (click)="loadEvent.emit(ev)">Load</button>
          <button class="btn btn-danger btn-sm" (click)="removeEvent(ev.id)">Delete</button>
        </div>
      </div>
    </div>
  `,
})
export class EventHistoryComponent {
  @Output() loadEvent = new EventEmitter<LitwaveEvent>();
  events: LitwaveEvent[] = [];

  private readonly eventService: WebEventService;

  constructor(eventService: WebEventService) {
    this.eventService = eventService;
    eventService.events$.subscribe(events => this.events = events);
  }

  formatTime(ev: LitwaveEvent): string {
    return ev.scheduledTime
      ? new Date(ev.scheduledTime * 1000).toLocaleString()
      : 'No scheduled time';
  }

  removeEvent(id: string): void {
    this.eventService.removeEvent(id);
  }
}
