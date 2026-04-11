import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { EventService } from '../event.service';
import { LitwaveEvent } from '../models/event.model';
import { MessagePreset } from '../presets';

@Component({
  selector: 'app-events',
  templateUrl: 'events.page.html',
  styleUrls: ['events.page.scss'],
  standalone: false,
})
export class EventsPage {
  newEventName = '';
  newEventTime: Date | null = null;
  showDatePicker = false;
  showShareModal = false;
  showMessagePicker = false;
  shareUrl = '';
  sharingEvent: LitwaveEvent | null = null;
  dateTimeValue: string | undefined;
  minDate: string;

  // Message picker state
  eventMessage = '';
  eventMessageLabel = '';

  constructor(
    public eventService: EventService,
    private router: Router,
    private toastCtrl: ToastController,
    private translate: TranslateService,
  ) {
    this.minDate = new Date().toISOString();
  }

  getEffectiveMessage(): string {
    return this.eventMessage;
  }

  openMessagePicker(): void {
    this.showMessagePicker = true;
  }

  selectPreset(preset: MessagePreset): void {
    this.eventMessage = preset.message;
    this.eventMessageLabel = preset.label;
    this.showMessagePicker = false;
  }

  onCustomConfirmed(text: string): void {
    this.eventMessage = text;
    this.eventMessageLabel = text;
    this.showMessagePicker = false;
  }

  openDatePicker(): void {
    if (!this.newEventTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(22, 0, 0, 0);
      this.dateTimeValue = tomorrow.toISOString();
    }
    this.showDatePicker = true;
  }

  onDateTimeChange(event: any): void {
    const val = event.detail.value;
    if (val) {
      this.dateTimeValue = val;
    }
  }

  confirmDatePicker(): void {
    if (this.dateTimeValue) {
      this.newEventTime = new Date(this.dateTimeValue);
    }
    this.showDatePicker = false;
  }

  async createEvent(): Promise<void> {
    const message = this.getEffectiveMessage();
    if (!message) { return; }

    const event: LitwaveEvent = {
      id: this.eventService.generateId(),
      message,
      name: this.newEventName || undefined,
      scheduledTime: this.newEventTime ? Math.floor(this.newEventTime.getTime() / 1000) : undefined,
    };

    await this.eventService.addEvent(event);
    await this.eventService.setActiveEvent(event.id);

    // Reset form
    this.newEventName = '';
    this.eventMessage = '';
    this.eventMessageLabel = '';
    this.newEventTime = null;
    this.showDatePicker = false;

    this.showToast('pages.events.eventCreated');
  }

  clearTime(ev?: Event): void {
    ev?.stopPropagation();
    this.newEventTime = null;
    this.dateTimeValue = undefined;
    this.showDatePicker = false;
  }

  async activateEvent(event: LitwaveEvent): Promise<void> {
    await this.eventService.setActiveEvent(event.id);
    this.router.navigate(['/tabs/home']);
  }

  async deleteEvent(id: string): Promise<void> {
    await this.eventService.removeEvent(id);
  }

  shareEvent(event: LitwaveEvent, ev: Event): void {
    ev.stopPropagation();
    this.sharingEvent = event;
    this.shareUrl = this.eventService.generateUrl(event);
    this.showShareModal = true;
  }

  async copyLink(): Promise<void> {
    await Clipboard.write({ string: this.shareUrl });
    this.showToast('pages.events.linkCopied');
  }

  async nativeShare(): Promise<void> {
    try {
      await Share.share({
        title: 'Litwave Event',
        text: this.shareUrl,
        url: this.shareUrl,
      });
    } catch (e: any) {
      if (e?.name !== 'AbortError') { throw e; }
    }
  }

  async scanQr(): Promise<void> {
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        this.showToast('pages.events.scanNotSupported');
        return;
      }

      const { camera } = await BarcodeScanner.checkPermissions();
      if (camera === 'denied') {
        this.showToast('pages.events.cameraPermissionDenied');
        return;
      }
      if (camera !== 'granted') {
        const result = await BarcodeScanner.requestPermissions();
        if (result.camera !== 'granted') {
          this.showToast('pages.events.cameraPermissionDenied');
          return;
        }
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      if (barcodes.length > 0) {
        const rawValue = barcodes[0].rawValue;
        if (rawValue) {
          this.handleScannedUrl(rawValue);
        }
      }
    } catch {
      this.showToast('pages.events.scanError');
    }
  }

  private async handleScannedUrl(url: string): Promise<void> {
    const event = this.eventService.parseUrl(url);
    if (event) {
      await this.eventService.addEvent(event);
      await this.eventService.setActiveEvent(event.id);
      this.showToast('pages.events.eventImported');
      this.router.navigate(['/home']);
    } else {
      this.showToast('pages.events.invalidQr');
    }
  }

  private async showToast(messageKey: string): Promise<void> {
    const message = this.translate.instant(messageKey);
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
