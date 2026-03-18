import { Component } from '@angular/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { SettingsService } from '../settings.service';
import { MessageService } from '../message.service';
import { MESSAGE_PRESETS, MessagePreset } from '../presets';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  presets = MESSAGE_PRESETS;
  selectedCategory: MessagePreset['category'] = 'general';
  selectedMessage: string;
  filteredPresets: MessagePreset[];

  constructor(
    private settings: SettingsService,
    public messageService: MessageService,
  ) {
    this.filteredPresets = this.getPresetsForCategory(this.selectedCategory);
    this.selectedMessage = this.filteredPresets[0].message;
  }

  // note: ionic lifecycle hooks only work inside ionic page components
  ionViewDidEnter() {
    if (this.settings.keepalive) {
      KeepAwake.keepAwake();
    }
  }

  ionViewDidLeave() {
    KeepAwake.allowSleep();
  }

  onCategoryChange(category: MessagePreset['category']) {
    this.selectedCategory = category;
    this.filteredPresets = this.getPresetsForCategory(category);
    this.selectedMessage = this.filteredPresets[0].message;
    this.messageService.setMessage(this.selectedMessage);
  }

  onPresetChange(message: string) {
    this.selectedMessage = message;
    this.messageService.setMessage(message);
  }

  private getPresetsForCategory(category: MessagePreset['category']): MessagePreset[] {
    return this.presets.filter((p) => p.category === category);
  }
}
