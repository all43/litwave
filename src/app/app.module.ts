
import { APP_INITIALIZER, NgModule, VERSION } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Flashlight } from '@awesome-cordova-plugins/flashlight/ngx';
import { Insomnia } from '@awesome-cordova-plugins/insomnia/ngx';
import { OpenNativeSettings } from '@awesome-cordova-plugins/open-native-settings/ngx';

import { TranslateModule } from '@ngx-translate/core';
import { SettingsService } from './settings.service';
import { NotificationsService } from './notifications.service';

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
        Flashlight,
        Insomnia,
        Platform,
        SettingsService,
        NotificationsService,
        OpenNativeSettings,
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
