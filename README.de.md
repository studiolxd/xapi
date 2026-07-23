🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · Deutsch · [Polski](README.pl.md)

# @studiolxd/xapi

Monorepo für `@studiolxd/xapi` — einen headless xAPI-Client (Experience API / Tin Can) mit einem **frameworkunabhängigen Kern** und Adaptern für **React, Vue, Angular, Svelte** sowie reines Vanilla-JavaScript, der mit jedem standardkonformen LRS über xAPI 1.0.3 oder 2.0 spricht — plus einer interaktiven Demo-App.

## Pakete

| Paket | Beschreibung | Docs |
|---------|-------------|------|
| [`@studiolxd/xapi`](./packages/xapi/) | Headless xAPI-1.0.3-/2.0-Client — agnostischer Kern + Framework-Adapter + Server-Helper | [README](./packages/xapi/README.md) |
| [`example`](./example/) | Interaktive Demo-App — zeigt jede Funktion der Bibliothek gegen ein simuliertes LRS | [README](./example/README.md) |

## Erste Schritte

```bash
npm install          # installiert alle Workspaces vom Root aus
npm run dev:lib      # baut die Bibliothek im Watch-Modus
npm run dev:example  # startet den Dev-Server des Beispiels (http://localhost:5173)
```

Weitere Skripte, die vom Root aus verfügbar sind:

- `npm run build` — baut die Bibliothek
- `npm run test` — führt die Test-Suite der Bibliothek aus

## Einstiegspunkte

Die Bibliothek ist ein einzelnes Paket mit Subpath-Exports — importieren Sie nur, was Sie nutzen:

| Import | Für |
|--------|-----|
| `@studiolxd/xapi` | Frameworkunabhängiger Kern + Vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React (`XapiProvider`, `useXapiClient`, `useXapiStatus`) |
| `@studiolxd/xapi/vue` | Vue 3.3+ (`useXapiClient`) |
| `@studiolxd/xapi/angular` | Angular 17+ (`provideXapi`, `XAPI`) |
| `@studiolxd/xapi/svelte` | Svelte 4+ (`createXapiStore`) |
| `@studiolxd/xapi/server` | Protokoll-Helper zur Implementierung eines LRS |
| `window.Xapi` (CDN `<script>`) | Reines HTML, ohne Bundler |

## Projektstruktur

```
xapi/
├── package.json          # npm-Workspaces-Root (privat)
├── AGENTS.md              # Leitfaden für KI-Coding-Agenten in diesem Repo
├── PLAN.md                 # Design-/Implementierungsspezifikation
├── packages/
│   └── xapi/              # @studiolxd/xapi — auf npm veröffentlicht
│       └── README.md      # vollständige Bibliotheksdokumentation
├── example/                # interaktive Demo (nicht veröffentlicht)
│   └── README.md           # Demo-Dokumentation
└── tests/angular-smoke/    # Angular-AOT-Smoke-Test-Fixture
```

## Veröffentlichung

Nur `packages/xapi` wird auf npm veröffentlicht. Der `example`-Workspace und das Root sind privat. Zum Veröffentlichen:

```bash
cd packages/xapi
npm publish
```

Die Veröffentlichung erfolgt manuell, abgesichert durch `prepublishOnly` (Typecheck + Test + Build) und npm-Authentifizierung — es gibt keinen automatisierten Release-Workflow.

## Lizenz

MIT
