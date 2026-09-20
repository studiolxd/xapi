# AGENTS.md — working in this repository

Guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) operating in this
monorepo. For how to *use* the published library, see `packages/xapi/llms.txt`.

## What this is

`@studiolxd/xapi` — a framework-agnostic xAPI (Experience API / Tin Can) client,
supporting xAPI 1.0.3 and xAPI 2.0 (IEEE 9274.1.1), against any standard LRS.
pnpm workspaces monorepo:

- `packages/xapi/` — the published library (`@studiolxd/xapi`).
  - `src/` core is **framework-agnostic** (no framework imports outside `src/react`,
    `src/vue`, `src/angular`, `src/svelte`). `src/server/` is **server-agnostic**
    (Web APIs only — no Node-specific or DOM-specific APIs).
  - Entry points map to subpaths: `.` (core+vanilla), `./react`, `./vue`,
    `./angular`, `./svelte`, `./server`. Built with `tsup` (ESM + CJS + IIFE).
- `example/` — the single demo app (React + Vite), running against the in-memory
  mock LRS by default. Not published.
- `PLAN.md` — the design/implementation spec this repo follows.

## Commands (run from repo root)

- `pnpm run build` — build the library.
- `pnpm run test` — run the library test suite (vitest).
- `pnpm run dev:example` — run the demo at http://localhost:5173.
- Per-package: `pnpm --filter @studiolxd/xapi run typecheck`.

Always run `typecheck` + `test:run` + `build` in `packages/xapi` before committing.

Dependencies are managed with **pnpm**; publishing still goes out with `npm publish`
from `packages/xapi`. `tests/angular-smoke/` is deliberately outside the workspace
and installed with npm — it stands in for a real downstream consumer. Never run
`npm install` at the repo root.

## Conventions

- **TypeScript strict.** Every public symbol has JSDoc, ideally with an `@example`.
- **`Result<T, XapiError>`** is the universal return type for anything that can
  fail — never throw across the public API. Check `.ok` before `.value`.
- **Framework isolation.** Code in `src/` outside `src/{react,vue,angular,svelte}/`
  must not import any UI framework. Adapters are thin bridges over
  `createXapiClient` — put shared logic in the core, not in an adapter.
- **Server isolation.** `src/server/` only uses Web APIs (`Request`, `Response`,
  `Headers`, `crypto.subtle`, `Uint8Array`) — no Node built-ins, no DOM.
- **SSR-safe.** Guard any `window`/`document` access with `typeof … === 'undefined'`.
- **Tests** live in `packages/xapi/tests/`, mirroring `src/`. Use the in-memory
  mock LRS (`createMemoryLrs`) — no real network, no real LRS needed.

## Adding a framework adapter

1. Create `src/<framework>/index.ts` — bridge `client.on('change')` to the
   framework's reactivity; re-export the core (`export * from '../index'`).
2. Add the entry to `tsup.config.ts` and an `exports` subpath in `package.json`.
3. Add the framework as an **optional** peerDependency (+ devDependency for builds).
4. Add a test under `tests/adapters/`.

## Release workflow

See `PLAN.md` §13: update CHANGELOG → `npm version` → commit → (publish is manual
and gated on npm auth, `npm publish` from `packages/xapi`).

## Do not

- Do not introduce a UI framework dependency into the core or into `src/server/`.
- Do not bundle framework deps (they are externalized/optional peers).
- Do not read `.value` without checking `.ok`.
- Do not add runtime `dependencies` to the package — keep it dependency-free
  (fetch, `crypto.randomUUID()`, hand-rolled multipart codec).
