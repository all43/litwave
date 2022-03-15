import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as EN from '../assets/i18n/en.json';
import * as RU from '../assets/i18n/ru.json';

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
      title: 'about',
      icon: 'information-circle',
      url: '/about',
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

  constructor(translate: TranslateService) {
    //  we don't plan to have much translations so we just import i18n files without using loader
    translate.setTranslation('en', EN);
    translate.setTranslation('ru', RU);
    translate.setDefaultLang('ru');
    translate.use(translate.getBrowserLang());
  }
}
