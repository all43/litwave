import { Injectable } from '@angular/core';
import * as morseMapping from './morseMapping.json';

/*
  converts given string to text or binary morse code
*/
@Injectable({
  providedIn: 'root'
})
export class MorseService {
  private map = morseMapping;
  private charSeparator = '   ';
  private innerSeparator = ' '; // separator for parts of single char
  private binaryMapping = {
    '.': [true],
    '-': [true, true, true],
    ' ': [false],
  };
  constructor() {
    this.map[' '] = ' '; // leave space as is
  }

  public encode(str: string, join: true): string
  public encode(str: string, join?: false): string[]
  public encode(str: string, join: boolean = false) {
    // map chars to morse symbols, replace unknown characters with underscore
    const encoded = [...str.toLowerCase()].map((char) => this.map[char] || this.map._);
    return join ? encoded.join('') : encoded;
  }

  public encodeFormatted(str: string) {
    const encoded = this.encode(str, false);
    return encoded.map((char) => char.split('').join(this.innerSeparator))
      .join(this.charSeparator);
  }

  public encodeBinary(str: string) {
    return [...this.encodeFormatted(str)].reduce((acc, char) => {
      acc.push(...this.binaryMapping[char]);
      return acc;
    }, []);
  }
}
