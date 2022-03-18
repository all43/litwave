/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';


type AutoSyncOptions = 'never' | 'useRecent' | 'always';
interface AppSettings {
  keepalive: boolean;
  autoSyncFlash: AutoSyncOptions;
  lastSyncFlashlightValue: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly settingsKey = 'settings';
  private defaults: AppSettings = {
    keepalive: true, // prevent device from sleep
    autoSyncFlash: 'never', // turn on flash automatically
    lastSyncFlashlightValue: false,
  };
  private current: AppSettings;

  constructor() { }

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
  }

  private save() {
    const key = this.settingsKey;
    const value = JSON.stringify(this.current);
    Storage.set({ key, value });
  }
}
