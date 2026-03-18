# Litwave (formerly "Organise!")

## What This Is

A mobile app that synchronizes smartphone flashlights and screens across devices using time-based sync (clock-minute alignment). No server, no internet, no Bluetooth, no venue hardware — fully decentralized.

## Rebranding Status

Rebranding from "Organise!" to "Litwave" is complete:
- App ID: `app.litwave`
- App name: Litwave (all configs, translations, native projects updated)
- Message is now configurable via presets (was hardcoded "STOP WAR")
- Default language changed from Russian to English

## Architecture

- **Angular 19 + Ionic 8 + Capacitor 8** — hybrid mobile app targeting iOS & Android
- **TypeScript 5.7, RxJS 7.8**
- **Key services:**
  - `morse.service.ts` — text → morse code → binary encoding
  - `message.service.ts` — reactive RxJS timing engine with BehaviorSubject for message switching, syncs to clock-minute boundaries, 300ms dit length
  - `flashlight.service.ts` — hardware flashlight control, syncs to morse stream
  - `settings.service.ts` — persisted settings via @capacitor/preferences + i18n (EN/RU)
  - `notifications.service.ts` — local notification scheduling
  - `event.service.ts` — event CRUD, URL generation/parsing, Preferences persistence
- **Event model** (`models/event.model.ts`) — `LitwaveEvent` interface (id, message, name, scheduledTime)
- **Events page** (`events/`) — create, list, activate, share, delete events; QR scanner
- **QR display component** (`qr-display/`) — renders QR codes via `qrcode` npm package
- **Presets** (`presets.ts`) — categorized message presets (general, meme, event)
- **Signal component** (`signal.component.*`) — visual screen flash (black/white toggle) + flashlight toggle
- **Translations** in `src/assets/i18n/{en,ru}.json`
- **Morse mapping** in `src/app/morseMapping.json`
- **Website** (`src/website/`) — static PWA on litwave.app for event creation/sharing without the app
- Components use `standalone: false` (NgModule-based architecture)

## Key Technical Decisions

- Time sync aligns to minute boundaries — no coordination between devices needed
- Message repeats every 30s or 60s depending on morse sequence length
- App pauses signal when backgrounded, resumes on foreground
- `custom-webpack.config.js` injects package version for the about page
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
- Rework notifications from fixed daily protest time to event-based
- Replace placeholder website icons with real ones

## Commands

```bash
npm start            # dev server
npm run build        # production build
npm run build:website # build website to dist/website/
npm run deploy:website # build + deploy website to Cloudflare Pages
npm run lint         # eslint
```
