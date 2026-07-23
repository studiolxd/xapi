🌐 [English](README.md) · [Español](README.es.md) · Français · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Un client TypeScript headless pour le protocole xAPI (Experience API / Tin Can). Un **noyau agnostique de framework** communique avec n'importe quel LRS (Learning Record Store) conforme au standard — le vôtre, ou un LRS commercial comme Veracity, SCORM Cloud, Learning Locker ou Watershed — via xAPI 1.0.3 ou xAPI 2.0 (IEEE 9274.1.1), avec des adaptateurs légers pour **React, Vue, Angular, Svelte**, et le JavaScript vanilla / `<script>`.

**Fonctionnalités clés :**
- Support complet de xAPI 1.0.3 et 2.0 via une seule option `version`
- Noyau agnostique de framework + adaptateurs React / Vue / Angular / Svelte
- Headless (sans UI) — vous construisez l'interface
- Types TypeScript stricts pour l'ensemble du modèle de données xAPI (`Statement`, `Actor`, `Verb`, `Activity`, `Context`, …)
- Gestion des erreurs basée sur `Result` (pas de levées d'exceptions implicites)
- LRS simulé en mémoire pour le développement local et les tests (aucun LRS réel requis)
- Sous-chemin `./server` avec des helpers de protocole pour les équipes qui implémentent leur propre LRS
- Helpers de lancement pour le deep-linking de contenus façon TinCan/Rustici

## Installation

```bash
npm install @studiolxd/xapi
```

Les paquets de framework (React, Vue, etc.) sont des peer dependencies **optionnelles** — installez uniquement celui que vous utilisez.

## Points d'entrée

| Import | Pour |
|--------|-----|
| `@studiolxd/xapi` | Noyau agnostique de framework + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React 18+ : `XapiProvider`, `useXapiClient`, `useXapiStatus` |
| `@studiolxd/xapi/vue` | Vue 3.3+ : composable `useXapiClient()` |
| `@studiolxd/xapi/angular` | Angular 17+ : `provideXapi()` + token `XAPI` |
| `@studiolxd/xapi/svelte` | Svelte 4+ : `createXapiStore()` |
| `@studiolxd/xapi/server` | Helpers de protocole pour implémenter un LRS (Web APIs uniquement) |
| `window.Xapi` (CDN `<script>`) | HTML simple, sans bundler |

## Démarrage rapide — vanilla

```ts
import { createXapiClient } from '@studiolxd/xapi';

const client = createXapiClient({
  endpoint: 'https://lrs.example.com/xapi',
  auth: { username: 'key', password: 'secret' },
  defaults: { actor: { mbox: 'mailto:learner@example.com' } },
});

const statement = client.buildStatement({
  verb: 'http://adlnet.gov/expapi/verbs/completed',
  object: 'https://example.com/course/1',
});

const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Statement envoyé', result.value);
} else {
  console.error(result.error.kind, result.error.message);
}
```

## Démarrage rapide — React

```tsx
import { XapiProvider, useXapiClient, useXapiStatus } from '@studiolxd/xapi/react';

function App() {
  return (
    <XapiProvider options={{ endpoint: 'https://lrs.example.com/xapi', auth: { username: 'key', password: 'secret' } }}>
      <CourseContent />
    </XapiProvider>
  );
}

function CourseContent() {
  const client = useXapiClient();
  const status = useXapiStatus(); // réactif : re-rendu à chaque requête

  const handleComplete = async () => {
    const statement = client.buildStatement({
      actor: { mbox: 'mailto:learner@example.com' },
      verb: 'http://adlnet.gov/expapi/verbs/completed',
      object: 'https://example.com/course/1',
    });
    const result = await client.sendStatement(statement);
    if (!result.ok) console.error(result.error);
  };

  return (
    <div>
      <p>Requêtes en cours : {status.pending}</p>
      <button onClick={handleComplete}>Marquer comme terminé</button>
    </div>
  );
}
```

## Autres frameworks

Tous les adaptateurs enveloppent le même client observable (`createXapiClient`). N'installez que le paquet de framework que vous utilisez, en tant que peer dependency.

**Vue 3**
```vue
<script setup lang="ts">
import { useXapiClient } from '@studiolxd/xapi/vue';
const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
// status est un ref réactif → status.value.pending
</script>
```

**Angular 17+**
```ts
import { provideXapi, XAPI } from '@studiolxd/xapi/angular';
bootstrapApplication(App, { providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })] });
// dans un composant : const { client, status } = inject(XAPI);  // status() est un signal
```

**Svelte 4+**
```svelte
<script>
  import { createXapiStore } from '@studiolxd/xapi/svelte';
  import { onDestroy } from 'svelte';
  const xapi = createXapiStore({ endpoint: 'https://lrs.example.com/xapi' });
  const { status } = xapi;
  onDestroy(xapi.destroy);
</script>
{#if $status.pending}envoi en cours…{/if}
```

**CDN `<script>` (sans bundler)** — expose `window.Xapi` :
```html
<script src="https://unpkg.com/@studiolxd/xapi/dist/xapi.global.js"></script>
<script>
  const client = Xapi.createXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
  client.sendStatement(client.buildStatement({
    actor: { mbox: 'mailto:learner@example.com' },
    verb: 'http://adlnet.gov/expapi/verbs/completed',
    object: 'https://example.com/course/1',
  }));
</script>
```

## createXapiClient(options)

| Option | Type | Description |
|--------|------|-------------|
| `endpoint` | `string` | IRI de base du LRS. Obligatoire. |
| `auth` | `{username,password}` \| `{token}` \| `{header}` | Basic, Bearer, ou une valeur brute d'en-tête `Authorization`. |
| `version` | `'1.0.3' \| '2.0'` | Version du protocole. Par défaut `'1.0.3'` (compatibilité maximale avec les LRS commerciaux). |
| `defaults` | `{actor?, registration?, context?}` | Fusionné dans `buildStatement()`/`sendStatement()` lorsque le champ est manquant. |
| `fetch` | `typeof fetch` | Injecte une implémentation `fetch` personnalisée — tests, LRS simulé, ou environnements sans fetch global. |
| `timeoutMs` | `number` | Timeout de la requête, via `AbortController`. Par défaut `30000`. |
| `concurrency` | `'auto' \| 'off'` | Si les méthodes `set*` de documents gèrent les ETags automatiquement. Par défaut `'auto'`. |
| `validate` | `boolean` | Si les statements sont validés avant l'envoi. Par défaut `true`. |
| `debug` | `boolean` | Active la journalisation console. Par défaut `false`. |

## API de haut niveau

Chaque opération réseau renvoie `Promise<Result<T, XapiError>>` — vérifiez `result.ok` avant d'accéder à `.value`.

### Statements

```ts
await client.sendStatement(statement);               // Result<string, XapiError> — l'id du statement
await client.sendStatements([s1, s2]);                // Result<string[], XapiError>
await client.getStatement(id);                        // Result<Statement, XapiError>
await client.getVoidedStatement(id);                   // Result<Statement, XapiError>
await client.getStatements({ verb: '...', limit: 20 }); // Result<StatementsPage, XapiError>
await client.getMoreStatements(page.more);              // suit StatementsPage.more
await client.voidStatement(targetId);                    // utilise options.defaults.actor si aucun actor n'est fourni
```

`client.buildStatement(input)` construit un `Statement` bien formé : `verb`/`object` acceptent une IRI en texte comme raccourci, `id`/`timestamp` sont générés si omis, et `options.defaults.actor`/`registration`/`context` complètent ce qui manque.

### State Documents

```ts
await client.getState(activityId, stateId);              // Result<XapiDocument | null, XapiError>
await client.setState(activityId, stateId, { progress: 3 });
await client.deleteState(activityId, stateId);
await client.getStateIds(activityId);                     // Result<string[], XapiError>
```

### Activity Profile

```ts
await client.getActivityProfile(activityId, profileId);
await client.setActivityProfile(activityId, profileId, value);
await client.deleteActivityProfile(activityId, profileId);
await client.getActivityProfileIds(activityId);
```

### Agent Profile

```ts
await client.getAgentProfile(agent, profileId);
await client.setAgentProfile(agent, profileId, value);
await client.deleteAgentProfile(agent, profileId);
await client.getAgentProfileIds(agent);
```

`getState`/`getActivityProfile`/`getAgentProfile` renvoient `ok(null)` en cas de 404 — un document manquant n'est pas une erreur.

### Activities & Agents

```ts
await client.getActivity(activityId); // Result<Activity, XapiError>
await client.getPerson(agent);        // Result<Person, XapiError> — GET /agents
```

### About

```ts
await client.about(); // Result<AboutResource, XapiError>
```

## Gestion des erreurs

Chaque opération faillible renvoie `Result<T, XapiError>` plutôt que de lever une exception :

```ts
const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Envoyé', result.value);
} else {
  console.error(result.error.kind, result.error.status, result.error.message);
}
```

Champs de `XapiError` : `kind` (`'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage'`), `operation`, `endpoint`, `status`, `responseBody`, `issues` (renseigné quand `kind === 'validation'`), `exception`.

Fonctions utilitaires : `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

## Launch

Analysez une URL de lancement façon TinCan/Rustici (`?endpoint=...&auth=...&actor=...&registration=...`) et construisez un client prêt à l'emploi à partir de celle-ci :

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

const launch = parseXapiLaunch(); // par défaut, utilise window.location.href
if (launch.ok) console.log(launch.value.endpoint, launch.value.actor);

const clientResult = createXapiClientFromLaunch(); // parse + createXapiClient en une étape
if (clientResult.ok) {
  const client = clientResult.value;
  await client.sendStatement(client.buildStatement({ verb: '...', object: '...' }));
}
```

Si votre contenu est installé avec un endpoint/des identifiants connus à l'avance (CDN, bundler), passez outre le launch et appelez directement `createXapiClient()` — le launch n'est nécessaire que pour le deep-linking piloté par le LMS.

## Mock LRS / Tests

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({ actor, verb: '...', object: '...' }));
console.log(lrs.store.statements.size); // 1 — accès direct pour les assertions
```

`createMemoryLrs()` implémente un LRS conforme en mémoire : écritures de statements idempotentes (409 en cas de conflit sur un même id), voiding, pagination par curseur (`more`), et documents gérant les ETags. Utilisez-le dans vos tests et démos — sans réseau réel, sans LRS réel.

## Server helpers (./server)

Pour les équipes qui implémentent leur propre LRS. Limité aux **Web APIs uniquement** (`Request`, `Response`, `Headers`, `crypto.subtle`) — aucun import spécifique à Node — fonctionne donc dans les Route Handlers Next.js, les workers Cloudflare/Deno, et Node ≥18.

| Export | Rôle |
|--------|---------|
| `validateStatement` | Validation structurelle (partagée avec le client) |
| `statementsEquivalent(a, b)` | Vérification d'idempotence pour les écritures de statements avec le même id |
| `applyFormat(statement, 'exact' \| 'ids' \| 'canonical', lang?)` | Projection pour `GET /statements?format=` |
| `buildMultipartBody` / `parseMultipartBody` | Codec `multipart/mixed` pour les pièces jointes des statements |
| `etagFor(content)` / `checkConditionalHeaders(req, etag)` | Sémantique des requêtes conditionnelles pour les documents |
| `negotiateVersion(req)` | Valide `X-Experience-API-Version`, résout `1.0.3`/`2.0` |
| `isVoidingStatement` / `voidingTarget` | Détection des statements de voiding |
| `verifySignedStatement` | Vérification JWS des statements signés (RS256/ES256, `crypto.subtle`) |

```ts
import { negotiateVersion, validateStatement, checkConditionalHeaders } from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) return new Response(null, { status: 400 });

  const statement = await req.json();
  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) return Response.json(validation.error, { status: 400 });

  // ... persister le statement
}
```

## xAPI 1.0.3 vs 2.0

Les deux versions du protocole sont supportées via le même client — choisissez-en une avec l'option `version`. Les différences spécifiques à chaque version (valeurs acceptées pour `X-Experience-API-Version`, `context.contextAgents`/`contextGroups`, rigueur des ETags sur les documents) sont concentrées dans un seul adaptateur interne pour que le reste de l'API reste uniforme. Voir [xAPI 1.0.3 vs 2.0](./docs/version-differences.md) pour le tableau comparatif complet.

## TypeScript

L'ensemble du modèle de données xAPI est exporté sous forme de types : `Statement`, `Actor`, `Agent`, `Group`, `Verb`, `Activity`, `ActivityDefinition`, `StatementRef`, `SubStatement`, `Context`, `XapiResult`, `Score`, `Attachment`, `LanguageMap`, `Extensions`, et plus encore :

```ts
import type { Statement, Actor, Verb } from '@studiolxd/xapi';

const actor: Actor = { mbox: 'mailto:learner@example.com' };
```

## Agents de codage IA

Vous utilisez Claude Code, Cursor, ou un autre assistant de codage IA ? Ajoutez la skill **[xapi-skills](https://github.com/studiolxd/skills)** pour que l'agent sache utiliser cette bibliothèque :

```
# Claude Code
/plugin marketplace add studiolxd/skills
/plugin install xapi-skills@studiolxd

# Cursor : copiez xapi-skills/cursor/xapi.mdc dans le .cursor/rules/ de votre projet
# Codex/ChatGPT : ajoutez xapi-skills/agents/xapi.md à l'AGENTS.md de votre projet
```

## Documentation complémentaire

- [xAPI 1.0.3 vs 2.0](./docs/version-differences.md)
- [Guide du LRS simulé](./docs/mock-lrs.md)
- [Guide de Launch](./docs/launch-guide.md)
- [Guide des Server Helpers](./docs/server-helpers.md)
- [Concurrence des documents (ETags)](./docs/concurrency.md)

## Licence

MIT
