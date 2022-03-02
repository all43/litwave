import { Injectable } from '@angular/core';
import { MorseService } from './morse.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  constructor(morse: MorseService) {
    const morseEncoded = morse.encodeFormatted('STOP WAR');
    const morseBinaryEncoded = morse.encodeBinary('STOP WAR');
    console.log(morseEncoded);
    console.log(morseBinaryEncoded);
  }
}
