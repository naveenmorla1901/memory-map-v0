# MemoryMap

MemoryMap is a React Native application that allows users to save and explore locations on a map,
including saving a place straight from an Instagram reel's native share sheet. It talks to the
[memory-map](https://github.com/naveenmorla1901/memory-map) Django backend for authentication and
saved locations - the two repos are meant to run together.

## Prerequisites

- Node.js 20 or later
- Android Studio (for Android) and/or Xcode on a Mac (for iOS)
- The [memory-map](https://github.com/naveenmorla1901/memory-map) backend running locally (see
  that repo's README) - this app has nothing to talk to without it.

This app uses native modules (for the share-to-save feature) that **Expo Go can't run**. You need
a custom dev client, built once via `expo run:android` / `expo run:ios` (or an EAS development
build), then `npm start` for day-to-day JS development against that installed client.

## Setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/naveenmorla1901/memory-map-v0.git
   cd memory-map-v0
   npm install
   ```

2. Copy `.env.example` to `.env` and point `API_URL` at your running backend:

   ```bash
   cp .env.example .env
   ```

   - Android emulator: the default `http://10.0.2.2:8002/api/v1` already works, since `10.0.2.2`
     is the emulator's alias for your host machine.
   - Physical device or iOS simulator: set `API_URL` to `http://<your-machine's-LAN-IP>:8002/api/v1`.
     Your phone and computer need to be on the same network.

3. Start the backend (in the `memory-map` repo) with `python manage.py runserver 0.0.0.0:8002`.

4. Build and run the dev client (only needed again if native deps change):

   ```bash
   npx expo run:android   # needs Android Studio / an emulator or device
   npx expo run:ios       # needs Xcode, macOS only
   ```

   After that, day-to-day development is just `npm start`, which reloads JS into the already-built
   dev client.

5. Register an account in the app - there's no seed user, so sign up first.

## Saving a location by sharing a reel

The goal: from inside the Instagram app, tap Share on a reel, pick "Memory Map", get a small
overlay to confirm/save, and land back where you were - no full app switch to babysit.

**What's actually implemented, honestly:**

- **Android** (`expo-share-intent`): Memory Map appears in the native share sheet for any shared
  text/link. Tapping it currently **foregrounds the full app** (opens `ShareReviewScreen`) rather
  than showing an in-place overlay - that's this library's default behavior on Android; there's no
  well-supported way to get a true translucent mini-overlay without hand-written native Activity
  code that I couldn't build or verify without an Android emulator in this environment.
- **iOS** (`expo-share-extension`): this one *does* give a real native overlay - a small card
  rendered on top of Instagram (see `src/share-extension/ShareExtensionRoot.tsx`), with a "Save
  Location" button. Because that extension runs as a separate, unauthenticated process, tapping
  Save hands off to the main app (`openHostApp`, via the `memorymap://` URL scheme) to do the
  actual authenticated extraction/search/save in `ShareReviewScreen` - so the overlay itself is
  real, but the save still involves a brief app switch.
- Once in `ShareReviewScreen` on either platform: it calls the backend's `/analyze-reel/`. If Gemini
  extracted a location from the caption, tap it to save (it's geocoded via the same OpenStreetMap
  search already used elsewhere in the app). If not - which is the common case until the backend's
  `INSTAGRAM_OEMBED_ACCESS_TOKEN` is configured (see the backend README) - you search and save
  manually instead, tagged with the source reel URL. Either path ends at the same save flow already
  used elsewhere in the app.

**What I could not verify:** this whole feature needs `expo prebuild` to generate real native
projects, and I have no Android emulator, iOS simulator, or Mac/Xcode in this environment. I
verified everything that's checkable without one - `expo-doctor`, `tsc`, `expo export` bundling
the main app *and* the share extension's separate JS bundle (`index.share.js`) cleanly, and
inspecting the generated `AndroidManifest.xml` / iOS `Info.plist` / Xcode share-extension target
after `expo prebuild` to confirm the intent-filter, URL scheme, App Group, and activation rules are
all wired correctly. None of that proves the on-device UX is right - that needs a real build on
your end. `expo-doctor` also flags `expo-share-extension` as untested against React Native's New
Architecture, which this app now uses by default at SDK 57 - worth knowing if you hit native
crashes specifically in the extension.

To actually test on a device: `npx expo run:android` / `npx expo run:ios` (iOS needs a paid Apple
Developer account to install a share extension on a physical device - the simulator works without
one but obviously can't run the real Instagram app to test the share flow itself).
