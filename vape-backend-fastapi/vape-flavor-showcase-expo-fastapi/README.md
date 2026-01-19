# Vape Flavor Showcase (Expo)

This is a React Native + Expo version of the original Next.js project.

## Run it

1) Install dependencies

```bash
npm install
```

2) Start the app

```bash
npx expo start
```

Then open it in **Expo Go** (or iOS Simulator / Android Emulator).

## Backend sync (shared across devices)

This app loads/saves products to your FastAPI backend (the one in `vape-backend-fastapi`).

### 1) Start the backend

From the backend folder:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Point Expo to your backend

Create a file named `.env` in the project root:

```bash
# iOS Simulator: http://localhost:8000
# Android Emulator: http://10.0.2.2:8000
# Real phone: http://<YOUR_LAN_IP>:8000
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.23:8000

# Optional (only if you set API_KEY on the backend)
# EXPO_PUBLIC_API_KEY=some-secret
```

Then restart Expo with cache cleared:

```bash
npx expo start --clear
```

## Notes

- Inventory changes (per flavor) save to the backend immediately.
- Products are shared across devices as long as they use the same backend URL.
- **Device-picked images are local (`file://...`) and are not shared across devices** unless you implement image uploading/storage.

### UI

- This build is **grid-only** (no header/hero).
- Adding a product does not require price or description.

