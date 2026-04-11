# Litwave

A mobile app that synchronizes smartphone flashlights and screens across any number of devices — no server, no Bluetooth, no Wi-Fi. Built with Angular 19 + Ionic 8 + Capacitor 8.

[litwave.app](https://litwave.app)

## The interesting problem

Getting thousands of phones to flash in unison without any coordination infrastructure. The solution: every phone already shares the same time (NTP). Litwave uses **epoch-modulo alignment** — each device independently computes `Date.now() % repeatEvery` and starts its flash sequence at the same phase. No messages between devices are ever needed.

```
repeatEvery = ceil((sequenceLength + pauseLength) / 5000) * 5000
```

The slot size snaps to the nearest 5-second grid, giving a clean epoch boundary that all NTP-synced clocks agree on regardless of timezone or locale.

## Architecture

### Timing engine (`message-timing.ts`, `message.service.ts`)

The core is a reactive RxJS pipeline that produces a stream of `boolean` values — `true` = flash on, `false` = flash off — timed to dit-length intervals (300 ms):

```
trigger$ ──► timeToNextSequence$ ──► sequenceInterval$ ──► makeMorseStream$
                                                          ► joinPlay$
```

**Mid-cycle join** (`calcJoinBit`): a device joining mid-sequence doesn't wait for the next epoch boundary. It calculates the nearest upcoming letter boundary within the current cycle and starts playback from there. Enabled for messages ≥ 15 s; short messages just wait for the next epoch.

**Resume after background**: when iOS/Android suspends the app, JS timers freeze. On resume, `trigger$` emits `false → true` synchronously, which cancels any frozen interval via `takeUntil` and recalculates timing from wall-clock time using `defer(() => of(Date.now()))`.

The timing logic is pure functions with no Angular dependencies — testable in Node:

```
src/app/message-timing.ts   — buildConfig, calcTimeToNextSequence, calcJoinBit
src/app/morse-encode.ts     — text → Morse → boolean[]
src/app/message-timing.spec.ts — 37 Vitest tests including sync-correctness proofs
```

### Signal pipeline

```
MessageService.stream$ (shared Observable<boolean>)
  ├── SignalComponent  →  CSS class toggle  →  screen flash
  └── FlashlightService  →  Torch.enable() / Torch.disable()  →  LED
```

Both subscribers receive the same emission from a single `share()`d source. The Settings page exposes a screen fade transition (0–100 ms) and a flashlight delay offset (0–100 ms) with a live `– – –` test pattern so they can be tuned against each other.

### Event sharing (zero-server deep links)

All event data lives in the URL. The payload is JSON → UTF-8 bytes → URL-safe base64:

```
litwave://event?d=<base64>
https://litwave.app/event?d=<base64>
```

No server lookup needed. The companion PWA at [litwave.app](https://litwave.app) generates and decodes the same links from a browser.

### Morse encoding (`morse-encode.ts`)

Supports Latin, Cyrillic (GOST 9608), German/Scandinavian (ITU-R), and Ukrainian extensions. Unknown characters are normalized before encoding: NFD decomposition strips combining diacritics (ą → a, č → c), with explicit rules for ß → ss, œ → oe, ł → l. `encodeBinaryWithBoundaries` tracks letter-start bit indices in parallel with the encoding pass — used by `calcJoinBit` to find snap points.

## Stack

| Layer | Choice |
|---|---|
| Framework | Angular 19 + Ionic 8 |
| Native bridge | Capacitor 8 |
| Reactive | RxJS 7.8 |
| Testing | Vitest |
| Flashlight | `@capawesome/capacitor-torch` (no camera permission required) |
| QR scanning | `@capacitor/barcode-scanner` |
| Keep-awake | `@capacitor-community/keep-awake` |
| i18n | `@ngx-translate` — EN, RU, UK, DE, ES, FR, PT, PL |

## Running locally

```bash
npm install
npm start             # Angular dev server
npm test              # Vitest
npm run build         # production build
npm run build:website # static website → dist/website/
npm run lint
```

```bash
npx cap sync && npx cap open ios
npx cap sync && npx cap open android
```

## Origin

Started in February 2022 as "Organise!" — an app to flash "STOP WAR" in synchronized Morse code across thousands of phones during the early days of the Russia-Ukraine war. Rebranded to Litwave after the core synchronization technology proved useful for flashmobs and crowd events more broadly.

## License

MIT © 2025 Evgenii Malikov
