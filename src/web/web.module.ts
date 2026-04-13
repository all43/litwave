import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebRoutingModule } from './web-routing.module';
import { WebComponent } from './web.component';
import { HomePage } from './pages/home/home.component';
import { EventCreateComponent } from './components/event-create/event-create.component';
import { EventResultComponent } from './components/event-result/event-result.component';
import { SignalPreviewComponent } from './components/signal-preview/signal-preview.component';
import { SignalFullscreenComponent } from './components/signal-fullscreen/signal-fullscreen.component';
import { EventHistoryComponent } from './components/event-history/event-history.component';

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
    WebRoutingModule,
  ],
  bootstrap: [WebComponent],
})
export class WebModule {}
