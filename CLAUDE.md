# Litwave (formerly "Organise!")

## What This Is

A mobile app that synchronizes smartphone flashlights and screens across devices using time-based sync (epoch-modulo alignment). No server, no internet, no Bluetooth, no venue hardware — fully decentralized.

## Rebranding Status

Rebranding from "Organise!" to "Litwave" is complete:
- App ID: `app.litwave`
- App name: Litwave (all configs, translations, native projects updated)
- Message is now configurable via presets (was hardcoded "STOP WAR")
- Default language changed from Russian to English

## Architecture

- **Angular 19 + Ionic 8 + Capacitor 8** — hybrid mobile app targeting iOS & Android
- **TypeScript 5.7, RxJS 7.8**
- **Key modules:**
  - `morse-encode.ts` — pure text → morse → binary encoding, no Angular deps; exports `encodeBinary` and `encodeBinaryWithBoundaries` (tracks letter start bit indices)
  - `message-timing.ts` — pure timing functions; `buildConfig`, `calcTimeToNextSequence`, `calcJoinBit`; tested via Vitest
  - `message-timing.spec.ts` — 37 Vitest tests including sync-correctness proofs
- **Key services:**
  - `morse.service.ts` — Angular wrapper; delegates encoding to `morse-encode.ts`
  - `message.service.ts` — reactive RxJS timing engine; epoch-modulo sync, mid-cycle letter-boundary join, 300ms dit length; pauses stream on background via `trigger$`
  - `flashlight.service.ts` — hardware flashlight control; syncs to morse stream with optional `flashlightDelayMs` offset via RxJS `delay()`
  - `settings.service.ts` — persisted settings via @capacitor/preferences + i18n (EN/RU/UK/ES/DE/FR/PT/PL); includes `screenTransitionMs` and `flashlightDelayMs` for per-device signal timing calibration
  - `notifications.service.ts` — local notification scheduling; requests permission at scheduling time if not yet granted
  - `event.service.ts` — event CRUD, URL generation/parsing, Preferences persistence
- **Event model** (`models/event.model.ts`) — `LitwaveEvent` interface (id, message, name, scheduledTime)
- **Events page** (`events/`) — create, list, activate, share, delete events; QR scanner
- **QR display component** (`qr-display/`) — renders QR codes via `qrcode` npm package
- **Presets** (`presets.ts`) — categorized message presets (general, meme, event)
- **Signal component** (`signal.component.*`) — visual screen flash (black/white toggle) + flashlight toggle
- **Translations** in `src/assets/i18n/{en,ru,uk,es,de,fr,pt,pl}.json` — loaded at runtime via `@ngx-translate/http-loader`; add a new language by dropping a JSON file, no code changes needed
- **Morse mapping** in `src/app/morseMapping.json`
- **Website** (`src/website/`) — static PWA on litwave.app for event creation/sharing without the app
- Components use `standalone: false` (NgModule-based architecture)

## Key Technical Decisions

- **Sync:** `Date.now() % repeatEvery` — epoch-modulo alignment; all NTP-synced devices agree automatically, no coordination needed
- **Slot sizing:** `repeatEvery = ceil((sequenceLength + pauseLength) / 5000) * 5000` — tightest 5s-grid slot that fits message + 14-dit pause (GO: 15s, STOP THE WAR: 35s; was hardcoded 30s/60s)
- **Mid-cycle join:** devices joining mid-cycle snap to the next letter boundary within the current cycle (`calcJoinBit`), enabled for messages ≥ 15s; short messages just wait for next epoch boundary
- App pauses signal when backgrounded (RxJS `takeUntil` on `trigger$`), resumes and recalculates on foreground — prevents stale countdown on resume
- **Signal timing calibration:** Settings → Signal timing lets users tune `screenTransitionMs` (CSS opacity transition on screen flash) and `flashlightDelayMs` (RxJS delay on torch subscription) independently; a `– – –` test pattern fires both so offset is visible in-situ
- `custom-webpack.config.js` injects package version for the about page
- `scripts/version-bump.js` — syncs `package.json` version → `MARKETING_VERSION` / `CURRENT_PROJECT_VERSION` (iOS) and `versionName` / `versionCode` (Android); build number = `git rev-list --count HEAD`
- All native plugins are Capacitor-native (no Cordova):
  - `@capawesome/capacitor-torch` — flashlight control without camera permission
  - `@capacitor-community/keep-awake` — prevent device sleep
  - `capacitor-native-settings` — open native app settings
  - `@capacitor-mlkit/barcode-scanning` — QR code scanning
  - `@capacitor/share` — native share sheet
  - `@capacitor/clipboard` — copy to clipboard
- Deep links: `litwave://event?msg=...&t=...&name=...` and `https://litwave.app/event?...` (universal links)
- Deep link listener in `app.component.ts` via `App.addListener('appUrlOpen', ...)`
- Android: intent filters in `AndroidManifest.xml` for both `litwave://` and `https://litwave.app/event`
- iOS: URL scheme in `Info.plist`, camera permission for QR scanning

## URL Scheme

```
litwave://event?msg=HELLO&t=1711036800&name=Birthday+Party
```

Parameters:
- `msg` (required) — message text (uppercase, max ~30 chars)
- `t` (optional) — Unix timestamp for event start; omitted = "start now"
- `name` (optional) — human-friendly event label

Same format works for both `litwave://` (deep link) and `https://litwave.app/event?...` (universal link / website).

## Website (litwave.app)

Static PWA in `src/website/`. Features:
- Event creation form with presets + custom message
- QR code generation + download
- Deep link ("Open in Litwave") button
- Morse signal preview (visual screen flash + audio beep)
- Full-screen signal mode with clock-minute sync, wake lock, and fullscreen API
- Event history in localStorage
- PWA: service worker, manifest, installable
- Deployed to Cloudflare Pages

## Planned Work

- Add color screen flash options (not just black/white)
- Rework event notifications scheduling (currently schedules on event creation; should reschedule if event time is edited)
- Replace placeholder website icons with real ones

## Commands

```bash
npm start            # dev server
npm run build        # production build
npm test             # run Vitest unit tests
npm run lint         # eslint
npm run version:bump # sync package.json version → iOS pbxproj + Android gradle
npm run sync         # version:bump + ng build + cap sync (use before opening native IDEs)
npm run open:ios     # sync + open Xcode
npm run open:android # sync + open Android Studio
npm run build:website # build website to dist/website/
npm run deploy:website # build + deploy website to Cloudflare Pages
```

## Screenshots

Store screenshots live in `store/ios/screenshots/` and `store/android/screenshots/`.
Use **iPhone 16 Pro Max** simulator for iOS (6.9", covers all App Store size requirements) and **iPad Pro 13"** for iPad screenshots. Take screenshots with **Cmd+S** in Simulator.
Naming convention: `01_home.png`, `02_events.png` for iPhone; `01_home_ipad.png`, `02_events_ipad.png` for iPad.

### Import sample events into iOS Simulator

```bash
xcrun simctl openurl booted "https://litwave.app/event/eyJtc2ciOiJMT1ZFIn0"                                                                                                              # LOVE (signal screen)
xcrun simctl openurl booted "https://litwave.app/event/eyJtc2ciOiJXRSBBUkUgT05FIiwibmFtZSI6IkNpdHkgRmxhc2ggTW9iIiwidCI6MTc0ODczNjAwMH0"  # City Flash Mob — WE ARE ONE, May 31
xcrun simctl openurl booted "https://litwave.app/event/eyJtc2ciOiJIQVBQWSBCSVJUSERBWSIsIm5hbWUiOiJFbGVuYSdzIEJpcnRoZGF5IiwidCI6MTc3ODg4OTYwMH0"  # Elena's Birthday — HAPPY BIRTHDAY, May 16
```

### Import sample events into Android Emulator

```bash
adb shell am start -a android.intent.action.VIEW -d "https://litwave.app/event/eyJtc2ciOiJMT1ZFIn0"                                                                                                              # LOVE (signal screen)
adb shell am start -a android.intent.action.VIEW -d "https://litwave.app/event/eyJtc2ciOiJXRSBBUkUgT05FIiwibmFtZSI6IkNpdHkgRmxhc2ggTW9iIiwidCI6MTc0ODczNjAwMH0"  # City Flash Mob — WE ARE ONE, May 31
adb shell am start -a android.intent.action.VIEW -d "https://litwave.app/event/eyJtc2ciOiJIQVBQWSBCSVJUSERBWSIsIm5hbWUiOiJFbGVuYSdzIEJpcnRoZGF5IiwidCI6MTc3ODg4OTYwMH0"  # Elena's Birthday — HAPPY BIRTHDAY, May 16
```
