# TestFlight Beta Description

---

Litwave synchronizes smartphone flashlights and screens across any crowd — no Wi-Fi, no Bluetooth, no setup. Every phone stays in sync automatically using the clock already in your pocket.

**What to test:**

- **Signal timing** — activate the flash and check that the screen and flashlight fire together. If they feel offset, go to Settings → Signal timing and use the "Test flash" button to tune the screen fade and flashlight delay sliders.
- **Events** — create an event with a scheduled time, share it via QR code or link, and import it on a second device. Check that the countdown and flash start at the correct time.
- **Resume from background** — start the flash, lock the screen for 10+ seconds, unlock. The countdown should recalculate immediately rather than showing the pre-sleep value.
- **Notification permission** — create an event with a scheduled time on a fresh install. You should be prompted for notification permission at that point.
- **Custom messages** — try typing messages with accented characters, umlauts, or Cyrillic. Unsupported characters should show an inline error before saving.

**Known limitations in this build:**

- Signal timing calibration (screen fade / flashlight delay) is device-dependent — defaults are 0 ms for both, which may need adjustment on your specific hardware.
- Flashlight auto-stops after 10 minutes to protect the LED; this is intentional.

**Feedback welcome on:** sync accuracy at the moment of joining mid-sequence, any crashes, and anything that feels off about the timing.
