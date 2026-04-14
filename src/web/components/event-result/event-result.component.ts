import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LitwaveEvent } from '../../../lib/event.model';
import { TranslateModule } from '@ngx-translate/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'web-event-result',
  standalone: false,
  template: `
    <div class="result" *ngIf="webUrl">
      <canvas #qrCanvas></canvas>
      <p class="result-url">{{ webUrl }}</p>
      <div class="actions-row">
        <button class="btn" (click)="copyLink()">{{ copyLabel }}</button>
        <a class="btn btn-outline" [href]="deepLink" style="margin-top:0">{{ 'web.openInApp' | translate }}</a>
      </div>
      <button class="btn btn-outline" (click)="downloadQr()" style="margin-top:12px">{{ 'web.downloadQr' | translate }}</button>
    </div>
  `,
})
export class EventResultComponent {
  @Input() event: LitwaveEvent | null = null;
  @Input() webUrl = '';
  @Input() deepLink = '';
  copyLabel = '';

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;
  private copyLabelBase = '';
  private translate: any;

  constructor() {
    this.copyLabelBase = 'Copy Link';
    this.copyLabel = this.copyLabelBase;
  }

  ngOnChanges(): void {
    this.copyLabel = this.copyLabelBase;
    this.renderQr();
  }

  ngAfterViewInit(): void {
    this.renderQr();
  }

  private renderQr(): void {
    if (!this.webUrl || !this.qrCanvas) return;
    QRCode.toCanvas(this.qrCanvas.nativeElement, this.webUrl, {
      width: 280, margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.webUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = this.webUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    this.copyLabel = 'Copied!';
    setTimeout(() => { this.copyLabel = this.copyLabelBase; }, 2000);
  }

  downloadQr(): void {
    if (!this.qrCanvas) return;
    const link = document.createElement('a');
    link.download = 'litwave-event-qr.png';
    link.href = this.qrCanvas.nativeElement.toDataURL('image/png');
    link.click();
  }
}
