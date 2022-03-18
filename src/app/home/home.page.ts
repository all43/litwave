import { Component } from '@angular/core';
import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private settings: SettingsService, private insomnia: Insomnia) {}

  // note: ionic lifecycle hooks only work inside ionic page components
  ionViewDidEnter() {
    if (this.settings.keepalive){
      this.insomnia.keepAwake();
    }
  }

  ionViewDidLeave() {
    this.insomnia.allowSleepAgain();
  }
}
