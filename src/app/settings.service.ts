/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { TranslateService } from '@ngx-translate/core';
import * as EN from '../assets/i18n/en.json';
import * as RU from '../assets/i18n/ru.json';

type LanguageCode = 'ru' | 'by' | 'en' | 'auto';

export type LanguageItem = {
  name: string;
  code: LanguageCode;
};

type AutoSyncOptions = 'never' | 'useRecent' | 'always';
interface AppSettings {
  selectedLanguage: LanguageCode;
  keepalive: boolean;
  autoSyncFlash: AutoSyncOptions;
  lastSyncFlashlightValue: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly settingsKey = 'settings';
  readonly defaultLanguage: LanguageCode = 'ru';
  readonly languages: LanguageItem[] = [
    { name: 'Русский', code: 'ru' },
    { name: 'English', code: 'en' },
  ];
  private defaults: AppSettings = {
    selectedLanguage: 'auto',
    keepalive: true, // prevent device from sleep
    autoSyncFlash: 'never', // turn on flash automatically
    lastSyncFlashlightValue: false,
  };
  private current: AppSettings;

  constructor(private translate: TranslateService) { }

  get selectedLanguage(): LanguageCode {
    return this.getKey('selectedLanguage');
  }

  set selectedLanguage(val: LanguageCode) {
    this.setKey('selectedLanguage', val);
    this.useLanguage(val);
  }

  get autoSyncFlash(): AutoSyncOptions {
    return this.getKey('autoSyncFlash');
  }

  set autoSyncFlash(val: AutoSyncOptions) {
    this.setKey('autoSyncFlash', val);
  }

  get lastSyncFlashlightValue(): boolean {
    return this.getKey('lastSyncFlashlightValue');
  }

  set lastSyncFlashlightValue(val: boolean) {
    this.setKey('lastSyncFlashlightValue', val);
  }

  get keepalive(): boolean {
    return this.getKey('keepalive');
  }

  set keepalive(val: boolean) {
    this.setKey('keepalive', val);
  }

  getKey(key) {
    return this.current[key] || this.defaults[key];
  }

  setKey(key, value) {
    this.current[key] = value;
    this.save();
  }

  public async init() {
    const ret = await Storage.get({ key: this.settingsKey });
    this.current = JSON.parse(ret.value) || {};
    //  we don't plan to have much translations so we just import i18n files without using loader
    this.translate.setTranslation('en', EN);
    this.translate.setTranslation('ru', RU);
    this.translate.setDefaultLang(this.defaultLanguage);
    this.useLanguage(this.getKey('selectedLanguage'));

  }

  private useLanguage(val) {
    const lang = val === 'auto' ? this.translate.getBrowserLang() : val;
    this.translate.use(lang);
  }

  private save() {
    const key = this.settingsKey;
    const value = JSON.stringify(this.current);
    Storage.set({ key, value });
  }
}
