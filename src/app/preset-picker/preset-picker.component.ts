import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MESSAGE_PRESETS, MessagePreset } from '../presets';
import { getUnsupportedChars } from '../morse-encode';

@Component({
  selector: 'app-preset-picker',
  templateUrl: 'preset-picker.component.html',
  styleUrls: ['preset-picker.component.scss'],
  standalone: false,
})
export class PresetPickerComponent {
  @Input() selectedMessage = '';
  @Input() showCustomTab = false;
  @Output() presetSelected = new EventEmitter<MessagePreset>();
  @Output() customConfirmed = new EventEmitter<string>();

  presetCategories = [...new Set(MESSAGE_PRESETS.map(p => p.category))];
  activeCategory: MessagePreset['category'] | 'custom' = 'general';
  pendingCustom = '';
  unsupportedChars: string[] = [];

  get filteredPresets(): MessagePreset[] {
    if (this.activeCategory === 'custom') { return []; }
    return MESSAGE_PRESETS.filter(p => p.category === this.activeCategory);
  }

  selectCategory(cat: MessagePreset['category'] | 'custom'): void {
    this.activeCategory = cat;
  }

  selectPreset(preset: MessagePreset): void {
    this.presetSelected.emit(preset);
  }

  onCustomInput(): void {
    this.unsupportedChars = getUnsupportedChars(this.pendingCustom.trim());
  }

  confirmCustom(): void {
    const text = this.pendingCustom.trim().toUpperCase();
    if (!text) { return; }
    this.unsupportedChars = getUnsupportedChars(text);
    if (this.unsupportedChars.length > 0) { return; }
    this.customConfirmed.emit(text);
    this.pendingCustom = '';
    this.unsupportedChars = [];
  }
}
