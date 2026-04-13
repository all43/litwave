export const DIT_LENGTH_MS = 300;
export const PAUSE_DITS = 14; // inter-message silence in dits
export const BASE_UNIT_MS = 5000; // sync grid granularity (5 s)

// Only apply mid-cycle join for messages this long or longer
export const MIN_SEQUENCE_FOR_JOIN_MS = 15_000;

export interface MessageConfig {
  binaryEncoded: boolean[];
  letterStarts: number[]; // bit indices where each letter starts (for mid-cycle join)
  sequenceLength: number;
  repeatEvery: number;
}

/**
 * Builds timing config for a message.
 * repeatEvery is the smallest multiple of BASE_UNIT_MS that fits
 * the sequence plus the minimum inter-message pause.
 */
export function buildConfig(
  message: string,
  encodeBinaryFn: (msg: string) => { bits: boolean[]; letterStarts: number[] },
  ditLength = DIT_LENGTH_MS,
  baseUnit = BASE_UNIT_MS,
): MessageConfig {
  const { bits: binaryEncoded, letterStarts } = encodeBinaryFn(message);
  const sequenceLength = binaryEncoded.length * ditLength;
  const pauseLength = PAUSE_DITS * ditLength;
  const totalRequired = sequenceLength + pauseLength;
  const repeatEvery = Math.ceil(totalRequired / baseUnit) * baseUnit;
  return { binaryEncoded, letterStarts, sequenceLength, repeatEvery };
}

/**
 * Returns milliseconds until the next epoch-aligned boundary for the
 * given interval. All devices sharing Unix epoch automatically agree.
 *
 * Max wait = repeatEvery ms. Returns 0 if already on a boundary.
 */
export function calcTimeToNextSequence(
  repeatEvery: number,
  nowMs = Date.now(),
): number {
  const elapsed = nowMs % repeatEvery;
  return elapsed === 0 ? 0 : repeatEvery - elapsed;
}

/**
 * For mid-cycle joins on long messages: returns the bit index to start playing
 * from so the device is in sync with devices that started at the epoch boundary.
 *
 * Returns 0 when:
 * - The sequence is short (< MIN_SEQUENCE_FOR_JOIN_MS) — just wait for next boundary.
 * - We're in the post-sequence pause — wait for next boundary.
 * - We're in the very first letter — start from beginning of that letter.
 *
 * Otherwise returns the start bit of the next letter boundary after the current position.
 */
export function calcJoinBit(
  config: MessageConfig,
  nowMs = Date.now(),
  ditLength = DIT_LENGTH_MS,
): number {
  if (config.sequenceLength < MIN_SEQUENCE_FOR_JOIN_MS) {
    return 0;
  }
  const elapsed = nowMs % config.repeatEvery;
  if (elapsed >= config.sequenceLength) {
    return 0; // in the pause — wait for next full cycle
  }
  const currentBit = Math.floor(elapsed / ditLength);
  // find first letter start strictly after current bit
  const nextLetterBit = config.letterStarts.find((s) => s > currentBit);
  return nextLetterBit ?? 0;
}
