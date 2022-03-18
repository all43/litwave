import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LanguageItem, SettingsService } from '../settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  languages: LanguageItem[] = [];

  constructor(public settings: SettingsService, translate: TranslateService) {
    this.languages = [...settings.languages];
    this.languages.unshift({ code: 'auto', name: translate.instant('common.autoLanguage') });
  }

  ngOnInit() {
  }

}
