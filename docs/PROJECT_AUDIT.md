# FlowMoney Project Audit Before PWA Migration

**Audit date:** 2026-11-13  
**Scope:** Repository contents, source, configuration, installed top-level packages, lockfile, generated Expo metadata, assets, and Git state.  
**Audit constraint:** This report is the only file added. No application files, dependencies, configuration, or business logic were changed.

## Executive summary

FlowMoney is currently an almost untouched Expo/React Native starter. The repository has one placeholder screen, one Expo bootstrap entry point, Expo configuration, TypeScript configuration, and the default image assets. It does **not** contain finance-domain screens, reusable UI components, business logic, database schema or queries, Zustand stores, Expo Router routes, React Native Paper, Victory Native, a web manifest, a service worker, or offline behavior.

The project folder and its Git history can be reused, but the application foundation must be changed in place from Expo/Metro/React Native to Next.js/App Router/DOM. Because no product implementation exists, this is a low-code-preservation migration: preserve the repository identity, license, potentially useful artwork, package identity, and any project-owner intent; replace the starter framework files only after approval.

## A. Current project status

### A1. Framework and runtime

| Item | Current state |
| --- | --- |
| Framework | Expo SDK 58 (`expo` 58.0.23), React Native 0.88.1 |
| UI runtime | React 19.3.0; React DOM 19.3.0 and React Native Web 0.21.4 are installed but unused |
| Language | TypeScript 6.0.3, strict mode enabled through Expo's base config |
| Navigation | `expo-router` 58.0.30 is installed and listed as an Expo plugin, but is not the entry point and no routes exist |
| Database | `expo-sqlite` 58.0.15 is installed and listed as an Expo plugin, but no database is opened and no schema, migration, query, or data exists |
| State management | No Zustand package and no stores |
| UI libraries | No React Native Paper; no Victory Native; no chart library |
| PWA | No web app manifest, service worker, registration code, cache policy, install UI, or offline fallback |
| Package manager evidence | npm (`package-lock.json`, lockfile version 3); no Bun lockfile |
| Local runtime observed | Node 24.11.1, npm 10.5.2 |
| Native projects | No `ios/` or `android/` directories; the Expo project uses generated native projects/CNG conventions |

The current Next.js documentation lists Node 20.9 as the minimum, so the observed Node runtime is sufficient. The runtime used in development and deployment should nevertheless be pinned to an active Node LTS release rather than relying on an unpinned local installation.

### A2. Installed top-level dependencies

All declared packages are present under `node_modules` at the following resolved versions:

| Package | Installed version | Used by source/config? |
| --- | ---: | --- |
| `expo` | 58.0.23 | Yes: bootstrap and TypeScript base config |
| `expo-constants` | 58.0.15 | No direct use |
| `expo-linking` | 58.0.16 | No direct use |
| `expo-router` | 58.0.30 | Config plugin only; no router entry point or routes |
| `expo-sqlite` | 58.0.15 | Config plugin only; no database implementation |
| `expo-status-bar` | 58.0.4 | Yes: placeholder screen |
| `react` | 19.3.0 | Yes |
| `react-dom` | 19.3.0 | No direct use; required by the future Next.js app |
| `react-native` | 0.88.1 | Yes: placeholder screen and Expo runtime |
| `react-native-safe-area-context` | 5.11.1 | No direct use |
| `react-native-web` | 0.21.4 | No direct use |
| `@types/react` | 19.3.0 | TypeScript support |
| `typescript` | 6.0.3 | TypeScript compiler |

Packages specifically checked and **not installed**: `next`, `dexie`, `dexie-react-hooks`, `zustand`, `react-native-paper`, and `victory-native`.

The lockfile contains 556 package entries, primarily the transitive Expo/React Native toolchain. It is internally aligned with the current `package.json` root dependency declarations.

### A3. Complete relevant structure

Generated dependency contents under `node_modules/`, Git internals under `.git/`, and the generated cached PNG under `.expo/web/cache/` are summarized rather than expanded file-by-file.

```text
flow-money/
├── .claude/
│   └── settings.json                 # Enables an Expo-specific Claude plugin
├── .expo/                            # Ignored, machine-local Expo state
│   ├── README.md
│   ├── devices.json                  # Empty device list
│   └── web/cache/.../favicon-48.png  # Generated cache
├── .git/                             # One-commit repository metadata
├── assets/
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── icon.png
│   └── splash-icon.png
├── node_modules/                     # Installed and ignored
├── .gitignore
├── AGENTS.md                         # Expo-specific project instructions
├── app.json                          # Expo application configuration
├── App.tsx                           # Default placeholder React Native screen
├── index.ts                          # Expo registerRootComponent entry point
├── LICENSE                           # MIT license
├── package-lock.json
├── package.json
└── tsconfig.json
```

There is no `src/`, `app/`, `pages/`, `components/`, `stores/`, `lib/`, `db/`, or `public/` directory.

### A4. Entry points, routing, UI, data, and state

- `package.json` sets `main` to `index.ts`.
- `index.ts` imports Expo's `registerRootComponent` and registers `App`.
- `App.tsx` renders only the create-expo-app placeholder text in a centered React Native `View`, plus `expo-status-bar`.
- Expo Router is not operational: `main` is not `expo-router/entry`, there is no `src/app/` or `app/` route tree, and no Router APIs are imported.
- There are no reusable UI components or implemented product screens.
- Expo SQLite is configured as a plugin but never imported. There is no existing database file or on-device data migration path in the repository.
- There are no Zustand stores or other state containers.
- There is no business/domain logic to port. A repository-wide source search found no account, transaction, income, expense, or budget implementation.

### A5. Expo configuration and assets

`app.json` configures the application name/slug/version, portrait orientation, a light color scheme, tablet support on iOS, Android adaptive icons, predictive-back behavior, and a web favicon. It also lists `expo-router` and `expo-sqlite` as plugins. These settings are Expo-specific; only their product intent (name, icons, theme colors, orientation preference) is potentially reusable.

The six PNG assets are default Expo-oriented icon/splash assets. They may be visually reused, but PWA icon suitability must be checked. A PWA needs explicit web sizes such as 192×192 and 512×512, and preferably a maskable icon. Android adaptive-icon layers are not direct substitutes for all web manifest icons.

`.expo/` is machine-local generated state and is already ignored. `.claude/settings.json` is tracked and enables an Expo-specific plugin; it is development tooling, not application functionality.

### A6. Git status before this report

- Branch: `master`
- History: one commit, `0870538 Initial commit`
- Pre-audit tracked modifications:
  - `app.json`: added `expo-router` and `expo-sqlite` plugins.
  - `package.json`: added `expo-constants`, `expo-linking`, `expo-router`, `expo-sqlite`, `react-dom`, `react-native-safe-area-context`, and `react-native-web`.
  - `package-lock.json`: updated for those dependencies (large transitive change).
- No pre-audit untracked files were visible.
- Git emitted a repository ownership warning under the sandbox account. The audit used a command-local `safe.directory` override; it did not alter local or global Git configuration.
- Git also warned that LF may become CRLF when the three modified JSON files are next touched. A future migration should choose and document line-ending policy before mass rewrites.

The modifications above belong to the project owner and must not be discarded accidentally during migration. The new `docs/PROJECT_AUDIT.md` file is the only audit-created working-tree change.

## B. Compatibility analysis

Action meanings: **REUSE** = retain substantially as-is; **ADAPT** = preserve useful intent/code but change it for the web architecture; **REMOVE** = remove during the approved migration because it is old-stack-only; **ADD** = absent and required/recommended for the target.

| Component | Current status | Target status | Action |
| --- | --- | --- | --- |
| Repository folder and Git history | Existing `flow-money` root with one commit | Same project root and history | **REUSE** — migrate in place; do not create a nested project |
| MIT `LICENSE` | Present | Still applicable unless owner changes licensing | **REUSE** |
| React | 19.3.0, used by Expo app | Required by Next.js | **REUSE**, subject to Next peer-dependency verification when installing |
| React DOM | 19.3.0, installed but unused | Required web renderer | **REUSE**, subject to version alignment with React/Next |
| TypeScript | 6.0.3 and strict mode | Required | **REUSE** compiler; **ADAPT** config away from `expo/tsconfig.base` |
| `@types/react` | 19.3.0 | Required for TS/React | **REUSE**, aligned with React |
| Next.js | Not installed | Core framework, App Router | **ADD** |
| App Router files | Absent | `src/app` route tree | **ADD** |
| Expo | Core current framework | Not part of target | **REMOVE** after Next boots successfully |
| Expo Status Bar | Used in placeholder only | Browser metadata/theme replaces it | **REMOVE** |
| Expo Constants | Installed, unused | No requirement | **REMOVE** |
| Expo Linking | Installed, unused | Next navigation/Web APIs replace it | **REMOVE** |
| Expo Router | Installed/plugin-listed, not operational | Next App Router | **REMOVE**; there are no routes to translate |
| Expo SQLite | Installed/plugin-listed, unused | Dexie over IndexedDB | **REMOVE**; no schema/data code exists to port |
| React Native | Used only by placeholder UI/bootstrap | DOM/CSS responsive UI | **REMOVE** |
| React Native Web | Installed, unused | Native DOM components in Next | **REMOVE** unless the owner deliberately chooses a cross-platform RN Web layer, which is outside the stated target |
| React Native safe-area context | Installed, unused | CSS `env(safe-area-inset-*)` as needed | **REMOVE** |
| React Native Paper | Not installed and not used | Responsive web UI system, choice not yet specified | No removal needed; do **not add** it. Choose web-native CSS/components during design |
| Victory Native | Not installed and not used | Web charting only if product requirements need charts | No removal needed; defer any chart dependency until requirements exist |
| `App.tsx` | Default RN placeholder only | Next pages/layout | **REMOVE** after replacement; no business value to port |
| `index.ts` | Expo bootstrap | Next CLI/framework entry | **REMOVE** after replacement |
| `app.json` | Expo-only configuration | Next config + metadata/manifest | **ADAPT** product metadata/icons, then **REMOVE** the Expo file |
| `tsconfig.json` | Extends Expo base | Next-generated strict TS config and aliases | **ADAPT** |
| `package.json` | Expo entry/scripts/dependencies | Next scripts and target dependencies | **ADAPT** |
| `package-lock.json` | Expo-heavy npm graph | Locked Next/PWA graph | **ADAPT** by npm after approved dependency changes; do not hand-edit |
| `.gitignore` | Expo/RN focused | Next/npm/editor/environment outputs | **ADAPT**; retain useful generic rules |
| `AGENTS.md` | Requires Expo patterns and commands | Must describe Next/PWA conventions | **ADAPT** so future work is not instructed to recreate Expo architecture |
| `.claude/settings.json` | Enables Expo-specific tooling | Not required for Next | **REMOVE** or update based on owner tooling preference; not runtime code |
| `.expo/` | Ignored local generated state | No target role | **REMOVE** locally after Expo retirement; never migrate/commit it |
| Existing PNG assets | Expo icon set, no product-specific review | PWA favicon and install icons in `public/` | **ADAPT**/reuse artwork if approved; generate correct web sizes and maskable variants |
| Business logic | Absent | Finance domain modules | **ADD** later from requirements; nothing exists to preserve |
| Zustand | Not installed; no stores | Client UI/workflow state | **ADD**; keep durable financial records in Dexie, not only Zustand |
| Dexie/IndexedDB | Absent | Durable local database | **ADD** `dexie`; add `dexie-react-hooks` for reactive client queries |
| PWA manifest | Absent | App Router manifest | **ADD** |
| Service worker/offline cache | Absent | Required for full offline shell/assets | **ADD**; use a deliberate cache/version/update policy |
| Responsive UI | Only a centered RN placeholder | Mobile-first semantic DOM/CSS | **ADD** |
| Tests/lint | No lint/test scripts or test files | Quality gates for database/offline behavior | **ADD** lint immediately; choose test tooling when implementation begins |

## C. Migration plan

This is a proposed future file operation map, **not work performed by this audit**. Removal should occur only after the replacement foundation builds and after the owner approves the migration.

### C1. Keep

| File/path | Reason |
| --- | --- |
| `LICENSE` | Framework-independent project licensing |
| `.git/` | Preserve history and repository identity |
| Project root `flow-money/` | Required in-place migration; avoid a nested duplicate project |
| `package.json` | Preserve package name/version/private metadata while editing its framework fields |
| `package-lock.json` | Keep npm as the package manager; regenerate through npm during approved dependency changes |
| `.gitignore` | Preserve generic dependency, debug, OS, secret, and TypeScript ignores while updating framework rules |
| `assets/*.png` | Keep until visual review and PWA icon conversion are complete; do not discard source artwork prematurely |
| `docs/PROJECT_AUDIT.md` | Migration decision record |

### C2. Modify

| File | Required future change and reason |
| --- | --- |
| `package.json` | Remove Expo entry/scripts/packages; add Next scripts and target dependencies; preserve name/version/private fields |
| `package-lock.json` | Regenerate with npm so it reflects the approved dependency graph |
| `tsconfig.json` | Remove `expo/tsconfig.base`; use Next-compatible strict settings, DOM libs, Next plugin, and optional `@/*` alias |
| `.gitignore` | Add `.next/`, `out/` if static export is selected, Next environment conventions, and service-worker build output rules; remove obsolete rules only when safe |
| `AGENTS.md` | Replace Expo-only instructions with Next App Router, client/server boundary, Dexie, PWA, and validation guidance |
| `assets/*.png` or copies under `public/` | Validate artwork, resize/export required PWA icon variants, and preserve original sources until approved |

### C3. Remove after replacement is verified

| File/path | Why it becomes obsolete |
| --- | --- |
| `App.tsx` | RN placeholder; Next uses App Router pages/layouts |
| `index.ts` | Expo bootstrap; Next owns application startup |
| `app.json` | Expo configuration; relevant metadata moves to Next metadata/manifest/config |
| `.expo/` | Machine-local Expo state/cache |
| `.claude/settings.json` | Expo-specific plugin setting, if the owner does not need it for other work |
| Expo-only `node_modules` contents | Replaced naturally by the approved npm install/prune process; never edit manually |

No source file containing business logic, domain models, stores, routes, or database code is listed for removal because none exists.

### C4. Create for the target foundation

The exact feature-screen tree depends on product requirements. The following is the minimum recommended architectural foundation:

| New file/path | Purpose |
| --- | --- |
| `next.config.ts` | Next configuration plus service-worker integration/headers as selected |
| `next-env.d.ts` | Next TypeScript declarations (generated/maintained by Next) |
| `eslint.config.mjs` | Next/TypeScript lint configuration |
| `src/app/layout.tsx` | Root HTML/body layout and metadata |
| `src/app/page.tsx` | Initial route, replacing the Expo placeholder |
| `src/app/globals.css` | Mobile-first global styles, responsive tokens, and safe-area CSS |
| `src/app/manifest.ts` | Typed web app manifest with name, display mode, colors, and icon declarations |
| `src/components/ServiceWorkerRegistration.tsx` | Small client boundary to register/update the worker if the selected integration requires explicit registration |
| `src/lib/db.ts` | Single Dexie instance, versioned schema, and upgrade functions; imported only from browser/client-safe code |
| `src/lib/db.types.ts` | Durable domain record types, separated from UI state |
| `src/stores/useAppStore.ts` | Zustand UI/session/workflow state; financial source-of-truth records remain in Dexie |
| `src/app/offline/page.tsx` | User-friendly navigation fallback when a route is unavailable offline |
| `public/icons/icon-192x192.png` | Standard install icon |
| `public/icons/icon-512x512.png` | Standard install icon |
| `public/icons/maskable-512x512.png` | Maskable install icon with safe-zone artwork |
| `public/favicon.ico` or `src/app/icon.png` | Browser icon, derived from approved artwork |
| Service-worker source/output paths selected by the chosen strategy | Precaching, runtime caching, offline fallback, cleanup, and update behavior |

If Serwist is approved, follow its then-current Next.js integration layout rather than maintaining a large handwritten precache manifest. If a custom worker is chosen, a typical public output is `public/sw.js`, but its source and generated output must be clearly separated and cache headers configured.

Feature files such as transaction, account, budget, and reporting routes should be created only after their requirements and data model are approved. This audit found nothing to copy into them.

### C5. Safest implementation sequence

1. Review and approve this report; separately commit or intentionally retain the owner’s current Expo dependency changes so they cannot be lost accidentally.
2. Record product requirements and the financial data model before defining Dexie schema version 1. Decide whether any real Expo SQLite user data exists outside this repository; the codebase itself creates none.
3. Create the Next foundation **in the existing root**, first preserving `LICENSE`, assets, package metadata, and Git history. Do not run `create-next-app flow-money` from this directory.
4. Align React/React DOM/Next/TypeScript peer versions, replace scripts/config, and get a minimal App Router page passing build, typecheck, and lint.
5. Add responsive semantic web layout and approved PWA icons/manifest.
6. Add Dexie with an explicit versioned schema, migrations, transaction boundaries, quota/error handling, and export/import backup design. Test it with SSR disabled at the database boundary and in multiple tabs.
7. Add Zustand only for ephemeral UI/workflow state. Avoid duplicating durable records between Zustand persistence and Dexie.
8. Add and test the service worker last among the foundation pieces, with explicit cache names, update/activation UX, offline navigation fallback, and safeguards against caching sensitive financial responses.
9. Test production builds over HTTPS on Chromium, Firefox, desktop Safari, and real iOS Safari/Home Screen. Test first load online, subsequent cold start offline, upgrades, cleared storage, low-storage behavior, and backup/restore.
10. Only after the Next/PWA replacement is verified, remove Expo/RN files and dependencies and clean ignored Expo state. Commit migration stages separately for easy rollback.

## D. Dependency plan

### D1. Recommended target dependencies

Core runtime:

- `next`, `react`, `react-dom` — framework and DOM runtime.
- `dexie` — IndexedDB wrapper and schema/version management.
- `dexie-react-hooks` — reactive Dexie queries in client components.
- `zustand` — small client-side UI/workflow state store.

PWA/offline caching:

- Prefer `@serwist/next` plus `serwist` for maintainable service-worker precaching/runtime caching **if** its current release supports the selected Next build mode. Current Next documentation names Serwist as an option for full service-worker-based offline caching.
- A small custom service worker requires no runtime package, but then this project owns precache generation, cache invalidation, navigation fallback, and update correctness. A manifest alone does not provide offline support.

Development:

- `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.
- `eslint`, `eslint-config-next`.
- Do not add a CSS framework, component library, chart library, test runner, sync backend, or push package until requirements justify it.

### D2. Proposed commands — do not run yet

This repository uses npm. Run these only after approval, from the existing project root:

```powershell
npm install next@latest react@latest react-dom@latest dexie dexie-react-hooks zustand
npm install -D typescript @types/node @types/react @types/react-dom eslint eslint-config-next
```

If the owner approves Serwist after checking its current compatibility matrix and selecting the supported Next bundler configuration:

```powershell
npm install serwist
npm install -D @serwist/next
```

Then remove old-stack packages in a separate, reviewable migration step (shown for planning only):

```powershell
npm uninstall expo expo-constants expo-linking expo-router expo-sqlite expo-status-bar react-native react-native-safe-area-context react-native-web
```

Use `@latest` only at the migration moment to resolve a mutually compatible current set, inspect the resolved versions and peer warnings, test them, and commit the lockfile. For reproducible CI/deployments, use `npm ci` after that lockfile is committed. Current documentation observed during this audit identifies Next 16.4.6 and requires Node 20.9+; versions change, so re-check release/support notes when migration begins.

### D3. Version/installation cautions

- Keep `react` and `react-dom` on exactly the same version.
- Confirm the selected Next version's React and TypeScript peer ranges before accepting the install. Existing React 19.3.0 and TypeScript 6.0.3 should not be assumed compatible solely because they are newer.
- Do not install Next by creating a second app directory. Convert the root deliberately.
- Do not keep `react-native-web` merely because Next is web-based; Next renders DOM directly.
- Do not add both a custom offline-caching worker and Serwist without a clear ownership boundary.

## E. Risks

### E1. Expo configuration and dirty working tree

The project’s only non-starter changes are uncommitted dependency/plugin additions. A broad scaffold command or reset could overwrite or discard them and obscure what the owner intended. Snapshot/commit the pre-migration state first. Expo settings such as orientation, adaptive icons, tablet support, and status bar do not translate one-to-one to the web; capture desired behavior before removing `app.json`.

`AGENTS.md` currently requires Expo-specific practices. Leaving it unchanged during migration could cause future contributors or agents to reintroduce Expo patterns.

### E2. React, TypeScript, and framework compatibility

The current versions are unusually current. Next, React DOM, React, `@types/react`, ESLint config, and any PWA build plugin must be selected as one tested set. Peer-dependency warnings should not be forced away. Node is sufficient locally, but hosting/CI must use a supported Node version too.

### E3. Next server/client boundary

IndexedDB, `window`, `navigator`, service workers, and Dexie are browser-only. Importing or constructing the database from a Server Component can fail during server rendering/build. Database consumers, registration code, and Zustand hooks must live behind explicit client boundaries while keeping the overall App Router tree server-first where practical.

### E4. PWA offline support and cache correctness

A web manifest makes the app installable; it does not make it offline-first. The service worker needs a tested application-shell strategy, offline navigation fallback, cache versioning/cleanup, update behavior, and exclusions for sensitive or mutable financial responses. Over-aggressive caching can serve stale balances or strand users on an old schema/app bundle. Service workers require HTTPS outside localhost and behave differently in development and production.

Current Next documentation treats full service-worker caching as an additional integration and cites Serwist as one option. Its experimental connectivity hook is not a substitute for a full cache strategy.

### E5. IndexedDB persistence and consistency

IndexedDB is origin- and browser-profile-specific. It can be cleared by users, private browsing, OS/browser storage pressure, site-data cleanup, or origin/domain changes. Storage persistence should be requested where supported, quota and failed writes must be surfaced, and critical writes should use transactions. Multi-tab changes, concurrent upgrades, blocked version changes, and partial migrations require testing.

Dexie schema versions are effectively append-only migration history once users have data. Schema version 1 therefore needs review before release. Zustand persistence must not become a second conflicting database.

### E6. iOS Safari and installed PWA behavior

Test on real iOS devices, not only responsive desktop emulation. Safari support and installed Home Screen behavior differ from Chromium: install prompting is manual, browser storage may be evicted, background execution is constrained, and service-worker lifecycle/update timing can surprise users. Current Next documentation notes iOS Web Push support for Home Screen-installed apps from iOS 16.4+, but push is not required for this target and should not be added without a product need.

Use manifest icons with safe zones, CSS safe-area insets, touch-sized controls, and an explicit iOS installation explanation if installability is surfaced in the UI.

### E7. Data backup and migration

Offline-first local storage is not a backup. Before real financial records are created, define versioned export/import (for example, a validated JSON format), corruption handling, user-visible backup reminders, and restore tests. Consider encryption and privacy requirements, but do not promise that browser storage is inherently encrypted beyond device/browser protections.

The repository contains no SQLite schema or data access, so there is no code migration today. However, if an Expo build was distributed from another branch or untracked code, its SQLite database cannot be read directly by a website. Migration would require an explicit export from the native app and validated import into Dexie, with stable IDs, currency precision, timestamps/time zones, schema-version metadata, duplicate handling, and rollback/recovery.

Changing production origin, subdomain, or protocol creates a different IndexedDB store. Hosting origin selection should be stable before users store real data.

## F. Final recommendation

### 1. Can the current project be reused?

**Yes, as a repository and project shell, not as an application implementation.** Keep the root folder, Git history, license, npm package identity, and potentially the artwork. There is almost no domain code to port.

### 2. Is rebuilding the foundation necessary?

**Yes.** Expo/React Native startup, rendering, routing configuration, native database package, and TypeScript base config do not form a Next.js PWA foundation. The replacement should be built in place and staged safely; this is not a reason to create a second nested project.

### 3. What should be preserved?

Preserve Git history, `LICENSE`, package name/version/private status, npm lockfile workflow, the audit, all owner changes until deliberately superseded, and original assets until approved web variants exist. Preserve any product intent encoded in the Expo name, colors, icons, and mobile-first orientation—not the Expo configuration mechanism itself.

### 4. What should be removed?

After the Next replacement is verified, remove Expo, React Native, Expo Router, Expo SQLite, React Native Web, safe-area-context, status-bar/Constants/Linking packages; remove `App.tsx`, `index.ts`, `app.json`, ignored `.expo/` state, and Expo-specific tooling instructions/settings that no longer serve the project. React Native Paper and Victory Native require no action because they are not installed.

### 5. What is the safest migration sequence?

Protect the current dirty state; approve requirements and data model; establish a minimal Next App Router build in the same root; align and lock dependencies; add responsive web UI and manifest; add versioned Dexie storage and backups; add Zustand for non-durable state; add/test the service worker and update strategy; verify production behavior across browsers and real iOS; then remove Expo files/dependencies in a separate commit. Do not begin implementation until the project owner approves this plan.

## References checked

- [Expo SDK 58 reference](https://docs.expo.dev/versions/v58.0.0/)
- [Expo documentation index and current architecture corrections](https://docs.expo.dev/llms.txt)
- [Next.js installation and system requirements](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Dexie React guide](https://dexie.org/docs/Tutorial/React)
- [Zustand repository/documentation](https://github.com/pmndrs/zustand)

---

**Stop point:** Audit complete. No migration has been started.
