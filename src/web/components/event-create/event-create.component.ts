import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MESSAGE_PRESETS, MessagePreset } from '../../../lib/presets';
import { getUnsupportedChars } from '../../../lib/morse-encode';

@Component({
  selector: 'web-event-create',
  standalone: false,
  template: `
    <div class="card">
      <h2>Create Event</h2>
      <div class="form-group">
        <label for="preset">Message Preset</label>
        <select id="preset" (change)="onPresetChange($event)" [ngModel]="selectedPreset">
          <ng-container *ngFor="let cat of categories">
            <optgroup [label]="catLabels[cat]">
              <option *ngFor="let p of presetsByCategory(cat)" [value]="p.message">{{ p.label }}</option>
            </optgroup>
          </ng-container>
          <option value="">Custom...</option>
        </select>
      </div>

      <div class="form-group">
        <label for="customMsg">Or Custom Message (max 30 chars)</label>
        <input type="text" id="customMsg" maxlength="30" placeholder="Type your message"
               [ngModel]="customMessage" (ngModelChange)="onCustomChange($event)" />
        <small *ngIf="unsupportedChars.length" style="color: var(--danger); font-size: 0.8rem; margin-top: 4px; display: block;">
          Unsupported chars: {{ unsupportedChars.join(', ') }}
        </small>
      </div>

      <div class="form-group">
        <label for="eventName">Event Name (optional)</label>
        <input type="text" id="eventName" placeholder="e.g. Birthday Party"
               [(ngModel)]="eventName" />
      </div>

      <div class="form-group">
        <label for="eventTime">Scheduled Time (optional)</label>
        <input type="datetime-local" id="eventTime"
               [(ngModel)]="eventTime" />
      </div>

      <button class="btn" (click)="onGenerate()" [disabled]="!effectiveMessage">
        Generate QR Code & Link
      </button>
    </div>
  `,
})
export class EventCreateComponent {
  @Output() generate = new EventEmitter<{ message: string; name: string; scheduledTime?: number }>();

  presets = MESSAGE_PRESETS;
  categories = ['general', 'meme', 'occasion'] as const;
  catLabels: Record<string, string> = { general: 'General', meme: 'Meme', occasion: 'Event' };
  selectedPreset = this.presets[0].message;
  customMessage = '';
  eventName = '';
  eventTime = '';
  unsupportedChars: string[] = [];

  get effectiveMessage(): string {
    return (this.customMessage || this.selectedPreset).toUpperCase();
  }

  presetsByCategory(cat: string): MessagePreset[] {
    return this.presets.filter(p => p.category === cat);
  }

  onPresetChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedPreset = value;
    if (value) {
      this.customMessage = '';
    }
    this.updateUnsupported();
  }

  onCustomChange(value: string): void {
    this.customMessage = value.toUpperCase();
    if (this.customMessage) {
      this.selectedPreset = '';
    }
    this.updateUnsupported();
  }

  onGenerate(): void {
    const msg = this.effectiveMessage;
    if (!msg) return;
    const result: { message: string; name: string; scheduledTime?: number } = {
      message: msg,
      name: this.eventName || '',
    };
    if (this.eventTime) {
      result.scheduledTime = Math.floor(new Date(this.eventTime).getTime() / 1000);
    }
    this.generate.emit(result);
  }

  private updateUnsupported(): void {
    const msg = this.effectiveMessage;
    this.unsupportedChars = msg ? getUnsupportedChars(msg) : [];
  }
}
