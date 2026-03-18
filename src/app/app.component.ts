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
  menuItems = [
    {
      title: 'home',
      icon: 'flashlight',
      url: '/home',
    },
    {
      title: 'events',
      icon: 'calendar',
      url: '/events',
    },
    {
      title: 'info',
      icon: 'information-circle',
      url: '/info',
    },
    {
      title: 'settings',
      icon: 'settings',
      url: '/settings',
    },
    {
      title: 'notifications',
      icon: 'notifications',
      url: '/notifications',
    },
  ];

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
          this.router.navigate(['/home']);
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
