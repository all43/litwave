import { Injectable } from '@angular/core';
import { MorseService } from './morse.service';
import { from, Observable, of } from 'rxjs';
import { concatMap, delay, distinctUntilChanged, endWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message = 'STOP WAR';
  public stream: Observable<boolean>;
  public cycleLength: number;
  private ditLength = 280; // dit length in milliseconds

  constructor(morse: MorseService) {
    const morseBinaryEncoded = morse.encodeBinary(this.message);
    this.cycleLength = morseBinaryEncoded.length * this.ditLength;
    console.log(this.cycleLength/1000);
    this.stream = from(morseBinaryEncoded).pipe(
      concatMap((val) => of(val).pipe(
        delay(this.ditLength),
      )),
      distinctUntilChanged(),
      endWith(false), // switch off at the end
    );
  }
}
