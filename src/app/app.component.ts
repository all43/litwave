import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { AlertController, ToastController } from '@ionic/angular';
import { LocalNotifications } from '@capacitor/local-notifications';
import { TranslateService } from '@ngx-translate/core';
import { EventService } from './event.service';
import { NotificationsService } from './notifications.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {

  constructor(
    private eventService: EventService,
    private notificationsService: NotificationsService,
    private router: Router,
    private ngZone: NgZone,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
  ) {
    this.initDeepLinkListener();
    this.initNotificationListener();
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

  private initNotificationListener(): void {
    LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      this.ngZone.run(async () => {
        const eventId: string | undefined = action.notification.extra?.eventId;
        if (!eventId) {
          this.router.navigate(['/tabs/events'], { replaceUrl: true });
          return;
        }

        const currentActiveId = this.eventService.activeEventId$.value;
        if (!currentActiveId || currentActiveId === eventId) {
          await this.eventService.setActiveEvent(eventId);
          this.router.navigate(['/tabs/events'], { replaceUrl: true });
          return;
        }

        const confirmed = await this.confirmSwitchEvent();
        if (confirmed) {
          await this.eventService.setActiveEvent(eventId);
        }
        this.router.navigate(['/tabs/events'], { replaceUrl: true });
      });
    });
  }

  private async confirmSwitchEvent(): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('pages.notifications.switchEventTitle'),
      message: this.translate.instant('pages.notifications.switchEventMessage'),
      buttons: [
        { text: this.translate.instant('common.cancel'), role: 'cancel' },
        { text: this.translate.instant('pages.notifications.switchEventConfirm'), role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }
}
