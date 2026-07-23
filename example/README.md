🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/xapi` — Interactive Demo

An interactive, fully working example application that demonstrates every feature of the
[`@studiolxd/xapi`](https://www.npmjs.com/package/@studiolxd/xapi) library — the
framework-agnostic core, the `./react` adapter, and the launch/vanilla/CDN paths.

Built with **React 19 + TypeScript + Vite** (using the `@studiolxd/xapi/react` adapter). Runs
entirely in the browser by default against `createMemoryLrs()` — an in-memory xAPI
implementation — so **no real LRS is required** to try it. A **Connection** tab also lets you
point the demo at any real LRS (your own [`studiolxd/lrs`](https://github.com/studiolxd/lrs),
Veracity, SCORM Cloud, Learning Locker…) with Basic auth.

---

## Getting Started

From the **repository root** (the demo is an npm workspace):

```bash
npm install
npm run dev:example
```

Open `http://localhost:5173` in your browser.

---

## What This Demo Shows

The header has an **xAPI version switcher** (1.0.3 / 2.0) and a **mock / real LRS badge**.
Switching either remounts `XapiProvider` with a fresh client — the library has no
"reconfigure" method, so a fresh client is the correct way to point at a different LRS or
version.

### 10 Demo Sections

| Tab | Features demonstrated |
|-----|-----------------------|
| **Connection** | Live `XapiStatus`, switching between the mock LRS and a real one, `client.about()` |
| **Statement Builder** | `client.buildStatement()`, `VERBS`, `client.sendStatement()` — build a statement from actor/verb/object/result and send it |
| **Query** | `client.getStatements(query)` with filters, `client.getMoreStatements()` pagination |
| **Voiding** | `client.voidStatement()`, `client.getVoidedStatement()` — statements are immutable, voiding is how you retract one |
| **State** | `getState` / `setState` / `deleteState` / `getStateIds` — per-actor, per-activity storage |
| **Activity Profile** | `getActivityProfile` / `setActivityProfile` / `deleteActivityProfile` / `getActivityProfileIds` — shared per-activity storage |
| **Agent Profile** | `getAgentProfile` / `setAgentProfile` / `deleteAgentProfile` / `getAgentProfileIds` — shared per-agent storage |
| **Launch** | `parseXapiLaunch()` — parsing a TinCan/Rustici-style launch URL |
| **Vanilla / CDN** | `createXapiClient()` outside React, plus the `window.Xapi` IIFE/CDN snippet |
| **About & Versions** | 1.0.3 vs 2.0 cheat sheet, live `client.about()` |

---

## About the Mock LRS

The app uses `createMemoryLrs()` from `@studiolxd/xapi` — an in-memory implementation of the
xAPI protocol (the same one the library's own test suite runs against). It's created once at
module scope, so your demo data survives version toggles.

```tsx
// App.tsx
const memoryLrs = createMemoryLrs();

<XapiProvider
  key={`${version}-${connection.mode}-${connection.endpoint}`}
  options={{ endpoint: 'https://mock.lrs/xapi', version, fetch: memoryLrs.fetch }}
>
  {/* all components that call useXapiClient() go here */}
</XapiProvider>
```

Use the **Connection** tab to switch to a real LRS: enter its endpoint and Basic auth
credentials and click **Connect**.

---

## Library Overview

`@studiolxd/xapi` is a framework-agnostic xAPI (Experience API / Tin Can) client: a core with
adapters for React, Vue, Angular and Svelte, plus a `./server` subpath with protocol helpers
for implementing an LRS. This demo uses the React adapter.

### Core Concepts

**1. Provider + Hooks**

```tsx
import { XapiProvider, useXapiClient, useXapiStatus } from '@studiolxd/xapi/react';

function Root() {
  return (
    <XapiProvider options={{ endpoint: 'https://lrs.example.com/xapi', auth: { username, password } }}>
      <Lesson />
    </XapiProvider>
  );
}

function Lesson() {
  const client = useXapiClient();   // stable XapiClient
  const status = useXapiStatus();   // reactive XapiStatus (re-renders on every request)
}
```

**2. Result-Based Error Handling**

Every network method returns `Promise<Result<T, XapiError>>` — no thrown exceptions:

```tsx
const result = await client.sendStatement(statement);

if (result.ok) {
  console.log('stored with id', result.value);
} else {
  console.error(`${result.error.kind}: ${result.error.message}`);
}
```

**3. Statements are built, not hand-typed**

```tsx
const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,                     // or a plain IRI string
  object: 'https://example.com/course/1',    // shorthand for an Activity
  result: { success: true, score: { raw: 90, min: 0, max: 100 } },
});
```

`id` and `timestamp` are generated automatically if omitted.

**4. Dual version support**

The same client speaks both xAPI 1.0.3 and 2.0 — pick it with `createXapiClient({ version })`.
See the **About & Versions** tab and [`packages/xapi/docs/version-differences.md`](../packages/xapi/docs/version-differences.md)
for exactly what's abstracted.

### Key API Methods

```tsx
// Statements
client.sendStatement(statement)
client.sendStatements(statements)
client.getStatement(id)
client.getVoidedStatement(id)
client.getStatements(query)
client.getMoreStatements(more)
client.voidStatement(targetId, actor?)

// Documents (State / Activity Profile / Agent Profile)
client.getState(activityId, stateId, opts?)
client.setState(activityId, stateId, value, opts?)
client.deleteState(activityId, stateId, opts?)
client.getStateIds(activityId, opts?)
// … same 4-method shape for getActivityProfile* and getAgentProfile*

// Other resources
client.getActivity(activityId)
client.getPerson(agent)
client.about()

// Launch
parseXapiLaunch(url?)
createXapiClientFromLaunch(url?, extra?)
```

---

## Project Structure

```
src/
├── main.tsx                       # Vite entry point
├── App.tsx                        # Version/connection switcher + XapiProvider + tab navigation
├── connection.ts                  # ConnectionConfig type + defaults
├── XapiConnectionContext.tsx      # Shares mock/real connection state across sections
├── ResultView.tsx                 # Renders a Result<T, XapiError> as ok/error + JSON
├── App.css / index.css            # Design system (reused from @studiolxd/scorm's demo)
└── sections/
    ├── ConnectionSection.tsx      # Live status, mock/real switch, about()
    ├── StatementBuilderSection.tsx
    ├── QuerySection.tsx
    ├── VoidingSection.tsx
    ├── StateSection.tsx
    ├── ActivityProfileSection.tsx
    ├── AgentProfileSection.tsx
    ├── LaunchSection.tsx
    ├── PlatformsSection.tsx       # createXapiClient() + window.Xapi CDN snippet
    └── AboutSection.tsx
```

---

## Development Stack

- **Build**: [Vite](https://vite.dev) 8 + `@vitejs/plugin-react`. Production build is
  `tsc -b && vite build` — type-checking then bundling.
- **Language**: TypeScript 5.9, strict mode (`tsconfig.app.json`).
- **Linting**: ESLint 9 flat config (`typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`). Run with `npm run lint`.

### Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Start dev server at `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Type-check + production bundle |
| `npm run lint` | `eslint .` | Lint all `.ts` / `.tsx` files |
| `npm run preview` | `vite preview` | Preview the production build locally |

From the repository root: `npm run dev:example` runs `npm run dev --workspace=example`.

---

## License

MIT — see [LICENSE](./LICENSE).
