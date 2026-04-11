// Pure morse encoding — no Angular dependencies, safe to import in Node/Jest tests
import * as morseMapping from './morseMapping.json';

const map: Record<string, string> = { ...(morseMapping as any), ' ': ' ' };

const charSeparator = '   '; // 3 spaces = letter gap (3 dits)
const innerSeparator = ' ';  // 1 space  = symbol gap (1 dit)

const binaryMapping: Record<string, boolean[]> = {
  '.': [true],
  '-': [true, true, true],
  ' ': [false],
};

export function getUnsupportedChars(str: string): string[] {
  return [...new Set([...str.toLowerCase()].filter(c => c !== ' ' && !(c in map)))];
}

function encodeFormatted(str: string): string {
  const encoded = [...str.toLowerCase()].filter(c => c in map).map((char) => map[char]);
  return encoded
    .map((char) => char.split('').join(innerSeparator))
    .join(charSeparator);
}

export function encodeBinary(str: string): boolean[] {
  return [...encodeFormatted(str)].reduce<boolean[]>((acc, char) => {
    acc.push(...(binaryMapping[char] ?? []));
    return acc;
  }, []);
}

export interface BinaryWithBoundaries {
  bits: boolean[];
  letterStarts: number[]; // bit indices where each non-space letter starts
}

// Bit lengths of each morse symbol (matches binaryMapping above)
const symbolBits: Record<string, number> = { '.': 1, '-': 3 };

export function encodeBinaryWithBoundaries(str: string): BinaryWithBoundaries {
  const bits = encodeBinary(str);
  const chars = [...str.toLowerCase()];
  const letterStarts: number[] = [];

  // Track bit position in parallel with encodeBinary's logic:
  //   charSeparator (3 false bits) between every pair of adjacent characters
  //   space character → 1 false bit (gives 3+1+3 = 7-dit word gap with surrounding separators)
  //   non-space morse symbols joined by innerSeparator (1 false bit)
  let bitPos = 0;
  chars.forEach((char, i) => {
    if (i > 0) {
      bitPos += 3; // charSeparator
    }
    if (char !== ' ') {
      letterStarts.push(bitPos);
      const morse = map[char] ?? '';
      [...morse].forEach((sym, si) => {
        if (si > 0) bitPos += 1; // innerSeparator
        bitPos += symbolBits[sym] ?? 0;
      });
    } else {
      bitPos += 1; // space maps to single false bit
    }
  });

  return { bits, letterStarts };
}
