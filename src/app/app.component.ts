import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  menuItems = [
    {
      title: 'home',
      icon: 'flashlight',
      url: '/home',
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

  constructor() { }
}
