🌐 [English](README.md) · Español · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Monorepo de `@studiolxd/xapi` — un cliente xAPI (Experience API / Tin Can) headless con un **núcleo agnóstico de framework** y adaptadores para **React, Vue, Angular, Svelte**, y JavaScript vanilla, que habla con cualquier LRS conforme al estándar sobre xAPI 1.0.3 o 2.0 — más una app de demo interactiva.

## Paquetes

| Paquete | Descripción | Docs |
|---------|-------------|------|
| [`@studiolxd/xapi`](./packages/xapi/) | Cliente xAPI 1.0.3 / 2.0 headless — núcleo agnóstico + adaptadores de framework + helpers de servidor | [README](./packages/xapi/README.md) |
| [`example`](./example/) | App de demo interactiva — muestra cada funcionalidad de la librería contra un LRS simulado | [README](./example/README.md) |

## Primeros pasos

```bash
npm install          # instala todos los workspaces desde la raíz
npm run dev:lib      # compila la librería en modo watch
npm run dev:example  # inicia el servidor de desarrollo del ejemplo (http://localhost:5173)
```

Scripts adicionales disponibles desde la raíz:

- `npm run build` — compila la librería
- `npm run test` — ejecuta la suite de tests de la librería

## Puntos de entrada

La librería es un único paquete con exports por subpath — importa solo lo que uses:

| Import | Para |
|--------|-----|
| `@studiolxd/xapi` | Núcleo agnóstico de framework + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React (`XapiProvider`, `useXapiClient`, `useXapiStatus`) |
| `@studiolxd/xapi/vue` | Vue 3.3+ (`useXapiClient`) |
| `@studiolxd/xapi/angular` | Angular 17+ (`provideXapi`, `XAPI`) |
| `@studiolxd/xapi/svelte` | Svelte 4+ (`createXapiStore`) |
| `@studiolxd/xapi/server` | Helpers de protocolo para implementar un LRS |
| `window.Xapi` (CDN `<script>`) | HTML plano, sin bundler |

## Estructura del proyecto

```
xapi/
├── package.json          # raíz de npm workspaces (privado)
├── AGENTS.md              # guía para agentes de IA que trabajan en este repo
├── PLAN.md                 # especificación de diseño / implementación
├── packages/
│   └── xapi/              # @studiolxd/xapi — publicado en npm
│       └── README.md      # documentación completa de la librería
├── example/                # demo interactiva (no publicada)
│   └── README.md           # documentación de la demo
└── tests/angular-smoke/    # fixture del smoke test AOT de Angular
```

## Publicación

Solo `packages/xapi` se publica en npm. El workspace `example` y la raíz son privados. Para publicar:

```bash
cd packages/xapi
npm publish
```

La publicación es manual, condicionada a `prepublishOnly` (typecheck + test + build) y a la autenticación de npm — no hay un flujo de release automatizado.

## Licencia

MIT
