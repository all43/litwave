import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MESSAGE_PRESETS, MessagePreset } from '../../../lib/presets';
import { getUnsupportedChars } from '../../../lib/morse-encode';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'web-event-create',
  standalone: false,
  template: `
    <div class="card">
      <h2>{{ 'pages.events.create' | translate }}</h2>

      <div class="form-group">
        <label>{{ 'pages.events.eventName' | translate }}</label>
        <input type="text"
          [placeholder]="'pages.events.eventNamePlaceholder' | translate"
          [(ngModel)]="eventName" />
      </div>

      <div class="form-group">
        <label>{{ 'pages.events.message' | translate }}</label>
        <div class="message-field" (click)="showPicker = !showPicker">
          <span *ngIf="selectedLabel" class="selected-text">{{ selectedLabel }}</span>
          <span *ngIf="!selectedLabel" class="placeholder">{{ 'pages.events.messagePlaceholder' | translate }}</span>
          <span class="chevron">{{ showPicker ? '▲' : '▼' }}</span>
        </div>

        <div class="picker-panel" *ngIf="showPicker">
          <div class="picker-tabs">
            <button
              *ngFor="let cat of categories"
              class="picker-tab"
              [class.active]="activeCategory === cat"
              (click)="activeCategory = cat"
            >{{ 'presets.categories.' + cat | translate }}</button>
            <button
              class="picker-tab"
              [class.active]="activeCategory === 'custom'"
              (click)="activeCategory = 'custom'"
            >{{ 'presets.categories.custom' | translate }}</button>
          </div>

          <div class="picker-body" *ngIf="activeCategory !== 'custom'">
            <button
              *ngFor="let p of presetsByCategory(activeCategory)"
              class="preset-row"
              [class.selected]="selectedMessage === p.message"
              (click)="selectPreset(p)"
            >
              <span class="radio"></span>
              <span class="preset-label">{{ p.label }}</span>
              <span class="preset-msg">{{ p.message }}</span>
            </button>
          </div>

          <div class="custom-input-group" *ngIf="activeCategory === 'custom'">
            <input type="text" maxlength="30"
              [placeholder]="'pages.events.customMessagePlaceholder' | translate"
              [ngModel]="customInput" (ngModelChange)="onCustomInput($event)" />
            <div *ngIf="customUnsupported.length" class="validation-error">
              {{ 'pages.events.unsupportedChars' | translate:{ chars: customUnsupported.join(', ') } }}
            </div>
            <button class="btn" (click)="confirmCustom()"
              [disabled]="!customInput || customUnsupported.length > 0">
              {{ 'common.save' | translate }}
            </button>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>{{ 'pages.events.scheduledTime' | translate }}</label>
        <div class="date-field" (click)="openDatePicker()">
          <span *ngIf="eventTime">{{ eventTime | date:'d MMM yyyy, HH:mm' }}</span>
          <span *ngIf="!eventTime" class="placeholder">{{ 'pages.events.scheduledTime' | translate }}</span>
          <span *ngIf="!eventTime" class="optional">{{ 'pages.events.noTime' | translate }}</span>
          <button *ngIf="eventTime" class="clear-date" (click)="clearDate($event)">✕</button>
        </div>

        <div class="modal-backdrop" *ngIf="showDatePicker" (click)="cancelDatePicker()"></div>
        <div class="date-picker-modal" *ngIf="showDatePicker">
          <h3>{{ 'pages.events.scheduledTime' | translate }}</h3>
          <input type="datetime-local" [(ngModel)]="datePickerValue" [min]="minDatetime" />
          <div class="date-picker-actions">
            <button class="btn btn-outline" (click)="cancelDatePicker()">{{ 'common.cancel' | translate }}</button>
            <button class="btn" (click)="confirmDatePicker()">{{ 'common.ok' | translate }}</button>
          </div>
        </div>
      </div>

      <button class="btn" (click)="onGenerate()" [disabled]="!selectedMessage">
        {{ 'pages.events.addEvent' | translate }}
      </button>
    </div>
  `,
})
export class EventCreateComponent {
  @Output() generate = new EventEmitter<{ message: string; name: string; scheduledTime?: number }>();

  presets = MESSAGE_PRESETS;
  categories = [...new Set(MESSAGE_PRESETS.map(p => p.category))] as string[];
  activeCategory = this.categories[0];
  showPicker = false;
  selectedMessage = '';
  selectedLabel = '';
  customInput = '';
  customUnsupported: string[] = [];
  eventName = '';
  eventTime: Date | null = null;
  showDatePicker = false;
  datePickerValue = '';
  minDatetime = '';

  presetsByCategory(cat: string): MessagePreset[] {
    return this.presets.filter(p => p.category === cat);
  }

  selectPreset(preset: MessagePreset): void {
    this.selectedMessage = preset.message;
    this.selectedLabel = preset.label;
    this.showPicker = false;
  }

  onCustomInput(value: string): void {
    this.customInput = value.toUpperCase();
    this.customUnsupported = this.customInput ? getUnsupportedChars(this.customInput) : [];
  }

  confirmCustom(): void {
    if (!this.customInput || this.customUnsupported.length > 0) return;
    this.selectedMessage = this.customInput;
    this.selectedLabel = this.customInput;
    this.showPicker = false;
  }

  openDatePicker(): void {
    this.showDatePicker = true;
    this.minDatetime = this.toLocalDatetimeString(new Date());
    if (this.eventTime) {
      this.datePickerValue = this.toLocalDatetimeString(this.eventTime);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(22, 0, 0, 0);
      this.datePickerValue = this.toLocalDatetimeString(tomorrow);
    }
  }

  confirmDatePicker(): void {
    if (this.datePickerValue) {
      this.eventTime = new Date(this.datePickerValue);
    }
    this.showDatePicker = false;
  }

  cancelDatePicker(): void {
    this.showDatePicker = false;
  }

  clearDate(event: Event): void {
    event.stopPropagation();
    this.eventTime = null;
    this.datePickerValue = '';
  }

  onGenerate(): void {
    if (!this.selectedMessage) return;
    const result: { message: string; name: string; scheduledTime?: number } = {
      message: this.selectedMessage,
      name: this.eventName || '',
    };
    if (this.eventTime) {
      result.scheduledTime = Math.floor(this.eventTime.getTime() / 1000);
    }
    this.generate.emit(result);
  }

  private toLocalDatetimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
