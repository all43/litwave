import { describe, it, expect } from 'vitest';
import { encodeBinaryWithBoundaries } from './morse-encode';
import {
  buildConfig,
  calcTimeToNextSequence,
  calcJoinBit,
  BASE_UNIT_MS,
  DIT_LENGTH_MS,
  PAUSE_DITS,
  MIN_SEQUENCE_FOR_JOIN_MS,
} from './message-timing';

const MIN_PAUSE_MS = PAUSE_DITS * DIT_LENGTH_MS; // 4200 ms

// ---------------------------------------------------------------------------
// buildConfig
// ---------------------------------------------------------------------------

describe('buildConfig', () => {
  describe('repeatEvery is a multiple of BASE_UNIT_MS', () => {
    const messages = ['GO', 'SOS', 'HELLO', 'LOVE', 'WE ARE ONE', 'STOP THE WAR', 'HAPPY BIRTHDAY'];
    messages.forEach((msg) => {
      it(`"${msg}"`, () => {
        const { repeatEvery } = buildConfig(msg, encodeBinaryWithBoundaries);
        expect(repeatEvery % BASE_UNIT_MS).toBe(0);
      });
    });
  });

  describe('pause is always >= MIN_PAUSE_MS', () => {
    const messages = ['GO', 'SOS', 'HELLO', 'LOVE', 'WE ARE ONE', 'STOP THE WAR', 'HAPPY BIRTHDAY', 'E'];
    messages.forEach((msg) => {
      it(`"${msg}"`, () => {
        const { repeatEvery, sequenceLength } = buildConfig(msg, encodeBinaryWithBoundaries);
        expect(repeatEvery - sequenceLength).toBeGreaterThanOrEqual(MIN_PAUSE_MS);
      });
    });
  });

  it('"E" — single letter fits in one BASE_UNIT_MS slot', () => {
    const { repeatEvery, sequenceLength } = buildConfig('E', encodeBinaryWithBoundaries);
    expect(sequenceLength).toBe(DIT_LENGTH_MS); // 1 dit
    expect(repeatEvery).toBe(BASE_UNIT_MS);     // ceil(4500/5000)*5000 = 5000
  });

  it('"GO" — sequence length', () => {
    const { sequenceLength, repeatEvery } = buildConfig('GO', encodeBinaryWithBoundaries);
    expect(sequenceLength).toBe(6900);   // 23 dits × 300ms
    expect(repeatEvery).toBe(15000);     // ceil(11100/5000)*5000
  });

  it('"HELLO" — sequence length', () => {
    const { sequenceLength, repeatEvery } = buildConfig('HELLO', encodeBinaryWithBoundaries);
    expect(sequenceLength).toBe(14700);  // 49 dits × 300ms
    expect(repeatEvery).toBe(20000);     // ceil(18900/5000)*5000
  });

  it('"STOP THE WAR" — old 60s slot now 35s', () => {
    const { repeatEvery } = buildConfig('STOP THE WAR', encodeBinaryWithBoundaries);
    expect(repeatEvery).toBe(35000);
    expect(repeatEvery).toBeLessThan(60000); // improvement over old behaviour
  });

  it('repeatEvery is strictly less than old hard-coded values for short messages', () => {
    for (const msg of ['GO', 'SOS', 'HELLO', 'WE ARE ONE']) {
      const { repeatEvery } = buildConfig(msg, encodeBinaryWithBoundaries);
      expect(repeatEvery).toBeLessThan(30000);
    }
  });

  it('letterStarts has one entry per non-space character', () => {
    const { letterStarts } = buildConfig('GO', encodeBinaryWithBoundaries);
    expect(letterStarts).toHaveLength(2); // G, O
  });

  it('letterStarts[0] is always 0 (first letter starts at bit 0)', () => {
    for (const msg of ['GO', 'HELLO', 'WE ARE ONE', 'STOP THE WAR']) {
      const { letterStarts } = buildConfig(msg, encodeBinaryWithBoundaries);
      expect(letterStarts[0]).toBe(0);
    }
  });

  it('letterStarts are strictly increasing', () => {
    const { letterStarts } = buildConfig('HELLO WORLD', encodeBinaryWithBoundaries);
    for (let i = 1; i < letterStarts.length; i++) {
      expect(letterStarts[i]).toBeGreaterThan(letterStarts[i - 1]);
    }
  });

  it('letterStarts all within binaryEncoded bounds', () => {
    const { letterStarts, binaryEncoded } = buildConfig('STOP THE WAR', encodeBinaryWithBoundaries);
    for (const start of letterStarts) {
      expect(start).toBeGreaterThanOrEqual(0);
      expect(start).toBeLessThan(binaryEncoded.length);
    }
  });
});

// ---------------------------------------------------------------------------
// calcTimeToNextSequence
// ---------------------------------------------------------------------------

describe('calcTimeToNextSequence', () => {
  const R = 15000;

  it('returns 0 when exactly on a boundary', () => {
    expect(calcTimeToNextSequence(R, R * 4)).toBe(0);
  });

  it('returns R-1 when 1 ms past a boundary', () => {
    expect(calcTimeToNextSequence(R, R * 4 + 1)).toBe(R - 1);
  });

  it('returns R/2 when halfway through interval', () => {
    expect(calcTimeToNextSequence(R, R * 4 + R / 2)).toBe(R / 2);
  });

  it('returns 1 when 1 ms before next boundary', () => {
    expect(calcTimeToNextSequence(R, R * 5 - 1)).toBe(1);
  });

  it('works for non-round repeatEvery (35000 ms)', () => {
    const r = 35000;
    const now = r * 10 + 10000;
    expect(calcTimeToNextSequence(r, now)).toBe(25000);
  });

  it('two devices with same repeatEvery converge to the same epoch-aligned start', () => {
    const r = 35000;
    const nowA = 1_700_000_010_000; // device A: 10 s into a slot
    const nowB = 1_700_000_012_500; // device B: 2.5 s later (clock skew)
    const startA = nowA + calcTimeToNextSequence(r, nowA);
    const startB = nowB + calcTimeToNextSequence(r, nowB);
    // Both computed starts should be the same epoch-aligned boundary
    expect(startA % r).toBe(0);
    expect(startB % r).toBe(0);
    expect(startA).toBe(startB);
  });

  it('uses Date.now() when nowMs is omitted (smoke test)', () => {
    const result = calcTimeToNextSequence(15000);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(15000);
  });
});

// ---------------------------------------------------------------------------
// calcJoinBit
// ---------------------------------------------------------------------------

describe('calcJoinBit', () => {
  it('returns 0 for short messages (sequenceLength < MIN_SEQUENCE_FOR_JOIN_MS)', () => {
    const config = buildConfig('GO', encodeBinaryWithBoundaries); // sequenceLength = 6900
    expect(config.sequenceLength).toBeLessThan(MIN_SEQUENCE_FOR_JOIN_MS);
    const joinBit = calcJoinBit(config, config.repeatEvery * 5 + 5000);
    expect(joinBit).toBe(0);
  });

  it('returns 0 when elapsed >= sequenceLength (in the pause)', () => {
    const config = buildConfig('STOP THE WAR', encodeBinaryWithBoundaries);
    // place nowMs in the pause region
    const cycleStart = config.repeatEvery * 100;
    const nowInPause = cycleStart + config.sequenceLength + 1000;
    expect(calcJoinBit(config, nowInPause)).toBe(0);
  });

  it('returns next letter start when joining mid-sequence', () => {
    const config = buildConfig('STOP THE WAR', encodeBinaryWithBoundaries);
    expect(config.sequenceLength).toBeGreaterThanOrEqual(MIN_SEQUENCE_FOR_JOIN_MS);
    // Join 2 seconds into the cycle (bit ~6)
    const cycleStart = config.repeatEvery * 100;
    const nowMs = cycleStart + 2000; // 2000 ms elapsed → bit ~6
    const joinBit = calcJoinBit(config, nowMs);
    // joinBit should be > current bit (6) and a valid letter start
    expect(joinBit).toBeGreaterThan(0);
    expect(config.letterStarts).toContain(joinBit);
  });

  it('returns 0 when past last letter start (no next letter)', () => {
    const config = buildConfig('STOP THE WAR', encodeBinaryWithBoundaries);
    const lastLetterStart = config.letterStarts[config.letterStarts.length - 1];
    // Compute an elapsed that is strictly between lastLetterStart*DIT and sequenceLength
    // and does NOT wrap past repeatEvery
    const elapsedMs = lastLetterStart * DIT_LENGTH_MS + Math.floor(
      (config.sequenceLength - lastLetterStart * DIT_LENGTH_MS) / 2,
    );
    expect(elapsedMs).toBeLessThan(config.repeatEvery); // sanity — no wrap
    expect(elapsedMs).toBeLessThan(config.sequenceLength);
    const cycleStart = config.repeatEvery * 100;
    const nowMs = cycleStart + elapsedMs;
    expect(calcJoinBit(config, nowMs)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Sync correctness: two devices join at different times, play same bits
  // at the same wall-clock millisecond
  // -------------------------------------------------------------------------
  it('sync correctness — device joining mid-cycle plays same bits at same wall-clock time as device that started at epoch boundary', () => {
    const config = buildConfig('STOP THE WAR', encodeBinaryWithBoundaries);
    const r = config.repeatEvery;

    // Epoch-aligned cycle boundary (multiples of repeatEvery)
    const cycleStart = r * 1000; // arbitrary epoch-aligned boundary

    // Device A started at cycleStart (elapsed = 0 → calcTimeToNextSequence returns 0)
    // It plays config.binaryEncoded starting at cycleStart, bit 0 at cycleStart + DIT_LENGTH_MS
    const aStartMs = cycleStart;

    // Device B opens the app 15 000 ms into the cycle
    const nowB = cycleStart + 15_000;
    const joinBitB = calcJoinBit(config, nowB);

    // joinBitB must be > 0 for this test to be meaningful
    expect(joinBitB).toBeGreaterThan(0);
    expect(config.letterStarts).toContain(joinBitB);

    // Device A plays bit joinBitB at:
    //   cycleStart + joinBitB * DIT_LENGTH_MS
    //   (each bit takes exactly DIT_LENGTH_MS after the previous)
    const aPlaysJoinBitAtMs = aStartMs + joinBitB * DIT_LENGTH_MS;

    // Device B waits until that same wall-clock moment:
    //   nowB + (joinBitB * DIT_LENGTH_MS - elapsed)
    //   = nowB + joinBitB * DIT_LENGTH_MS - 15_000
    const elapsed = nowB % r; // = 15_000
    const bWaitsMs = joinBitB * DIT_LENGTH_MS - elapsed;
    const bPlaysJoinBitAtMs = nowB + bWaitsMs;

    expect(bPlaysJoinBitAtMs).toBe(aPlaysJoinBitAtMs);
  });

  it('sync correctness — works for different join times within same cycle', () => {
    const config = buildConfig('HAPPY BIRTHDAY', encodeBinaryWithBoundaries);
    const r = config.repeatEvery;
    const cycleStart = r * 500;

    const joinTimes = [5000, 10000, 20000, 30000].filter(
      (t) => t < config.sequenceLength,
    );

    for (const joinOffsetMs of joinTimes) {
      const nowDevice = cycleStart + joinOffsetMs;
      const joinBit = calcJoinBit(config, nowDevice);
      if (joinBit === 0) continue; // short or in pause — skip

      const elapsed = nowDevice % r;
      const devicePlaysAt = nowDevice + joinBit * DIT_LENGTH_MS - elapsed;
      const anchorPlaysAt = cycleStart + joinBit * DIT_LENGTH_MS;

      expect(devicePlaysAt).toBe(anchorPlaysAt);
    }
  });
});
