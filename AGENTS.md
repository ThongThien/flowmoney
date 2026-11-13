This is a mobile-first, offline-first Next.js PWA for personal finance.

## Architecture

- Use Next.js App Router and TypeScript. Routes live in `src/app/`.
- Use semantic HTML and responsive CSS. Do not introduce React Native or Expo packages.
- IndexedDB through the singleton in `src/lib/db.ts` is the durable local source of truth.
- Zustand is only for transient UI/application state. Do not duplicate durable financial records in Zustand.
- Browser-only APIs (Dexie, IndexedDB, service workers, `window`, `navigator`) must stay behind client boundaries.
- Keep the application deployable as a static export to Vercel. Do not add a backend unless the owner changes the architecture.

## Data safety

- Every Dexie schema change must add a new database version and an explicit upgrade path.
- Backup files are versioned and validated before import.
- Never overwrite local data during import without explicit user confirmation and a recovery path.
- Money values must eventually use an agreed integer/minor-unit representation; wait for the business specification before creating finance tables.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

Run build, lint, and typecheck before declaring implementation work complete.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
