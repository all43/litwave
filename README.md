# Litwave

Turn any crowd into a synchronized light show — no wristbands, no hardware, no setup. Just smartphones.

Litwave is a mobile app that synchronizes smartphone flashlights and screens across any number of devices using time-based synchronization. No internet connection, no Bluetooth, no special equipment needed at the venue. Every phone independently syncs to the same clock, creating a unified visual experience.

## Origin Story

This project started in February 2022 as "Organise!" — an app designed to synchronize smartphone flashlights to signal "STOP WAR" in Morse code during the early days of the Russia-Ukraine war. The idea was that thousands of phones could flash the same message in unison, creating a visible act of solidarity. The project was shelved when circumstances made it impractical, but the core technology — decentralized time-synced flashlight control — turned out to be genuinely compelling beyond its original purpose.

## Market Positioning

The synchronized crowd lighting market is dominated by two approaches:

- **LED wristbands** (PixMob, Xylobands) — $5-10/person, require logistics, create e-waste
- **B2B smartphone platforms** (CUE Audio, CrowdGlow) — require venue hardware (ultrasonic speakers, BLE transmitters), enterprise sales, pre-configured shows

Litwave occupies an **unserved niche**: a self-serve, zero-infrastructure, consumer-first crowd lighting app.

| | LED Wristbands | B2B Platforms | Litwave |
|---|---|---|---|
| Cost per person | $5-10 | Enterprise pricing | Free |
| Hardware needed | Wristbands + controllers | Venue equipment | None |
| Setup required | Event team | Pre-configured shows | None — just open the app |
| Internet at venue | No | Varies | No |
| Who can use it | Event organizers | Event organizers | Anyone |
| E-waste | Significant | None | None |

**Primary target:** Flashmobs, parties, and grassroots gatherings — where participants are already committed and the organizer shares a QR/link beforehand. This sidesteps the biggest problem in this space: the chicken-and-egg adoption barrier (where 70-80% of a random crowd won't download an app for a one-time use).

**Also works for:** Concerts, festivals, sports events, weddings, birthday surprises, DJ sets — any gathering where people want to create a shared light experience.

**Why this approach works:** Pre-coordinated groups mean near-100% adoption. The QR/URL scheme sharing fits naturally — organizer creates event config, shares link, everyone joins. Meme presets give the app standalone viral value beyond organized events.

## Features

- Morse code encoding of messages into synchronized flash patterns
- Time-based synchronization aligned to clock boundaries (no server needed)
- Flashlight (LED) and screen flash control
- Preset messages to avoid user errors
- **Events** — create, save, and manage flashmob events with custom messages and scheduled times
- **Deep linking** — share events via `litwave://` or `https://litwave.app/event?...` URLs; all config is in the URL payload itself
- **QR codes** — generate and scan QR codes for event sharing
- **Website** ([litwave.app](https://litwave.app)) — create and share events from any browser, with full-screen signal mode, morse preview, and PWA support
- Device keep-awake mode
- Local notification reminders for scheduled events
- Multi-language support (English, Russian)
- Works fully offline

## Tech Stack

- Angular + Ionic Framework
- Capacitor (iOS & Android)
- TypeScript
- RxJS for reactive signal timing

## Development

```bash
npm install
npm start            # dev server
npm run build        # production build
npm run build:website # build website to dist/website/
npm run deploy:website # deploy website to Cloudflare Pages
npm run lint         # lint
```

## Status

Actively developed. Rebranded from "Organise!" to Litwave with events, deep linking, QR codes, and a companion website.
