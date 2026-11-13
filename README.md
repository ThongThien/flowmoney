# FlowMoney

FlowMoney is a mobile-first, offline-first personal finance PWA for accounts, income/expenses, transfers, debts, savings goals, and statistics.

## Stack

- Next.js App Router, React, and TypeScript
- Dexie over IndexedDB for durable on-device data
- Zustand for transient application state
- Web app manifest and a service worker for installation/offline access
- Static export for zero-backend deployment on Vercel

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The service worker is intentionally registered only in production so it does not interfere with hot reload during development.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
```

The production build is written to `out/`.

## Vercel deployment

1. Push this repository to a Git provider.
2. Import the repository into Vercel.
3. Keep the detected framework as Next.js.
4. Deploy. No environment variables, database service, or backend are required.

The generated `*.vercel.app` domain and HTTPS certificate are sufficient for installing the PWA. On iOS, open the site in Safari and choose **Share → Add to Home Screen**.

## Local data and backup

`src/lib/db.ts` keeps schema version 1 for existing installations and introduces the finance domain in schema version 2. Money is stored as integer VND values.

`src/lib/backup.ts` and the settings screen provide versioned export/import with validation and confirmation before replacement.

There is no cloud synchronization. IndexedDB data belongs to the browser profile and origin, so backup/export is required before moving to another device or clearing Safari data.
