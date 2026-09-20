🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Monorepo for `@studiolxd/xapi` — a headless xAPI (Experience API / Tin Can) client with a
**framework-agnostic core** and adapters for **React, Vue, Angular, Svelte**, and plain
vanilla JS, talking to any standards-compliant LRS over xAPI 1.0.3 or 2.0 — plus an
interactive demo app.

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [`@studiolxd/xapi`](./packages/xapi/) | Headless xAPI 1.0.3 / 2.0 client — agnostic core + framework adapters + server helpers | [README](./packages/xapi/README.md) |
| [`example`](./example/) | Interactive demo app — showcases every library feature against a mock LRS | [README](./example/README.md) |

## Getting Started

```bash
pnpm install         # install all workspaces from the root
pnpm run dev:lib     # build the library in watch mode
pnpm run dev:example # start the example dev server (http://localhost:5173)
```

Additional scripts available from the root:

- `pnpm run build` — builds the library
- `pnpm run test` — runs the library test suite

## Entry points

The library is a single package with subpath exports — import only what you use:

| Import | For |
|--------|-----|
| `@studiolxd/xapi` | Framework-agnostic core + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React (`XapiProvider`, `useXapiClient`, `useXapiStatus`) |
| `@studiolxd/xapi/vue` | Vue 3.3+ (`useXapiClient`) |
| `@studiolxd/xapi/angular` | Angular 17+ (`provideXapi`, `XAPI`) |
| `@studiolxd/xapi/svelte` | Svelte 4+ (`createXapiStore`) |
| `@studiolxd/xapi/server` | Protocol helpers for implementing an LRS |
| `window.Xapi` (CDN `<script>`) | Plain HTML, no bundler |

## Project Structure

```
xapi/
├── package.json          # pnpm workspaces root (private)
├── AGENTS.md              # guidance for AI coding agents working in this repo
├── PLAN.md                 # design / implementation spec
├── packages/
│   └── xapi/              # @studiolxd/xapi — published to npm
│       └── README.md      # full library documentation
├── example/                # interactive demo (not published)
│   └── README.md           # demo documentation
└── tests/angular-smoke/    # Angular AOT smoke test fixture
```

## Publishing

Only `packages/xapi` is published to npm. The `example` workspace and the root are
private. To publish:

```bash
cd packages/xapi
npm publish
```

Publishing is manual, gated on `prepublishOnly` (typecheck + test + build) and npm auth —
there is no automated release workflow.

## License

MIT
