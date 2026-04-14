import { Component, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { createSignalEngine } from '../../../lib/signal-engine';
import { createWebBackgroundAdapter } from '../../../lib/platform-background';
import { encodeBinaryWithBoundaries } from '../../../lib/morse-encode';

@Component({
  selector: 'web-signal-fullscreen',
  standalone: false,
  template: `
    <button class="btn" *ngIf="message && !active" (click)="start()" style="margin-top:12px">
      {{ 'web.startSignal' | translate }}
    </button>
    <div class="fullscreen-overlay" [class.active]="active" [class.on]="isOn">
      <button class="fs-exit" (click)="stop()">{{ 'web.exit' | translate }}</button>
      <div class="fs-message">{{ message }}</div>
      <div class="fs-countdown">{{ countdownText }}</div>
    </div>
  `,
})
export class SignalFullscreenComponent implements OnDestroy {
  @Input() message = '';
  active = false;
  isOn = false;
  countdownText = '';

  private trigger$ = new BehaviorSubject<boolean>(false);
  private wakeLock: WakeLockSentinel | null = null;
  private subs: Subscription[] = [];

  ngOnDestroy(): void {
    this.stop();
  }

  async start(): Promise<void> {
    if (!this.message) return;

    this.active = true;
    this.trigger$.next(true);

    const engine = createSignalEngine({
      message$: new BehaviorSubject(this.message),
      trigger$: this.trigger$,
      encodeFn: (msg) => encodeBinaryWithBoundaries(msg),
    });

    const bg = createWebBackgroundAdapter();
    this.subs.push(
      bg.foreground$.subscribe((visible) => {
        if (visible) {
          this.trigger$.next(false);
          this.trigger$.next(true);
        } else {
          this.trigger$.next(false);
        }
      }),
    );

    this.subs.push(
      engine.stream$.subscribe((val) => {
        this.isOn = val;
      }),
    );

    this.subs.push(
      engine.countDown$.subscribe((ms) => {
        this.countdownText = (ms / 1000).toFixed(0) + 's';
      }),
    );

    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch { /* not supported */ }

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  stop(): void {
    this.trigger$.next(false);
    this.active = false;
    this.isOn = false;
    this.countdownText = '';
    this.subs.forEach(s => s.unsubscribe());
    this.subs = [];
    if (this.wakeLock) { this.wakeLock.release(); this.wakeLock = null; }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }
}
