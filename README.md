# Litwave

**Synchronized crowd light shows. Share a QR code, flash together. Zero setup.**

Litwave turns any crowd into a synchronized light show using nothing but the clock already in everyone's pocket. No Wi-Fi, no Bluetooth, no venue hardware — every phone stays in sync automatically.

[litwave.app](https://litwave.app) · [Privacy Policy](https://litwave.app/privacy) · MIT License

## How it works

Every phone already shares the same atomic clock time (via NTP). Litwave uses epoch-modulo alignment: each device independently calculates `now % repeatEvery` and starts its flash sequence at the same phase. No coordination between phones is ever needed.

## Perfect for

- **Flash mobs** — organizer shares a link or QR code beforehand; everyone opens it, presses start at the same moment
- **Parties and surprises** — schedule an event, share with guests, lights flash in unison at the exact right second
- **Concerts and festivals** — any crowd that wants to move as one
- **Sports fan sections, weddings, DJ sets** — any gathering where a shared visual moment matters

## Features

- **Events** — create a named event with a scheduled start time, share via QR code or link; recipients import in one tap
- **Presets** — built-in messages for concerts, sports, and celebrations; type any custom message
- **Morse encoding** — messages encoded to Morse code and flashed on screen and flashlight simultaneously
- **Mid-cycle join** — join mid-sequence and snap to the nearest letter boundary; no waiting for the next cycle
- **Offline-first** — no internet, no account, no server; event payload lives in the share link itself
- **Multilingual** — EN, RU, UK, DE, ES, FR, PT, PL; Latin, Cyrillic, German, Scandinavian Morse support

## Market positioning

The synchronized crowd lighting market is dominated by LED wristbands ($5–10/person, logistics, e-waste) and B2B platforms (venue hardware, enterprise sales). Litwave is the self-serve, zero-infrastructure, consumer option — free for anyone, works with the hardware already in their pocket.

The primary target is pre-coordinated groups (flash mobs, parties) where near-100% adoption is achievable because participants are already committed. The QR/link share model fits this perfectly: organizer creates the event, shares the link, everyone joins.

## Tech stack

- Angular 19 + Ionic 8 + Capacitor 8 (iOS & Android)
- TypeScript 5.7 + RxJS 7.8
- Pure timing functions in [`message-timing.ts`](src/app/message-timing.ts), tested with Vitest (37 tests)
- [`@capawesome/capacitor-torch`](https://github.com/capawesome-team/capacitor-plugins) — flashlight without camera permission
- [`@capacitor/barcode-scanner`](https://github.com/ionic-team/capacitor-barcode-scanner) — QR scanning

## Development

```bash
npm install
npm start             # dev server
npm test              # Vitest unit tests
npm run build         # production build
npm run build:website # build static website to dist/website/
npm run deploy:website # deploy website to Cloudflare Pages
npm run lint          # eslint
```

iOS and Android builds via Capacitor:

```bash
npx cap sync
npx cap open ios
npx cap open android
```

## Website

The companion PWA at [litwave.app](https://litwave.app) allows event creation and sharing without installing the app. Source in [`src/website/`](src/website/).

## Origin

This started in February 2022 as "Organise!" — an app to synchronize flashlights flashing "STOP WAR" in Morse code during the early days of the Russia-Ukraine war. The core technology turned out to be compelling beyond its original purpose and was rebranded to Litwave.

## License

MIT © 2025 Evgenii Malikov
