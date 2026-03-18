import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { TranslateModule } from '@ngx-translate/core';
import { SettingsService } from './settings.service';

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function initializeAppFactory(settings: SettingsService) {
    return () => settings.init();
}

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        TranslateModule.forRoot(),
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        {
            provide: APP_INITIALIZER,
            useFactory: initializeAppFactory,
            deps: [SettingsService],
            multi: true
        },
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
