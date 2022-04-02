import { Component } from '@angular/core';
import { NotificationsService } from '../notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {

  constructor(public notifications: NotificationsService) { }

  get showRequestButton() {
    return this.notifications.permission === 'prompt' || this.notifications.permission === 'prompt-with-rationale';
  }

  get showSettingsButton() {
    return this.notifications.permission === 'denied';
  }

  get showControls() {
    return this.notifications.permission === 'granted';
  }
}
