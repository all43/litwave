import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const STORAGE_KEY = 'litwave-lang';
const SUPPORTED_LANGS = ['en', 'ru', 'uk', 'es', 'de', 'fr', 'pt', 'pl'];

@Injectable({ providedIn: 'root' })
export class WebLanguageService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(SUPPORTED_LANGS);
    this.translate.setDefaultLang('en');

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      this.translate.use(saved);
      return;
    }

    const browserLang = (navigator.language || 'en').split('-')[0].toLowerCase();
    if (SUPPORTED_LANGS.includes(browserLang)) {
      this.translate.use(browserLang);
    }
  }

  setLang(lang: string): void {
    if (SUPPORTED_LANGS.includes(lang)) {
      this.translate.use(lang);
      localStorage.setItem(STORAGE_KEY, lang);
    }
  }

  get currentLang(): string {
    return this.translate.currentLang || 'en';
  }
}
