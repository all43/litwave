import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EventCreateComponent } from '../../components/event-create/event-create.component';
import { EventResultComponent } from '../../components/event-result/event-result.component';
import { SignalPreviewComponent } from '../../components/signal-preview/signal-preview.component';
import { SignalFullscreenComponent } from '../../components/signal-fullscreen/signal-fullscreen.component';
import { EventHistoryComponent } from '../../components/event-history/event-history.component';
import { WebEventService } from '../../services/web-event.service';
import { LitwaveEvent } from '../../../lib/event.model';
import { generateUrl, generateDeepLink, generateId, decodePayload } from '../../../lib/event-codec';

@Component({
  selector: 'web-home',
  standalone: false,
  template: `
    <div class="header">
      <h1>Litwave</h1>
      <p>{{ 'web.tagline' | translate }}</p>
    </div>

    <div class="page-content">
      <div class="main-layout">
        <div class="main-create">
          <web-event-create (generate)="onGenerate($event)"></web-event-create>
        </div>

        <div class="main-side">
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
        </div>
      </div>
    </div>

    <div class="footer">
      <p>{{ 'web.footer' | translate }}</p>
      <div class="install-banner" [class.visible]="showInstall">
        <button class="btn" (click)="promptInstall()">{{ 'web.installLitwave' | translate }}</button>
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
    this.route.paramMap.subscribe(params => {
      const payload = params.get('payload');
      if (payload) {
        const decoded = decodePayload(payload);
        if (decoded) {
          this.onGenerate({
            message: decoded.message,
            name: decoded.name || '',
            scheduledTime: decoded.scheduledTime,
          });
        }
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
