import { Component } from '@angular/core';
import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private insomnia: Insomnia) {}

  // note: ionic lifecycle hooks only work inside ionic page components
  ionViewDidEnter() {
    this.insomnia.keepAwake();
  }

  ionViewDidLeave() {
    this.insomnia.allowSleepAgain();
  }
}
