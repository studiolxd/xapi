🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · Polski

# @studiolxd/xapi

Monorepo dla `@studiolxd/xapi` — bezinterfejsowego (headless) klienta xAPI (Experience API / Tin Can) z **rdzeniem niezależnym od frameworka** i adapterami dla **React, Vue, Angular, Svelte** oraz czystego JavaScriptu, komunikującego się z dowolnym LRS zgodnym ze standardem poprzez xAPI 1.0.3 lub 2.0 — plus interaktywna aplikacja demonstracyjna.

## Pakiety

| Pakiet | Opis | Dokumentacja |
|---------|-------------|------|
| [`@studiolxd/xapi`](./packages/xapi/) | Bezinterfejsowy klient xAPI 1.0.3 / 2.0 — rdzeń niezależny od frameworka + adaptery + helpery serwerowe | [README](./packages/xapi/README.md) |
| [`example`](./example/) | Interaktywna aplikacja demonstracyjna — pokazuje każdą funkcję biblioteki wobec symulowanego LRS | [README](./example/README.md) |

## Pierwsze kroki

```bash
npm install          # instaluje wszystkie workspace'y z katalogu głównego
npm run dev:lib      # buduje bibliotekę w trybie watch
npm run dev:example  # uruchamia serwer deweloperski przykładu (http://localhost:5173)
```

Dodatkowe skrypty dostępne z katalogu głównego:

- `npm run build` — buduje bibliotekę
- `npm run test` — uruchamia zestaw testów biblioteki

## Punkty wejścia

Biblioteka to jeden pakiet z eksportami po podścieżkach — importuj tylko to, czego używasz:

| Import | Do |
|--------|-----|
| `@studiolxd/xapi` | Rdzeń niezależny od frameworka + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React (`XapiProvider`, `useXapiClient`, `useXapiStatus`) |
| `@studiolxd/xapi/vue` | Vue 3.3+ (`useXapiClient`) |
| `@studiolxd/xapi/angular` | Angular 17+ (`provideXapi`, `XAPI`) |
| `@studiolxd/xapi/svelte` | Svelte 4+ (`createXapiStore`) |
| `@studiolxd/xapi/server` | Helpery protokołu do implementacji LRS |
| `window.Xapi` (CDN `<script>`) | Zwykły HTML, bez bundlera |

## Struktura projektu

```
xapi/
├── package.json          # katalog główny npm workspaces (prywatny)
├── AGENTS.md              # przewodnik dla agentów AI pracujących w tym repozytorium
├── PLAN.md                 # specyfikacja projektowa / implementacyjna
├── packages/
│   └── xapi/              # @studiolxd/xapi — opublikowany na npm
│       └── README.md      # pełna dokumentacja biblioteki
├── example/                # interaktywne demo (nieopublikowane)
│   └── README.md           # dokumentacja demo
└── tests/angular-smoke/    # fixture smoke testu AOT Angular
```

## Publikacja

Tylko `packages/xapi` jest publikowany na npm. Workspace `example` oraz katalog główny są prywatne. Aby opublikować:

```bash
cd packages/xapi
npm publish
```

Publikacja jest ręczna, uwarunkowana przez `prepublishOnly` (typecheck + test + build) oraz uwierzytelnienie npm — nie ma zautomatyzowanego procesu release.

## Licencja

MIT
