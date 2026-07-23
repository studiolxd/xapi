🌐 [English](README.md) · [Español](README.es.md) · Français · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Monorepo pour `@studiolxd/xapi` — un client xAPI (Experience API / Tin Can) headless avec un **noyau agnostique de framework** et des adaptateurs pour **React, Vue, Angular, Svelte**, et le JavaScript vanilla, communiquant avec n'importe quel LRS conforme au standard via xAPI 1.0.3 ou 2.0 — plus une application de démonstration interactive.

## Paquets

| Paquet | Description | Docs |
|---------|-------------|------|
| [`@studiolxd/xapi`](./packages/xapi/) | Client xAPI 1.0.3 / 2.0 headless — noyau agnostique + adaptateurs de framework + helpers serveur | [README](./packages/xapi/README.md) |
| [`example`](./example/) | Application de démonstration interactive — présente chaque fonctionnalité de la bibliothèque face à un LRS simulé | [README](./example/README.md) |

## Démarrage

```bash
npm install          # installe tous les workspaces depuis la racine
npm run dev:lib      # compile la bibliothèque en mode watch
npm run dev:example  # démarre le serveur de développement de l'exemple (http://localhost:5173)
```

Scripts supplémentaires disponibles depuis la racine :

- `npm run build` — compile la bibliothèque
- `npm run test` — exécute la suite de tests de la bibliothèque

## Points d'entrée

La bibliothèque est un unique paquet avec des exports par sous-chemin — importez uniquement ce que vous utilisez :

| Import | Pour |
|--------|-----|
| `@studiolxd/xapi` | Noyau agnostique de framework + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React (`XapiProvider`, `useXapiClient`, `useXapiStatus`) |
| `@studiolxd/xapi/vue` | Vue 3.3+ (`useXapiClient`) |
| `@studiolxd/xapi/angular` | Angular 17+ (`provideXapi`, `XAPI`) |
| `@studiolxd/xapi/svelte` | Svelte 4+ (`createXapiStore`) |
| `@studiolxd/xapi/server` | Helpers de protocole pour implémenter un LRS |
| `window.Xapi` (CDN `<script>`) | HTML simple, sans bundler |

## Structure du projet

```
xapi/
├── package.json          # racine npm workspaces (privé)
├── AGENTS.md              # guide pour les agents IA travaillant dans ce dépôt
├── PLAN.md                 # spécification de conception / implémentation
├── packages/
│   └── xapi/              # @studiolxd/xapi — publié sur npm
│       └── README.md      # documentation complète de la bibliothèque
├── example/                # démo interactive (non publiée)
│   └── README.md           # documentation de la démo
└── tests/angular-smoke/    # fixture du smoke test AOT Angular
```

## Publication

Seul `packages/xapi` est publié sur npm. Le workspace `example` et la racine sont privés. Pour publier :

```bash
cd packages/xapi
npm publish
```

La publication est manuelle, conditionnée par `prepublishOnly` (typecheck + test + build) et l'authentification npm — il n'existe pas de workflow de release automatisé.

## Licence

MIT
