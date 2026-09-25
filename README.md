# MemoryMap

MemoryMap is a React Native application that allows users to save and explore locations on a map.
It talks to the [memory-map](https://github.com/naveenmorla1901/memory-map) Django backend for
authentication and saved locations - the two repos are meant to run together.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development) or Xcode (for iOS development)
- The [memory-map](https://github.com/naveenmorla1901/memory-map) backend running locally (see
  that repo's README) - this app has nothing to talk to without it.

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

4. Start the app:

   ```bash
   npm start
   ```

   Then press `a` for Android or `i` for iOS, or scan the QR code with Expo Go.

5. Register an account in the app - there's no seed user, so sign up first.

