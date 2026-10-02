# Memory Map - run, host and test it on your phone

Everything in one place: the backend (repo `memory-map`) and the app (this repo, `memory-map-v0`).

```
Instagram ──share──▶ Memory Map drawer (iOS share extension / Android overlay)
                         │  HTTPS + JWT
                         ▼
                 Django API (memory-map) ──▶ Postgres
                         ├──▶ yt-dlp: reads the reel caption
                         ├──▶ Gemini: finds the places in it
                         └──▶ Photon (OpenStreetMap): puts them on the map
```

## What you need

| For | You need | Cost |
| --- | --- | --- |
| Backend hosting | A [Render](https://render.com) account (or any Docker host) | Free tier works for testing |
| Reel analysis | Your Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)) | Free tier |
| Building the app | An [Expo](https://expo.dev) account; `npm i -g eas-cli` | Free |
| Android phones | Nothing else - you get an APK anyone can install | Free |
| iPhones | [Apple Developer Program](https://developer.apple.com/programs/) (the share extension needs an App Group, which free accounts can't sign) | $99/year |
| Password-reset emails | Optional: a Gmail account + App Password | Free |

## 1. Host the backend (Render, ~10 minutes)

1. Push the `memory-map` repo to GitHub (already done).
2. Render dashboard -> **New -> Blueprint** -> pick the `memory-map` repo. `render.yaml` creates the API
   and a Postgres database and wires them together (secret key, database URL, host name and public
   URL are all automatic).
3. When it asks for environment values, set **`GOOGLE_API_KEY`** to your Gemini key. Leave the email
   ones empty for now.
4. Wait for the deploy, then open `https://<your-service>.onrender.com/healthz/` - it should say
   `{"status": "ok"}`. Note this URL; the app needs it.
5. Create an admin login: Render -> your service -> **Shell** -> `python manage.py createsuperuser`.
   The admin site is at `/admin/`.

Free-tier notes: the server sleeps after 15 minutes idle, so the first request afterwards takes ~1
minute (later ones are instant). The free database expires after 30 days - upgrade it (or use
Neon/Supabase and set `DATABASE_URL`) before real users rely on it.

### Email without an email service

- **Do nothing**: sign-up and sign-in don't need email. Password-reset emails are written to the
  server log (Render -> **Logs**) - copy the link from there. As admin you can also set anyone's
  password at `/admin/`.
- **Send real emails from Gmail**: turn on 2-Step Verification on the Gmail account, create an App
  Password at <https://myaccount.google.com/apppasswords>, and set on Render:
  `EMAIL_HOST=smtp.gmail.com`, `EMAIL_HOST_USER=you@gmail.com`, `EMAIL_HOST_PASSWORD=<16-char app password>`.
  Gmail allows ~500 emails/day, plenty for now.

### Making reel reading reliable

Instagram limits anonymous access, especially from cloud servers. If many reels come back as "search
for it yourself", log into Instagram in a browser with a **spare** account, export its cookies
("Get cookies.txt" extension), upload the file on Render as a **Secret File** named
`instagram_cookies.txt`, and set `INSTAGRAM_YTDLP_COOKIES_FILE=/etc/secrets/instagram_cookies.txt`.
Re-export it every few weeks. (`REEL_ANALYSIS_ENABLED=False` switches the feature off entirely.)

## 2. Build the app and install it on phones

```bash
cd memory-map-v0
npm install
npx eas-cli login
npx eas-cli init            # copy the project ID it prints into EAS_PROJECT_ID in app.config.ts
```

Put your backend URL in `eas.json` (both `preview` and `production` -> `EXPO_PUBLIC_API_URL`, e.g.
`https://memory-map-api.onrender.com`, no trailing `/api/v1`). Optionally change `APP_BUNDLE_ID` in
`app.config.ts` to your own (e.g. `com.yourname.memorymap`) - do this before the first iOS build.

**Android (any phone):**

```bash
npx eas-cli build --platform android --profile preview
```

When it finishes (~15 min) you get a link/QR code to an `.apk`. Open it on any Android phone, allow
"install unknown apps", install. Send the same link to friends.

**iPhone:**

```bash
npx eas-cli build --platform ios --profile preview     # your own registered devices
# or, for TestFlight (any tester):
npx eas-cli build --platform ios --profile production && npx eas-cli submit --platform ios
```

Let EAS manage credentials when asked; it creates the App Group and signs both the app and the
share extension. For `preview`, register each iPhone first with `npx eas-cli device:create`.

## 3. Try the real thing

1. Open Memory Map, create an account.
2. Open Instagram, find a reel that names a place (a restaurant, beach, viewpoint...).
3. Tap **Share** (paper plane):
   - **Android**: tap the share/"Share to..." option at the end of the row, pick **Memory Map**.
   - **iPhone**: scroll the app row to **More**, enable **Memory Map** (and drag it to the front once).
4. A drawer slides up over the bottom half of Instagram: "Reading the reel..." then the places it
   found, all ticked. Untick what you don't want, tap **Search** to fix or add a place, then
   **Save** - or **Not now** / **X** / tap outside to dismiss without saving.
5. After Save you see a tick, and the drawer slides away by itself: you're back in Instagram.
6. Open Memory Map - the places are on your map.

If you aren't signed in, the drawer offers **Open Memory Map**; after you sign in the app continues
with that reel. Copying the reel link and pasting it into the app's search bar also works.

## Developing locally (optional)

**Backend:**

```bash
cd memory-map
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # set GOOGLE_API_KEY
python manage.py migrate
python manage.py runserver 0.0.0.0:8002
DEBUG=True python manage.py test  # 72 tests, no network needed
```

**App** (needs Android Studio, or Xcode on a Mac; it can't run in Expo Go):

```bash
cd memory-map-v0
cp .env.example .env              # EXPO_PUBLIC_API_URL=http://<your computer's Wi-Fi IP>:8002
npx expo run:android              # phone plugged in by USB with USB debugging, or an emulator
npx expo run:ios --device         # Mac + iPhone
npm run typecheck && npm test
```

To test a **phone build against your laptop's backend** without hosting, give it a public HTTPS URL
with `cloudflared tunnel --url http://localhost:8002` and use that URL as `EXPO_PUBLIC_API_URL`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| App says "Can't reach Memory Map" | Wrong `EXPO_PUBLIC_API_URL` in `eas.json` (rebuild after changing it), or the free server is waking up - wait a minute. |
| Every reel says "search for it yourself" | No `GOOGLE_API_KEY`, or Instagram blocked the server - add cookies (above). Render -> Logs shows which. |
| Memory Map missing from the iOS share sheet | Share sheet -> More -> enable it. Needs a real build (not a simulator dev client). |
| Android share opens but stays blank | Update to the latest build; check the app can sign in on its own first. |
| Password reset email never arrives | Expected without Gmail settings - copy the link from Render -> Logs. |

## Before you call it a public launch

- Your own bundle ID, real app icons (`assets/`), and store listings (privacy URL:
  `https://<backend>/privacy/`, account deletion: `/delete-account/`).
- A paid database (or external Postgres) and, for steady use, a paid Render instance (no sleeping).
- Have someone legal read `/privacy/` and `/terms/`. Note automated reading of Instagram may
  conflict with Instagram's terms - keep `REEL_ANALYSIS_ENABLED` as your kill switch.
- Rotate any secrets that were ever committed to these repos' history.
