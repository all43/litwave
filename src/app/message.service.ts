import { Injectable } from '@angular/core';
import { MorseService } from './morse.service';
import { from, Observable, of } from 'rxjs';
import { concatMap, delay, distinctUntilChanged } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  public message = 'STOP WAR!';
  public stream: Observable<boolean>;
  private ditLength = 780; // dit length in milliseconds

  constructor(morse: MorseService) {
    const morseBinaryEncoded = morse.encodeBinary(this.message);
    this.stream = from(morseBinaryEncoded).pipe(
      concatMap((val) => of(val).pipe(
        delay(this.ditLength),
      )),
      distinctUntilChanged(),
    );
  }
}
