import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';

interface AppSettings {
  keepalive: boolean;
  autoSyncFlash: 'never' | 'useRecent' | 'always';
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  readonly settingsKey = 'settings';
  private defaults: AppSettings = {
    keepalive: true, // prevent device from sleep
    autoSyncFlash: 'never', // turn on flash automatically
  };
  private current: AppSettings;

  constructor() { }

  get autoSyncFlash() {
    return this.getKey('autoSyncFlash');
  }

  set autoSyncFlash(val) {
    this.setKey('autoSyncFlash', val);
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  get keepalive() {
    return this.getKey('keepalive');
  }

  set keepalive(val) {
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
