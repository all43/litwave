import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
        <label>
          {{ 'pages.events.scheduledTime' | translate }}
          <span class="label-tip">({{ 'pages.events.noTime' | translate }})</span>
        </label>
        <input type="datetime-local"
          [(ngModel)]="eventTime"
          [min]="minDateTime" />
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
  eventTime: string = '';
  minDateTime = this.getMinDateTime();

  private getMinDateTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

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

  onGenerate(): void {
    if (!this.selectedMessage) return;
    const result: { message: string; name: string; scheduledTime?: number } = {
      message: this.selectedMessage,
      name: this.eventName || '',
    };
    if (this.eventTime) {
      result.scheduledTime = Math.floor(new Date(this.eventTime).getTime() / 1000);
    }
    this.generate.emit(result);
  }
}