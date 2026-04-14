import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { encodeBinary, encodeFormatted } from '../../../lib/morse-encode';

@Component({
  selector: 'web-signal-preview',
  standalone: false,
  template: `
    <div class="preview-section" *ngIf="message">
      <label>{{ 'web.signalPreview' | translate }}</label>
      <div class="morse-text">{{ morseFormatted }}</div>
      <div class="flash-area" [class.on]="isOn"></div>
      <div class="preview-controls">
        <button class="btn btn-outline" (click)="startVisual()" [disabled]="running">{{ 'web.previewFlash' | translate }}</button>
        <button class="btn btn-outline" (click)="startAudio()" [disabled]="running">{{ 'web.previewSound' | translate }}</button>
        <button class="btn btn-danger btn-sm" *ngIf="running" (click)="stop()">{{ 'web.stop' | translate }}</button>
      </div>
    </div>
  `,
})
export class SignalPreviewComponent {
  @Input() message = '';
  isOn = false;
  running = false;
  morseFormatted = '';

  private timer: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;

  ngOnChanges(): void {
    this.morseFormatted = this.message ? encodeFormatted(this.message) : '';
  }

  startVisual(): void { this.runPreview('visual'); }
  startAudio(): void { this.runPreview('audio'); }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isOn = false;
    this.running = false;
  }

  private runPreview(mode: string): void {
    if (!this.message) return;
    this.stop();
    const binary = encodeBinary(this.message);
    if (!binary.length) return;

    this.running = true;

    if (mode === 'audio' && !this.audioCtx) {
      this.audioCtx = new AudioContext();
    }

    let i = 0;
    const step = () => {
      if (i >= binary.length) {
        this.stop();
        return;
      }
      const val = binary[i];
      this.isOn = !!val;

      if ((mode === 'audio') && val && this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.frequency.value = 700;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
      }

      i++;
      this.timer = setTimeout(step, 300);
    };
    step();
  }
}
