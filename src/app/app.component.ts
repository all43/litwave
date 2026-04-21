import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { ToastController } from '@ionic/angular';
import { EventService } from './event.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {

  constructor(
    private eventService: EventService,
    private router: Router,
    private ngZone: NgZone,
    private toastCtrl: ToastController,
  ) {
    this.initDeepLinkListener();
  }

  private initDeepLinkListener(): void {
    App.addListener('appUrlOpen', (data: URLOpenListenerEvent) => {
      this.ngZone.run(async () => {
        const event = this.eventService.parseUrl(data.url);
        if (event) {
          await this.eventService.addEvent(event);
          await this.eventService.setActiveEvent(event.id);
          this.router.navigate(['/tabs/events']);
          const toast = await this.toastCtrl.create({
            message: `Event imported: ${event.name || event.message}`,
            duration: 2000,
            position: 'bottom',
          });
          await toast.present();
        }
      });
    });
  }
}
