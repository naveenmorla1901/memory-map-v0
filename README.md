# Memory Map

Save the places you see in Instagram reels to your own map. Tap **Share** on a reel, pick
**Memory Map**, and a small sheet slides up over Instagram with the places the reel mentions. Tap
**Save** and you're back to scrolling.

React Native (Expo SDK 57, New Architecture) for iOS and Android. It talks to the
[memory-map](https://github.com/naveenmorla1901/memory-map) Django backend.

## Features

- **Share to save** - an iOS share extension and an Android share overlay run *on top of
  Instagram*: they read the reel, list the places found (with anything already saved marked),
  and save them without opening the app. Unrecognised places can be searched for right there.
- **Map** - vector map (MapLibre + OpenFreeMap, no API key) with category-colored pins,
  clustering, name labels, light/dark styles, a bouncing pin for the selected place, and
  long-press to drop a pin anywhere.
- **Places** - search, filters (want to go, visited, favorites, from reels, categories), sort
  (recent, nearest, name), swipe right to mark visited, swipe left to delete (with Undo),
  pull to refresh, and an offline copy of everything.
- **Place pages** - live map preview, directions (Apple/Google Maps), share, open the source
  reel, favorite/visited, notes, and nearby alerts with an adjustable radius.
- **Nearby alerts** - optional notifications when you're close to a saved place, using the
  phone's geofencing: works with the app closed, and your location never leaves the phone.
- **Accounts** - sign up, sign in, forgot password, edit profile, change password (signs out
  other devices), delete account, light/dark/auto appearance, km/miles.

## Getting started

You need Node 20+, and Android Studio and/or Xcode (macOS). The app uses native code
(maps, share extension), so it runs in a **development build**, not Expo Go.

```bash
npm install
cp .env.example .env            # point EXPO_PUBLIC_API_URL at your backend
npx expo run:android            # or: npx expo run:ios
```

After the first native build, `npm start` is enough for day-to-day JavaScript changes. Rebuild
(`expo run:*`) whenever you add a native dependency or change `app.config.ts`.

Start the backend first (see its README): `python manage.py runserver 0.0.0.0:8002`.

| Where the app runs | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| Android emulator | `http://10.0.2.2:8002` |
| iOS simulator | `http://localhost:8002` |
| Physical phone (same Wi-Fi) | `http://<your computer's LAN IP>:8002` |

### Checks

```bash
npm run typecheck
npm test
```

CI (`.github/workflows/ci.yml`) also bundles the app and the share extension, generates both
native projects, and compiles an Android release build.

## Trying share-to-save

- **Android**: build and install, open Instagram, tap Share on a reel, then "Share to…" / More,
  and pick Memory Map. The overlay appears over Instagram.
- **iOS**: the share extension only exists in a real build (`expo run:ios` or EAS). In the
  share sheet, scroll the app row to **More** and enable Memory Map.
- **Anywhere**: in Instagram tap **Copy link**, then paste it into the app's search bar.

Share extension and app share the sign-in through an iOS App Group
(`group.<bundle id>`) used as a keychain access group. If you sign in after sharing, the app
continues with that reel.

## Releasing

1. **Identity** - set `APP_BUNDLE_ID` (e.g. `com.yourname.memorymap`) in `eas.json` or your
   environment. On iOS register the App Group `group.<bundle id>` for both the app and
   `<bundle id>.ShareExtension` (EAS does this for you when it manages credentials).
2. **Backend URL** - set `EXPO_PUBLIC_API_URL` (and optionally `EXPO_PUBLIC_SUPPORT_EMAIL`) in
   the `preview` and `production` profiles of `eas.json`. Production builds refuse plain http.
3. **Build** - `npx eas-cli init`, then `npx eas-cli build --profile production --platform all`.
4. **Store listings** - privacy policy: `https://<backend>/privacy/`; account deletion:
   `https://<backend>/delete-account/`; terms: `https://<backend>/terms/`.
   - *App Store privacy labels*: name, email, and user content (saved places) linked to the
     user for app functionality; coarse location (search bias) not linked. No tracking.
   - *Play Data safety*: same as above. Location is used in the app, and in the background
     only if the user turns on nearby alerts.
   - *Play background location declaration*: required because of nearby alerts - describe the
     feature ("notify me when I'm near a place I saved", off by default) and include a short
     video of turning it on.
5. **Icons** - `assets/` holds generated placeholder artwork (`npm run icons`). Swap in your
   own; keep the same file names and sizes.

### Things to check on real devices before launch

These can't be verified on a build server:

- The iOS share extension end to end (`expo-share-extension` is flagged as not yet tested on the
  New Architecture by React Native Directory - the app builds, but test it on a device).
- The Android overlay on a few Android versions (the overlay is a translucent activity in its
  own task; Instagram should stay visible behind it and come back after Save).
- Nearby alerts: enable them, mark a place, and walk/drive into its radius.

## Project layout

```
App.tsx                  providers: settings -> theme -> toasts -> auth -> location -> places
index.js                 app entry + Android share overlay entry + background task
index.share.js           iOS share extension entry
app.config.ts            app identity, permissions, privacy manifest, plugins
plugins/                 config plugins: Android share overlay activity, iOS extension polish
src/
  api/                   fetch client (timeouts, friendly errors, token refresh), endpoints, types
  state/                 auth, places (offline cache, optimistic updates, undo), settings, location
  share/                 the share-to-save flow, shared by the app, iOS extension, Android overlay
  map/                   MapLibre map with clustering and animated pins
  nearby/                geofencing task and sync
  screens/               auth, map, places, profile, share
  ui/                    design system: text, buttons, fields, chips, sheet, toast, skeletons...
  theme/                 colors (light/dark), type scale, spacing, motion, categories
```
