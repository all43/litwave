import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared.module';

import { EventsPageRoutingModule } from './events-routing.module';
import { EventsPage } from './events.page';
import { QrDisplayComponent } from '../qr-display/qr-display.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventsPageRoutingModule,
    TranslateModule.forChild(),
    SharedModule,
  ],
  declarations: [EventsPage, QrDisplayComponent]
})
export class EventsPageModule {}
