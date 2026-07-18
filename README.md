# Forest Buddies

A sustainable marketplace and affiliate platform built with **Next.js 15**, **Tailwind CSS**, **shadcn/ui**, and **Firebase** (Auth + Firestore).

## Features

- Eco-friendly marketing site with hero, marketplace, affiliates, and about pages
- Firebase Auth context (email/password) with Firestore user profiles
- Affiliate dashboard with demo stats and referral link placeholder
- Responsive navigation with mobile sheet menu
- Design tokens: forest green, sage, cream, gold rewards accent

## Prerequisites

- Node.js 20+
- npm
- A [Firebase](https://console.firebase.google.com/) project (for auth and database)

## Quick start

```bash
cd C:\Users\cvasi\Projects\root-rewards
npm install
cp .env.local.example .env.local   # Windows: copy .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Firebase setup

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. **Build → Authentication → Sign-in method**: enable **Email/Password**.
3. **Build → Firestore Database**: create a database (start in test mode for local dev, then add security rules before production).
4. **Project settings → General → Your apps**: register a **Web** app and copy the config object.
5. Paste values into `.env.local`:

   | Variable | Firebase config field |
   |----------|------------------------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | apiKey |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | authDomain |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | projectId |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | storageBucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | messagingSenderId |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | appId |

6. Restart `npm run dev` after changing env vars.

### Suggested Firestore collections

- `users/{uid}` — profile: `email`, `displayName`, `role`, `affiliateCode`, `updatedAt`
- `products/{id}` — marketplace catalog (optional; UI includes placeholders until populated)

### Example security rules (starter)

Rules live in `firestore.rules` (deploy via `firebase.json`):

- `users/{uid}` — owner read; create only as `role: "customer"`; updates cannot change `role`; field length limits
- `products/{id}` — public read, no client writes
- Default deny for all other paths

```bash
firebase deploy --only firestore:rules
```

Client helpers: `src/lib/validation.ts` (form checks) and `src/lib/rate-limit.ts` (browser cooldown simulation). Legal pages: `/privacy`, `/terms`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | ESLint |

## Project structure

```text
src/
  app/                    # App Router pages
  components/
    layout/               # Header, footer, nav
    ui/                   # shadcn components
  contexts/               # AuthProvider
  lib/firebase/           # Firebase client modules
  types/                  # Shared TypeScript types
```

## License

Private — all rights reserved.
