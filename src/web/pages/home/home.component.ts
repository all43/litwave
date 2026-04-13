import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EventCreateComponent } from '../../components/event-create/event-create.component';
import { EventResultComponent } from '../../components/event-result/event-result.component';
import { SignalPreviewComponent } from '../../components/signal-preview/signal-preview.component';
import { SignalFullscreenComponent } from '../../components/signal-fullscreen/signal-fullscreen.component';
import { EventHistoryComponent } from '../../components/event-history/event-history.component';
import { WebEventService } from '../../services/web-event.service';
import { LitwaveEvent } from '../../../lib/event.model';
import { generateUrl, generateDeepLink, generateId, parseUrl } from '../../../lib/event-codec';

@Component({
  selector: 'web-home',
  standalone: false,
  template: `
    <div class="header">
      <h1>Litwave</h1>
      <p>Create and share synchronized flashlight events</p>
    </div>

    <web-event-create (generate)="onGenerate($event)"></web-event-create>

    <div class="card" *ngIf="currentEvent">
      <web-event-result
        [event]="currentEvent"
        [webUrl]="currentWebUrl"
        [deepLink]="currentDeepLink">
      </web-event-result>
      <web-signal-preview [message]="currentEvent.message"></web-signal-preview>
      <web-signal-fullscreen [message]="currentEvent.message"></web-signal-fullscreen>
    </div>

    <web-event-history (loadEvent)="onLoadEvent($event)"></web-event-history>

    <div class="footer">
      <p>No server. No internet needed by the app. All event data is in the link.</p>
      <div class="install-banner" [class.visible]="showInstall">
        <button class="btn" (click)="promptInstall()">Install Litwave</button>
      </div>
      <div class="badges">
        <a href="#">App Store (coming soon)</a>
        <a href="#">Google Play (coming soon)</a>
      </div>
    </div>
  `,
})
export class HomePage implements OnInit {
  currentEvent: LitwaveEvent | null = null;
  currentWebUrl = '';
  currentDeepLink = '';
  showInstall = false;

  private deferredPrompt: any = null;

  constructor(
    private route: ActivatedRoute,
    private eventService: WebEventService,
  ) {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstall = true;
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const d = params.get('d');
      const msg = params.get('msg');
      if (d || msg) {
        const url = d
          ? `https://litwave.app/event?d=${d}`
          : `https://litwave.app/event?msg=${msg}`;
        const event = parseUrl(url);
        if (event) {
          this.onGenerate({
            message: event.message,
            name: event.name || '',
            scheduledTime: event.scheduledTime,
          });
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentEvent) {
        // fullscreen component handles its own exit
      }
    });
  }

  onGenerate(data: { message: string; name: string; scheduledTime?: number }): void {
    const event: LitwaveEvent = {
      id: generateId(),
      message: data.message,
      name: data.name || undefined,
      scheduledTime: data.scheduledTime,
    };
    this.currentEvent = event;
    this.currentWebUrl = generateUrl(event);
    this.currentDeepLink = generateDeepLink(event);
    this.eventService.addEvent(event);
  }

  onLoadEvent(event: LitwaveEvent): void {
    this.currentEvent = event;
    this.currentWebUrl = generateUrl(event);
    this.currentDeepLink = generateDeepLink(event);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async promptInstall(): Promise<void> {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.showInstall = false;
  }
}
