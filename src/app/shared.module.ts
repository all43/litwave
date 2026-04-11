import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PresetPickerComponent } from './preset-picker/preset-picker.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TranslateModule],
  declarations: [PresetPickerComponent],
  exports: [PresetPickerComponent],
})
export class SharedModule {}
