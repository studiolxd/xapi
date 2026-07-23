🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · Deutsch · [Polski](README.pl.md)

# @studiolxd/xapi

Ein headless TypeScript-Client für das xAPI-Protokoll (Experience API / Tin Can). Ein **frameworkunabhängiger Kern** spricht mit jedem standardkonformen LRS (Learning Record Store) — Ihrem eigenen oder einem kommerziellen wie Veracity, SCORM Cloud, Learning Locker oder Watershed — über xAPI 1.0.3 oder xAPI 2.0 (IEEE 9274.1.1), mit schlanken Adaptern für **React, Vue, Angular, Svelte** und reines Vanilla-JavaScript / `<script>`.

**Wichtigste Merkmale:**
- Vollständige Unterstützung von xAPI 1.0.3 und 2.0 über eine einzige `version`-Option
- Frameworkunabhängiger Kern + React-/Vue-/Angular-/Svelte-Adapter
- Headless (ohne UI) — Sie bauen die Oberfläche
- Strikte TypeScript-Typen für das gesamte xAPI-Datenmodell (`Statement`, `Actor`, `Verb`, `Activity`, `Context`, …)
- Fehlerbehandlung nach dem `Result`-Muster (keine impliziten Exceptions)
- In-Memory-Mock-LRS für lokale Entwicklung und Tests (kein echtes LRS nötig)
- `./server`-Subpath mit Protokoll-Helpern für Teams, die ihr eigenes LRS implementieren
- Launch-Helper für TinCan/Rustici-artiges Deep-Linking von Inhalten

## Installation

```bash
npm install @studiolxd/xapi
```

Framework-Pakete (React, Vue usw.) sind **optionale** Peer-Dependencies — installieren Sie nur das, welches Sie nutzen.

## Einstiegspunkte

| Import | Für |
|--------|-----|
| `@studiolxd/xapi` | Frameworkunabhängiger Kern + Vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React 18+: `XapiProvider`, `useXapiClient`, `useXapiStatus` |
| `@studiolxd/xapi/vue` | Vue 3.3+: Composable `useXapiClient()` |
| `@studiolxd/xapi/angular` | Angular 17+: `provideXapi()` + Token `XAPI` |
| `@studiolxd/xapi/svelte` | Svelte 4+: `createXapiStore()` |
| `@studiolxd/xapi/server` | Protokoll-Helper zur Implementierung eines LRS (nur Web-APIs) |
| `window.Xapi` (CDN `<script>`) | Reines HTML, ohne Bundler |

## Schnellstart — Vanilla

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
  console.log('Statement gesendet', result.value);
} else {
  console.error(result.error.kind, result.error.message);
}
```

## Schnellstart — React

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
  const status = useXapiStatus(); // reaktiv: rendert bei jeder Anfrage neu

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
      <p>Laufende Anfragen: {status.pending}</p>
      <button onClick={handleComplete}>Als abgeschlossen markieren</button>
    </div>
  );
}
```

## Andere Frameworks

Alle Adapter kapseln denselben beobachtbaren Client (`createXapiClient`). Installieren Sie nur das Framework-Paket, das Sie verwenden, als Peer-Dependency.

**Vue 3**
```vue
<script setup lang="ts">
import { useXapiClient } from '@studiolxd/xapi/vue';
const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
// status ist ein reaktiver Ref → status.value.pending
</script>
```

**Angular 17+**
```ts
import { provideXapi, XAPI } from '@studiolxd/xapi/angular';
bootstrapApplication(App, { providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })] });
// in einer Komponente: const { client, status } = inject(XAPI);  // status() ist ein Signal
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
{#if $status.pending}wird gesendet…{/if}
```

**CDN `<script>` (ohne Bundler)** — stellt `window.Xapi` bereit:
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

| Option | Typ | Beschreibung |
|--------|------|-------------|
| `endpoint` | `string` | Basis-IRI des LRS. Erforderlich. |
| `auth` | `{username,password}` \| `{token}` \| `{header}` | Basic, Bearer oder ein roher `Authorization`-Header-Wert. |
| `version` | `'1.0.3' \| '2.0'` | Protokollversion. Standard `'1.0.3'` (breiteste Unterstützung durch kommerzielle LRS). |
| `defaults` | `{actor?, registration?, context?}` | Wird in `buildStatement()`/`sendStatement()` eingemischt, wenn das Feld fehlt. |
| `fetch` | `typeof fetch` | Injiziert eine eigene `fetch`-Implementierung — für Tests, das Mock-LRS oder Umgebungen ohne globales fetch. |
| `timeoutMs` | `number` | Anfrage-Timeout, durchgesetzt via `AbortController`. Standard `30000`. |
| `concurrency` | `'auto' \| 'off'` | Ob `set*`-Dokumentmethoden ETags automatisch verwalten. Standard `'auto'`. |
| `validate` | `boolean` | Ob Statements vor dem Senden validiert werden. Standard `true`. |
| `debug` | `boolean` | Aktiviert Konsolen-Logging. Standard `false`. |

## High-Level-API

Jede Netzwerkoperation liefert `Promise<Result<T, XapiError>>` — prüfen Sie `result.ok`, bevor Sie auf `.value` zugreifen.

### Statements

```ts
await client.sendStatement(statement);               // Result<string, XapiError> — die Statement-ID
await client.sendStatements([s1, s2]);                // Result<string[], XapiError>
await client.getStatement(id);                        // Result<Statement, XapiError>
await client.getVoidedStatement(id);                   // Result<Statement, XapiError>
await client.getStatements({ verb: '...', limit: 20 }); // Result<StatementsPage, XapiError>
await client.getMoreStatements(page.more);              // folgt StatementsPage.more
await client.voidStatement(targetId);                    // nutzt options.defaults.actor, falls kein actor übergeben wird
```

`client.buildStatement(input)` baut ein wohlgeformtes `Statement`: `verb`/`object` akzeptieren als Abkürzung eine reine IRI-Zeichenkette, `id`/`timestamp` werden bei Auslassung generiert, und `options.defaults.actor`/`registration`/`context` füllen fehlende Felder auf.

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

`getState`/`getActivityProfile`/`getAgentProfile` liefern bei einem 404 `ok(null)` — ein fehlendes Dokument ist kein Fehler.

### Activities & Agents

```ts
await client.getActivity(activityId); // Result<Activity, XapiError>
await client.getPerson(agent);        // Result<Person, XapiError> — GET /agents
```

### About

```ts
await client.about(); // Result<AboutResource, XapiError>
```

## Fehlerbehandlung

Jede fehlschlagbare Operation liefert `Result<T, XapiError>` statt eine Exception zu werfen:

```ts
const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Gesendet', result.value);
} else {
  console.error(result.error.kind, result.error.status, result.error.message);
}
```

`XapiError`-Felder: `kind` (`'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage'`), `operation`, `endpoint`, `status`, `responseBody`, `issues` (befüllt, wenn `kind === 'validation'`), `exception`.

Hilfsfunktionen: `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

## Launch

Parsen Sie eine TinCan/Rustici-artige Launch-URL (`?endpoint=...&auth=...&actor=...&registration=...`) und erstellen Sie daraus in einem Schritt einen einsatzbereiten Client:

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

const launch = parseXapiLaunch(); // standardmäßig window.location.href
if (launch.ok) console.log(launch.value.endpoint, launch.value.actor);

const clientResult = createXapiClientFromLaunch(); // Parsen + createXapiClient in einem Schritt
if (clientResult.ok) {
  const client = clientResult.value;
  await client.sendStatement(client.buildStatement({ verb: '...', object: '...' }));
}
```

Wenn Ihr Content mit bereits bekanntem Endpoint/Zugangsdaten ausgeliefert wird (CDN, Bundler), überspringen Sie Launch komplett und rufen Sie direkt `createXapiClient()` auf — Launch wird nur für vom LMS gesteuertes Deep-Linking benötigt.

## Mock-LRS / Testing

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({ actor, verb: '...', object: '...' }));
console.log(lrs.store.statements.size); // 1 — direkter Zugriff für Assertions
```

`createMemoryLrs()` implementiert ein konformes In-Memory-LRS: idempotente Statement-Schreibvorgänge (409 bei Konflikt mit gleicher ID), Voiding, Cursor-Paginierung (`more`) und ETag-fähige Dokumente. Verwenden Sie es in Tests und Demos — ohne echtes Netzwerk, ohne echtes LRS.

## Server-Helper (./server)

Für Teams, die ihr eigenes LRS implementieren. Beschränkt auf **ausschließlich Web-APIs** (`Request`, `Response`, `Headers`, `crypto.subtle`) — keine Node-spezifischen Imports — läuft daher gleichermaßen in Next.js Route Handlers, Cloudflare-/Deno-Workern und Node ≥18.

| Export | Zweck |
|--------|---------|
| `validateStatement` | Strukturelle Validierung (mit dem Client geteilt) |
| `statementsEquivalent(a, b)` | Idempotenzprüfung für Statement-Schreibvorgänge mit gleicher ID |
| `applyFormat(statement, 'exact' \| 'ids' \| 'canonical', lang?)` | Projektion für `GET /statements?format=` |
| `buildMultipartBody` / `parseMultipartBody` | `multipart/mixed`-Codec für Statement-Anhänge |
| `etagFor(content)` / `checkConditionalHeaders(req, etag)` | Semantik bedingter Anfragen für Dokumente |
| `negotiateVersion(req)` | Validiert `X-Experience-API-Version`, löst `1.0.3`/`2.0` auf |
| `isVoidingStatement` / `voidingTarget` | Erkennung von Voiding-Statements |
| `verifySignedStatement` | JWS-Verifikation signierter Statements (RS256/ES256, `crypto.subtle`) |

```ts
import { negotiateVersion, validateStatement, checkConditionalHeaders } from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) return new Response(null, { status: 400 });

  const statement = await req.json();
  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) return Response.json(validation.error, { status: 400 });

  // ... Statement persistieren
}
```

## xAPI 1.0.3 vs 2.0

Beide Protokollversionen werden über denselben Client unterstützt — wählen Sie eine mit der `version`-Option. Versionsspezifische Unterschiede (akzeptierte `X-Experience-API-Version`-Werte, `context.contextAgents`/`contextGroups`, Strenge der ETags bei Dokumenten) sind in einem einzigen internen Adapter gebündelt, damit der Rest der API einheitlich bleibt. Siehe [xAPI 1.0.3 vs 2.0](./docs/version-differences.md) für die vollständige Vergleichstabelle.

## TypeScript

Das gesamte xAPI-Datenmodell wird als Typen exportiert: `Statement`, `Actor`, `Agent`, `Group`, `Verb`, `Activity`, `ActivityDefinition`, `StatementRef`, `SubStatement`, `Context`, `XapiResult`, `Score`, `Attachment`, `LanguageMap`, `Extensions` und mehr:

```ts
import type { Statement, Actor, Verb } from '@studiolxd/xapi';

const actor: Actor = { mbox: 'mailto:learner@example.com' };
```

## KI-Coding-Agenten

Nutzen Sie Claude Code, Cursor oder einen anderen KI-Coding-Assistenten? Fügen Sie die **[xapi-skills](https://github.com/studiolxd/skills)** hinzu, damit der Agent weiß, wie diese Bibliothek zu verwenden ist:

```
# Claude Code
/plugin marketplace add studiolxd/skills
/plugin install xapi-skills@studiolxd

# Cursor: kopieren Sie xapi-skills/cursor/xapi.mdc in das .cursor/rules/-Verzeichnis Ihres Projekts
# Codex/ChatGPT: fügen Sie xapi-skills/agents/xapi.md an die AGENTS.md Ihres Projekts an
```

## Weiterführende Dokumentation

- [xAPI 1.0.3 vs 2.0](./docs/version-differences.md)
- [Mock-LRS-Leitfaden](./docs/mock-lrs.md)
- [Launch-Leitfaden](./docs/launch-guide.md)
- [Server-Helper-Leitfaden](./docs/server-helpers.md)
- [Dokument-Nebenläufigkeit (ETags)](./docs/concurrency.md)

## Lizenz

MIT
