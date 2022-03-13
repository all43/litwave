import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Flashlight } from '@awesome-cordova-plugins/flashlight/ngx';

import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [AppComponent],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        TranslateModule.forRoot(),
    ],
    providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, Flashlight],
    bootstrap: [AppComponent],
})
export class AppModule {}
