/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';

type LanguageCode = 'en' | 'ru' | 'uk' | 'es' | 'de' | 'fr' | 'pt' | 'pl' | 'auto';

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
  flashlightAutoShutoff: boolean;
  selectedPresetMessage: string;
  screenTransitionMs: number;
  flashlightDelayMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly settingsKey = 'settings';
  readonly defaultLanguage: LanguageCode = 'en';
  readonly languages: LanguageItem[] = [
    { name: 'English', code: 'en' },
    { name: 'Русский', code: 'ru' },
    { name: 'Українська', code: 'uk' },
    { name: 'Español', code: 'es' },
    { name: 'Deutsch', code: 'de' },
    { name: 'Français', code: 'fr' },
    { name: 'Português', code: 'pt' },
    { name: 'Polski', code: 'pl' },
  ];
  private defaults: AppSettings = {
    selectedLanguage: 'auto',
    keepalive: true, // prevent device from sleep
    autoSyncFlash: 'useRecent',
    lastSyncFlashlightValue: true,
    flashlightAutoShutoff: true,
    selectedPresetMessage: '',
    screenTransitionMs: 0,
    flashlightDelayMs: 0,
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

  get flashlightAutoShutoff(): boolean {
    return this.getKey('flashlightAutoShutoff');
  }

  set flashlightAutoShutoff(val: boolean) {
    this.setKey('flashlightAutoShutoff', val);
  }

  get selectedPresetMessage(): string {
    return this.getKey('selectedPresetMessage');
  }

  set selectedPresetMessage(val: string) {
    this.setKey('selectedPresetMessage', val);
  }

  get screenTransitionMs(): number {
    return this.getKey('screenTransitionMs');
  }

  set screenTransitionMs(val: number) {
    this.setKey('screenTransitionMs', val);
  }

  get flashlightDelayMs(): number {
    return this.getKey('flashlightDelayMs');
  }

  set flashlightDelayMs(val: number) {
    this.setKey('flashlightDelayMs', val);
  }

  getKey(key) {
    return this.current[key] || this.defaults[key];
  }

  setKey(key, value) {
    this.current[key] = value;
    this.save();
  }

  public async init() {
    const ret = await Preferences.get({ key: this.settingsKey });
    this.current = JSON.parse(ret.value) || {};
    this.translate.setDefaultLang(this.defaultLanguage);
    this.useLanguage(this.getKey('selectedLanguage'));

  }

  public reset() {
    Preferences.clear();
    this.current = { ...this.defaults };
    this.useLanguage(this.defaults.selectedLanguage);
  }

  private useLanguage(val) {
    const lang = val === 'auto' ? this.translate.getBrowserLang() : val;
    this.translate.use(lang);
  }

  private save() {
    const key = this.settingsKey;
    const value = JSON.stringify(this.current);
    Preferences.set({ key, value });
  }

}
