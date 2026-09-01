# Website Factory Ops — iPhone Admin

Expo mobile admin app for [zbrendiraj.si](https://zbrendiraj.si) Website Factory Ops Console.

## Features

- **Inbox** — Command Center with onboarding review, publish failed, SMS actionable
- **Leads** — paginated list, pipeline filters, search, bulk SMS
- **Pipeline** — onboarding kanban
- **Factory** — live ops, dispatch worker, cleanup locks
- **Revenue** — MRR, funnel, SMS metrics, audit log
- **Entity Journey** — unified timeline, sticky actions (SMS, approve, retry publish)
- **Global search** — search icon in tab header

## Setup

```bash
cd apps/admin-mobile
npm install
npm start
```

Scan QR with Expo Go on iPhone, or run:

```bash
npm run ios
```

## Login

- **Base URL:** `https://zbrendiraj.si` (or local dev URL)
- **Secret:** your `ADMIN_SECRET` env value

Credentials are stored in iOS Keychain via `expo-secure-store`.

## TestFlight build

1. Install EAS CLI: `npm i -g eas-cli`
2. Login: `eas login`
3. Configure `app.json` → `extra.eas.projectId`
4. Build: `eas build --platform ios --profile preview`
5. Submit: `eas submit --platform ios`

## API

Uses Bearer `ADMIN_SECRET` against `/api/admin/*` endpoints.
