import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { SignalComponent } from '../signal/signal.component';
import { combineLatest, map } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { TranslateService } from '@ngx-translate/core';
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
  @ViewChild(SignalComponent) signal: SignalComponent;

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
    private translate: TranslateService,
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
    this.signal?.deactivate();
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
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('pages.home.leaveEventTitle'),
      message: this.translate.instant('pages.home.leaveEventMessage'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('pages.home.leaveEventConfirm'), role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

}
