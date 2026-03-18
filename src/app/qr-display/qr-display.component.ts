import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-qr-display',
  template: `<canvas #qrCanvas></canvas>`,
  styles: [`
    :host { display: block; text-align: center; }
    canvas { max-width: 100%; height: auto; }
  `],
  standalone: false,
})
export class QrDisplayComponent implements OnChanges {
  @Input() data = '';
  @ViewChild('qrCanvas', { static: true }) canvas: ElementRef<HTMLCanvasElement>;

  ngOnChanges(): void {
    if (this.data) {
      QRCode.toCanvas(this.canvas.nativeElement, this.data, {
        width: 280,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }
}
