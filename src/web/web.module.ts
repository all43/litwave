import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { WebRoutingModule } from './web-routing.module';
import { WebComponent } from './web.component';
import { HomePage } from './pages/home/home.component';
import { EventCreateComponent } from './components/event-create/event-create.component';
import { EventResultComponent } from './components/event-result/event-result.component';
import { SignalPreviewComponent } from './components/signal-preview/signal-preview.component';
import { SignalFullscreenComponent } from './components/signal-fullscreen/signal-fullscreen.component';
import { EventHistoryComponent } from './components/event-history/event-history.component';
import { WebLanguageService } from './services/web-language.service';

function initLang(lang: WebLanguageService) {
  return () => {};
}

@NgModule({
  declarations: [
    WebComponent,
    HomePage,
    EventCreateComponent,
    EventResultComponent,
    SignalPreviewComponent,
    SignalFullscreenComponent,
    EventHistoryComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    WebRoutingModule,
    TranslateModule.forRoot(),
  ],
  providers: [
    ...provideTranslateHttpLoader(),
    { provide: APP_INITIALIZER, useFactory: initLang, deps: [WebLanguageService], multi: true },
  ],
  bootstrap: [WebComponent],
})
export class WebModule {}
