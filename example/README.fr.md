🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/xapi` — Démo interactive

Une application de démonstration interactive et pleinement fonctionnelle qui illustre toutes
les fonctionnalités de la librairie
[`@studiolxd/xapi`](https://www.npmjs.com/package/@studiolxd/xapi) — le noyau agnostique de
framework, l'adaptateur `./react`, ainsi que les chemins de lancement (launch), vanilla et CDN.

Construite avec **React 19 + TypeScript + Vite** (via l'adaptateur `@studiolxd/xapi/react`).
Elle s'exécute entièrement dans le navigateur, par défaut contre `createMemoryLrs()` — une
implémentation xAPI en mémoire — donc **aucun LRS réel n'est requis** pour l'essayer. Un
onglet **Connection** permet aussi de connecter la démo à un LRS réel (votre propre
[`studiolxd/lrs`](https://github.com/studiolxd/lrs), Veracity, SCORM Cloud, Learning Locker…)
via Basic auth.

---

## Démarrage

Depuis la **racine du dépôt** (la démo est un workspace npm) :

```bash
npm install
npm run dev:example
```

Ouvrez `http://localhost:5173` dans votre navigateur.

---

## Ce que montre cette démo

L'en-tête comporte un **sélecteur de version xAPI** (1.0.3 / 2.0) et un **badge mock / LRS
réel**. Changer l'un ou l'autre remonte `XapiProvider` avec un nouveau client — la librairie
n'a pas de méthode de « reconfiguration », remonter est donc la bonne façon de cibler un autre
LRS ou une autre version.

### 10 sections de démonstration

| Onglet | Fonctionnalités démontrées |
|-----|-----------------------|
| **Connection** | `XapiStatus` en direct, bascule entre le LRS mock et un LRS réel, `client.about()` |
| **Statement Builder** | `client.buildStatement()`, `VERBS`, `client.sendStatement()` — construire un statement à partir d'un acteur/verbe/objet/résultat et l'envoyer |
| **Query** | `client.getStatements(query)` avec filtres, pagination via `client.getMoreStatements()` |
| **Voiding** | `client.voidStatement()`, `client.getVoidedStatement()` — les statements sont immuables, l'annulation permet de les rétracter |
| **State** | `getState` / `setState` / `deleteState` / `getStateIds` — stockage par acteur et par activité |
| **Activity Profile** | `getActivityProfile` / `setActivityProfile` / `deleteActivityProfile` / `getActivityProfileIds` — stockage partagé par activité |
| **Agent Profile** | `getAgentProfile` / `setAgentProfile` / `deleteAgentProfile` / `getAgentProfileIds` — stockage partagé par agent |
| **Launch** | `parseXapiLaunch()` — analyse d'une URL de lancement de type TinCan/Rustici |
| **Vanilla / CDN** | `createXapiClient()` en dehors de React, plus l'extrait IIFE/CDN `window.Xapi` |
| **About & Versions** | Aide-mémoire 1.0.3 vs 2.0, `client.about()` en direct |

---

## À propos du LRS mock

L'application utilise `createMemoryLrs()` de `@studiolxd/xapi` — une implémentation en mémoire
du protocole xAPI (la même que celle utilisée par la suite de tests de la librairie). Il est
créé une seule fois au niveau du module, donc vos données de démo survivent aux changements de
version.

```tsx
// App.tsx
const memoryLrs = createMemoryLrs();

<XapiProvider
  key={`${version}-${connection.mode}-${connection.endpoint}`}
  options={{ endpoint: 'https://mock.lrs/xapi', version, fetch: memoryLrs.fetch }}
>
  {/* tous les composants qui appellent useXapiClient() vont ici */}
</XapiProvider>
```

Utilisez l'onglet **Connection** pour passer à un LRS réel : saisissez son endpoint et ses
identifiants Basic auth, puis cliquez sur **Connect**.

---

## Aperçu de la librairie

`@studiolxd/xapi` est un client xAPI (Experience API / Tin Can) agnostique de framework : un
noyau avec des adaptateurs pour React, Vue, Angular et Svelte, plus un sous-chemin `./server`
avec des utilitaires de protocole pour implémenter un LRS. Cette démo utilise l'adaptateur
React.

### Concepts clés

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
  const client = useXapiClient();   // XapiClient stable
  const status = useXapiStatus();   // XapiStatus réactif (se re-rend à chaque requête)
}
```

**2. Gestion des erreurs basée sur Result**

Chaque méthode réseau renvoie `Promise<Result<T, XapiError>>` — aucune exception levée :

```tsx
const result = await client.sendStatement(statement);

if (result.ok) {
  console.log('enregistré avec l\'id', result.value);
} else {
  console.error(`${result.error.kind}: ${result.error.message}`);
}
```

**3. Les statements se construisent, ils ne s'écrivent pas à la main**

```tsx
const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,                     // ou une IRI sous forme de chaîne
  object: 'https://example.com/course/1',    // raccourci pour une Activity
  result: { success: true, score: { raw: 90, min: 0, max: 100 } },
});
```

`id` et `timestamp` sont générés automatiquement s'ils sont omis.

**4. Support double des versions**

Le même client parle xAPI 1.0.3 et 2.0 — choisissez avec `createXapiClient({ version })`.
Consultez l'onglet **About & Versions** et
[`packages/xapi/docs/version-differences.md`](../packages/xapi/docs/version-differences.md)
pour voir exactement ce qui est abstrait.

---

## Structure du projet

```
src/
├── main.tsx                       # Point d'entrée Vite
├── App.tsx                        # Sélecteur de version/connexion + XapiProvider + navigation par onglets
├── connection.ts                  # Type ConnectionConfig + valeurs par défaut
├── XapiConnectionContext.tsx      # Partage l'état de connexion mock/réel entre les sections
├── ResultView.tsx                 # Affiche un Result<T, XapiError> en ok/error + JSON
├── App.css / index.css            # Système de design (réutilisé de la démo de @studiolxd/scorm)
└── sections/
    ├── ConnectionSection.tsx      # Statut en direct, bascule mock/réel, about()
    ├── StatementBuilderSection.tsx
    ├── QuerySection.tsx
    ├── VoidingSection.tsx
    ├── StateSection.tsx
    ├── ActivityProfileSection.tsx
    ├── AgentProfileSection.tsx
    ├── LaunchSection.tsx
    ├── PlatformsSection.tsx       # createXapiClient() + extrait CDN de window.Xapi
    └── AboutSection.tsx
```

---

## Stack de développement

- **Build** : [Vite](https://vite.dev) 8 + `@vitejs/plugin-react`. Le build de production est
  `tsc -b && vite build` — vérification des types puis empaquetage.
- **Langage** : TypeScript 5.9, mode strict (`tsconfig.app.json`).
- **Linting** : ESLint 9 en configuration flat (`typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`). Exécuter avec `npm run lint`.

### Scripts

| Script | Commande | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Démarre le serveur de dev sur `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Vérification des types + build de production |
| `npm run lint` | `eslint .` | Lint tous les fichiers `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Prévisualise le build de production localement |

Depuis la racine du dépôt : `npm run dev:example` exécute `npm run dev --workspace=example`.

---

## Licence

MIT — voir [LICENSE](./LICENSE).
