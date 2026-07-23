🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

A headless TypeScript client for the xAPI (Experience API / Tin Can) protocol. A **framework-agnostic core** talks to any standards-compliant LRS (Learning Record Store) — your own, or a commercial one like Veracity, SCORM Cloud, Learning Locker or Watershed — over xAPI 1.0.3 or xAPI 2.0 (IEEE 9274.1.1), with thin adapters for **React, Vue, Angular, Svelte**, and plain vanilla JS / `<script>`.

**Key features:**
- Full xAPI 1.0.3 and 2.0 support behind a single `version` option
- Framework-agnostic core + React / Vue / Angular / Svelte adapters
- Headless (no UI) — you build the interface
- Strict TypeScript types for the whole xAPI data model (`Statement`, `Actor`, `Verb`, `Activity`, `Context`, …)
- Result-based error handling (no implicit throws)
- In-memory mock LRS for local development and tests (no real LRS required)
- `./server` subpath with protocol helpers for teams implementing their own LRS
- Launch helpers for TinCan/Rustici-style content deep-linking

## Installation

```bash
npm install @studiolxd/xapi
```

Framework packages (React, Vue, etc.) are **optional** peer dependencies — install only the one you use.

## Entry points

| Import | For |
|--------|-----|
| `@studiolxd/xapi` | Framework-agnostic core + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React 18+: `XapiProvider`, `useXapiClient`, `useXapiStatus` |
| `@studiolxd/xapi/vue` | Vue 3.3+: `useXapiClient()` composable |
| `@studiolxd/xapi/angular` | Angular 17+: `provideXapi()` + `XAPI` token |
| `@studiolxd/xapi/svelte` | Svelte 4+: `createXapiStore()` |
| `@studiolxd/xapi/server` | Protocol helpers for implementing an LRS (Web APIs only) |
| `window.Xapi` (CDN `<script>`) | Plain HTML, no bundler |

## Quick Start — vanilla

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
  console.log('Sent statement', result.value);
} else {
  console.error(result.error.kind, result.error.message);
}
```

## Quick Start — React

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
  const status = useXapiStatus(); // reactive: re-renders on every request

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
      <p>Requests in flight: {status.pending}</p>
      <button onClick={handleComplete}>Mark complete</button>
    </div>
  );
}
```

## Other frameworks

All adapters wrap the same observable client (`createXapiClient`). Install only the
framework package you use as a peer dependency.

**Vue 3**
```vue
<script setup lang="ts">
import { useXapiClient } from '@studiolxd/xapi/vue';
const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
// status is a reactive ref → status.value.pending
</script>
```

**Angular 17+**
```ts
import { provideXapi, XAPI } from '@studiolxd/xapi/angular';
bootstrapApplication(App, { providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })] });
// in a component: const { client, status } = inject(XAPI);  // status() is a signal
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
{#if $status.pending}sending…{/if}
```

**CDN `<script>` (no bundler)** — exposes `window.Xapi`:
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
| `endpoint` | `string` | Base IRI of the LRS. Required. |
| `auth` | `{username,password}` \| `{token}` \| `{header}` | Basic, Bearer, or a raw `Authorization` header value. |
| `version` | `'1.0.3' \| '2.0'` | Protocol version. Defaults to `'1.0.3'` (widest commercial LRS support). |
| `defaults` | `{actor?, registration?, context?}` | Merged into `buildStatement()`/`sendStatement()` when the field is missing. |
| `fetch` | `typeof fetch` | Inject a custom `fetch` — tests, the mock LRS, or non-global-fetch environments. |
| `timeoutMs` | `number` | Request timeout, enforced via `AbortController`. Defaults to `30000`. |
| `concurrency` | `'auto' \| 'off'` | Whether `set*` document methods manage ETags automatically. Defaults to `'auto'`. |
| `validate` | `boolean` | Whether statements are validated before being sent. Defaults to `true`. |
| `debug` | `boolean` | Enable console logging. Defaults to `false`. |

## High-Level API

Every network operation returns `Promise<Result<T, XapiError>>` — check `result.ok` before accessing `.value`.

### Statements

```ts
await client.sendStatement(statement);               // Result<string, XapiError> — the statement id
await client.sendStatements([s1, s2]);                // Result<string[], XapiError>
await client.getStatement(id);                        // Result<Statement, XapiError>
await client.getVoidedStatement(id);                   // Result<Statement, XapiError>
await client.getStatements({ verb: '...', limit: 20 }); // Result<StatementsPage, XapiError>
await client.getMoreStatements(page.more);              // follow StatementsPage.more
await client.voidStatement(targetId);                    // uses options.defaults.actor if no actor given
```

`client.buildStatement(input)` builds a well-formed `Statement`: `verb`/`object` accept a
plain IRI string as shorthand, `id`/`timestamp` are generated if omitted, and
`options.defaults.actor`/`registration`/`context` fill in anything missing.

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

`getState`/`getActivityProfile`/`getAgentProfile` resolve to `ok(null)` on a 404 — a missing
document is not an error.

### Activities & Agents

```ts
await client.getActivity(activityId); // Result<Activity, XapiError>
await client.getPerson(agent);        // Result<Person, XapiError> — GET /agents
```

### About

```ts
await client.about(); // Result<AboutResource, XapiError>
```

## Error Handling

Every fallible operation returns `Result<T, XapiError>` instead of throwing:

```ts
const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Sent', result.value);
} else {
  console.error(result.error.kind, result.error.status, result.error.message);
}
```

`XapiError` fields: `kind` (`'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage'`),
`operation`, `endpoint`, `status`, `responseBody`, `issues` (populated when `kind === 'validation'`),
`exception`.

Helper functions: `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

## Launch

Parse a TinCan/Rustici-style launch URL (`?endpoint=...&auth=...&actor=...&registration=...`)
and build a ready-to-use client from it:

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

const launch = parseXapiLaunch(); // defaults to window.location.href
if (launch.ok) console.log(launch.value.endpoint, launch.value.actor);

const clientResult = createXapiClientFromLaunch(); // parse + createXapiClient in one step
if (clientResult.ok) {
  const client = clientResult.value;
  await client.sendStatement(client.buildStatement({ verb: '...', object: '...' }));
}
```

If your content is installed with a known endpoint/credentials up front (CDN, bundler),
skip launch entirely and call `createXapiClient()` directly — launch is only needed for
LMS-driven deep-linking.

## Mock LRS / Testing

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({ actor, verb: '...', object: '...' }));
console.log(lrs.store.statements.size); // 1 — direct access for assertions
```

`createMemoryLrs()` implements a conformant in-memory LRS: idempotent statement writes
(409 on a same-id conflict), voiding, `more`-cursor pagination, and ETag-aware documents.
Use it in tests and demos — no real network, no real LRS required.

## Server helpers (./server)

For teams implementing their own LRS. Restricted to **Web APIs only** (`Request`,
`Response`, `Headers`, `crypto.subtle`) — no Node-specific imports — so it runs in
Next.js Route Handlers, Cloudflare/Deno workers, and Node ≥18 alike.

| Export | Purpose |
|--------|---------|
| `validateStatement` | Structural validation (shared with the client) |
| `statementsEquivalent(a, b)` | Idempotency check for same-id statement writes |
| `applyFormat(statement, 'exact' \| 'ids' \| 'canonical', lang?)` | `GET /statements?format=` projection |
| `buildMultipartBody` / `parseMultipartBody` | `multipart/mixed` codec for statement attachments |
| `etagFor(content)` / `checkConditionalHeaders(req, etag)` | Document conditional-request semantics |
| `negotiateVersion(req)` | Validates `X-Experience-API-Version`, resolves `1.0.3`/`2.0` |
| `isVoidingStatement` / `voidingTarget` | Voiding-statement detection |
| `verifySignedStatement` | JWS verification for signed statements (RS256/ES256, `crypto.subtle`) |

```ts
import { negotiateVersion, validateStatement, checkConditionalHeaders } from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) return new Response(null, { status: 400 });

  const statement = await req.json();
  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) return Response.json(validation.error, { status: 400 });

  // ... persist the statement
}
```

## xAPI 1.0.3 vs 2.0

Both protocol versions are supported through the same client — pick one with the
`version` option. Version-specific differences (accepted `X-Experience-API-Version`
values, `context.contextAgents`/`contextGroups`, document ETag strictness) are
concentrated in a single internal adapter so the rest of the API stays uniform.
See [xAPI 1.0.3 vs 2.0](./docs/version-differences.md) for the full comparison table.

## TypeScript

The full xAPI data model is exported as types: `Statement`, `Actor`, `Agent`, `Group`,
`Verb`, `Activity`, `ActivityDefinition`, `StatementRef`, `SubStatement`, `Context`,
`XapiResult`, `Score`, `Attachment`, `LanguageMap`, `Extensions`, and more:

```ts
import type { Statement, Actor, Verb } from '@studiolxd/xapi';

const actor: Actor = { mbox: 'mailto:learner@example.com' };
```

## AI coding agents

Using Claude Code, Cursor, or another AI coding assistant? Add the **[xapi-skills](https://github.com/studiolxd/skills)** so the agent knows how to use this library:

```
# Claude Code
/plugin marketplace add studiolxd/skills
/plugin install xapi-skills@studiolxd

# Cursor: copy xapi-skills/cursor/xapi.mdc into your project's .cursor/rules/
# Codex/ChatGPT: append xapi-skills/agents/xapi.md to your project's AGENTS.md
```

## Additional Documentation

- [xAPI 1.0.3 vs 2.0](./docs/version-differences.md)
- [Mock LRS Guide](./docs/mock-lrs.md)
- [Launch Guide](./docs/launch-guide.md)
- [Server Helpers Guide](./docs/server-helpers.md)
- [Document Concurrency (ETags)](./docs/concurrency.md)

## License

MIT
