import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { SettingsService } from '../settings.service';
import { MessageService } from '../message.service';
import { EventService } from '../event.service';
import { MESSAGE_PRESETS, MessagePreset } from '../presets';

export type HomeMode = 'event' | 'preset';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  mode: HomeMode = 'preset';

  // Preset picker state
  showPicker = false;
  selectedPreset: MessagePreset = MESSAGE_PRESETS.find(p => p.message === this.settings.selectedPresetMessage)
    ?? MESSAGE_PRESETS.filter(p => p.category === 'general')[0];
  pendingPreset: MessagePreset | null = null;

  activeEvent$ = combineLatest([
    this.eventService.activeEventId$,
    this.eventService.events$,
  ]).pipe(
    map(([id, events]) => id ? (events.find((e) => e.id === id) ?? null) : null),
  );

  constructor(
    private settings: SettingsService,
    public messageService: MessageService,
    public eventService: EventService,
    private alertCtrl: AlertController,
    private router: Router,
  ) {
    // Sync mode and message with active event state
    this.eventService.activeEventId$.subscribe((id) => {
      if (id) {
        this.mode = 'event';
        // message already set by EventService
      } else {
        this.messageService.setMessage(this.selectedPreset.message);
      }
    });
  }

  ionViewDidEnter() {
    if (this.settings.keepalive) {
      KeepAwake.keepAwake();
    }
  }

  ionViewDidLeave() {
    KeepAwake.allowSleep();
  }

  // ── Mode switching ────────────────────────────────────────

  async switchToPreset() {
    const hasActiveEvent = !!this.eventService.activeEventId$.value;
    if (hasActiveEvent) {
      const confirmed = await this.confirmLeaveEvent();
      if (!confirmed) { return; }
    }
    this.eventService.clearActiveEvent();
    this.mode = 'preset';
    this.messageService.setMessage(this.selectedPreset.message);
  }

  switchToEvent() {
    this.mode = 'event';
    // If there's already an active event the message is already set by EventService
    if (!this.eventService.activeEventId$.value) {
      this.router.navigate(['/tabs/events']);
    }
  }

  goToEvents() {
    this.router.navigate(['/tabs/events']);
  }

  // ── Preset picker ─────────────────────────────────────────

  openPicker() {
    this.pendingPreset = this.selectedPreset;
    this.showPicker = true;
  }

  setPending(preset: MessagePreset) {
    this.pendingPreset = preset;
  }

  confirmPreset() {
    if (!this.pendingPreset) { return; }
    this.selectedPreset = this.pendingPreset;
    this.settings.selectedPresetMessage = this.selectedPreset.message;
    this.messageService.setMessage(this.selectedPreset.message);
    this.pendingPreset = null;
    this.showPicker = false;
  }

  // ── Helpers ───────────────────────────────────────────────

  private async confirmLeaveEvent(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: 'Leave event mode?',
        message: 'You will switch to a preset instead of the active event.',
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => resolve(false) },
          { text: 'Switch', handler: () => resolve(true) },
        ],
      });
      await alert.present();
    });
  }

}
