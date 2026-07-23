🌐 [English](README.md) · Español · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Un cliente TypeScript "headless" para el protocolo xAPI (Experience API / Tin Can). Un **núcleo agnóstico de framework** habla con cualquier LRS (Learning Record Store) conforme al estándar — el tuyo propio, o uno comercial como Veracity, SCORM Cloud, Learning Locker o Watershed — sobre xAPI 1.0.3 o xAPI 2.0 (IEEE 9274.1.1), con adaptadores finos para **React, Vue, Angular, Svelte**, y JavaScript vanilla / `<script>`.

**Características principales:**
- Soporte completo de xAPI 1.0.3 y 2.0 tras una única opción `version`
- Núcleo agnóstico de framework + adaptadores React / Vue / Angular / Svelte
- Headless (sin UI) — tú construyes la interfaz
- Tipos TypeScript estrictos para todo el modelo de datos xAPI (`Statement`, `Actor`, `Verb`, `Activity`, `Context`, …)
- Manejo de errores basado en `Result` (sin lanzamientos implícitos)
- LRS simulado en memoria para desarrollo local y tests (sin necesidad de un LRS real)
- Subpath `./server` con helpers de protocolo para equipos que implementan su propio LRS
- Helpers de lanzamiento (launch) para deep-linking de contenidos estilo TinCan/Rustici

## Instalación

```bash
npm install @studiolxd/xapi
```

Los paquetes de framework (React, Vue, etc.) son peer dependencies **opcionales** — instala solo el que uses.

## Puntos de entrada

| Import | Para |
|--------|-----|
| `@studiolxd/xapi` | Núcleo agnóstico de framework + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React 18+: `XapiProvider`, `useXapiClient`, `useXapiStatus` |
| `@studiolxd/xapi/vue` | Vue 3.3+: composable `useXapiClient()` |
| `@studiolxd/xapi/angular` | Angular 17+: `provideXapi()` + token `XAPI` |
| `@studiolxd/xapi/svelte` | Svelte 4+: `createXapiStore()` |
| `@studiolxd/xapi/server` | Helpers de protocolo para implementar un LRS (solo Web APIs) |
| `window.Xapi` (CDN `<script>`) | HTML plano, sin bundler |

## Inicio rápido — vanilla

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
  console.log('Statement enviado', result.value);
} else {
  console.error(result.error.kind, result.error.message);
}
```

## Inicio rápido — React

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
  const status = useXapiStatus(); // reactivo: re-renderiza en cada petición

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
      <p>Peticiones en vuelo: {status.pending}</p>
      <button onClick={handleComplete}>Marcar como completado</button>
    </div>
  );
}
```

## Otros frameworks

Todos los adaptadores envuelven el mismo cliente observable (`createXapiClient`). Instala solo el paquete de framework que uses como peer dependency.

**Vue 3**
```vue
<script setup lang="ts">
import { useXapiClient } from '@studiolxd/xapi/vue';
const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
// status es un ref reactivo → status.value.pending
</script>
```

**Angular 17+**
```ts
import { provideXapi, XAPI } from '@studiolxd/xapi/angular';
bootstrapApplication(App, { providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })] });
// en un componente: const { client, status } = inject(XAPI);  // status() es un signal
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
{#if $status.pending}enviando…{/if}
```

**CDN `<script>` (sin bundler)** — expone `window.Xapi`:
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

| Opción | Tipo | Descripción |
|--------|------|-------------|
| `endpoint` | `string` | IRI base del LRS. Obligatorio. |
| `auth` | `{username,password}` \| `{token}` \| `{header}` | Basic, Bearer, o un valor crudo de `Authorization`. |
| `version` | `'1.0.3' \| '2.0'` | Versión del protocolo. Por defecto `'1.0.3'` (mayor compatibilidad con LRS comerciales). |
| `defaults` | `{actor?, registration?, context?}` | Se mezcla en `buildStatement()`/`sendStatement()` cuando el campo falta. |
| `fetch` | `typeof fetch` | Inyecta un `fetch` propio — tests, el LRS simulado, o entornos sin fetch global. |
| `timeoutMs` | `number` | Timeout de la petición, vía `AbortController`. Por defecto `30000`. |
| `concurrency` | `'auto' \| 'off'` | Si los métodos `set*` de documentos gestionan ETags automáticamente. Por defecto `'auto'`. |
| `validate` | `boolean` | Si los statements se validan antes de enviarse. Por defecto `true`. |
| `debug` | `boolean` | Activa logging por consola. Por defecto `false`. |

## API de alto nivel

Toda operación de red devuelve `Promise<Result<T, XapiError>>` — comprueba `result.ok` antes de acceder a `.value`.

### Statements

```ts
await client.sendStatement(statement);               // Result<string, XapiError> — el id del statement
await client.sendStatements([s1, s2]);                // Result<string[], XapiError>
await client.getStatement(id);                        // Result<Statement, XapiError>
await client.getVoidedStatement(id);                   // Result<Statement, XapiError>
await client.getStatements({ verb: '...', limit: 20 }); // Result<StatementsPage, XapiError>
await client.getMoreStatements(page.more);              // sigue StatementsPage.more
await client.voidStatement(targetId);                    // usa options.defaults.actor si no se pasa actor
```

`client.buildStatement(input)` construye un `Statement` bien formado: `verb`/`object` aceptan una IRI en texto plano como atajo, `id`/`timestamp` se generan si se omiten, y `options.defaults.actor`/`registration`/`context` completan lo que falte.

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

`getState`/`getActivityProfile`/`getAgentProfile` devuelven `ok(null)` en un 404 — un documento inexistente no es un error.

### Activities & Agents

```ts
await client.getActivity(activityId); // Result<Activity, XapiError>
await client.getPerson(agent);        // Result<Person, XapiError> — GET /agents
```

### About

```ts
await client.about(); // Result<AboutResource, XapiError>
```

## Manejo de errores

Toda operación que pueda fallar devuelve `Result<T, XapiError>` en vez de lanzar una excepción:

```ts
const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Enviado', result.value);
} else {
  console.error(result.error.kind, result.error.status, result.error.message);
}
```

Campos de `XapiError`: `kind` (`'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage'`), `operation`, `endpoint`, `status`, `responseBody`, `issues` (poblado cuando `kind === 'validation'`), `exception`.

Funciones auxiliares: `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

## Launch

Parsea una URL de lanzamiento estilo TinCan/Rustici (`?endpoint=...&auth=...&actor=...&registration=...`) y construye un cliente listo para usar a partir de ella:

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

const launch = parseXapiLaunch(); // por defecto usa window.location.href
if (launch.ok) console.log(launch.value.endpoint, launch.value.actor);

const clientResult = createXapiClientFromLaunch(); // parsea + createXapiClient en un solo paso
if (clientResult.ok) {
  const client = clientResult.value;
  await client.sendStatement(client.buildStatement({ verb: '...', object: '...' }));
}
```

Si tu contenido se instala con un endpoint/credenciales conocidos de antemano (CDN, bundler), prescinde de launch por completo y llama a `createXapiClient()` directamente — launch solo hace falta para deep-linking gestionado por el LMS.

## Mock LRS / Testing

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({ actor, verb: '...', object: '...' }));
console.log(lrs.store.statements.size); // 1 — acceso directo para asserts
```

`createMemoryLrs()` implementa un LRS conforme en memoria: escrituras idempotentes de statements (409 en conflicto de mismo id), voiding, paginación por cursor (`more`), y documentos con soporte de ETag. Úsalo en tests y demos — sin red real, sin LRS real.

## Server helpers (./server)

Para equipos que implementan su propio LRS. Restringido a **solo Web APIs** (`Request`, `Response`, `Headers`, `crypto.subtle`) — sin imports específicos de Node — así funciona en Route Handlers de Next.js, workers de Cloudflare/Deno, y Node ≥18 por igual.

| Export | Propósito |
|--------|---------|
| `validateStatement` | Validación estructural (compartida con el cliente) |
| `statementsEquivalent(a, b)` | Comprobación de idempotencia para escrituras de statements con mismo id |
| `applyFormat(statement, 'exact' \| 'ids' \| 'canonical', lang?)` | Proyección de `GET /statements?format=` |
| `buildMultipartBody` / `parseMultipartBody` | Codec `multipart/mixed` para attachments de statements |
| `etagFor(content)` / `checkConditionalHeaders(req, etag)` | Semántica de peticiones condicionales de documentos |
| `negotiateVersion(req)` | Valida `X-Experience-API-Version`, resuelve `1.0.3`/`2.0` |
| `isVoidingStatement` / `voidingTarget` | Detección de statements de voiding |
| `verifySignedStatement` | Verificación JWS de statements firmados (RS256/ES256, `crypto.subtle`) |

```ts
import { negotiateVersion, validateStatement, checkConditionalHeaders } from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) return new Response(null, { status: 400 });

  const statement = await req.json();
  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) return Response.json(validation.error, { status: 400 });

  // ... persistir el statement
}
```

## xAPI 1.0.3 vs 2.0

Ambas versiones del protocolo se soportan a través del mismo cliente — elige una con la opción `version`. Las diferencias específicas de versión (valores aceptados de `X-Experience-API-Version`, `context.contextAgents`/`contextGroups`, estrictez de ETag en documentos) se concentran en un único adaptador interno para que el resto de la API se mantenga uniforme. Ver [xAPI 1.0.3 vs 2.0](./docs/version-differences.md) para la tabla comparativa completa.

## TypeScript

Todo el modelo de datos xAPI se exporta como tipos: `Statement`, `Actor`, `Agent`, `Group`, `Verb`, `Activity`, `ActivityDefinition`, `StatementRef`, `SubStatement`, `Context`, `XapiResult`, `Score`, `Attachment`, `LanguageMap`, `Extensions`, y más:

```ts
import type { Statement, Actor, Verb } from '@studiolxd/xapi';

const actor: Actor = { mbox: 'mailto:learner@example.com' };
```

## Agentes de IA para programar

¿Usas Claude Code, Cursor, u otro asistente de IA para programar? Añade la skill **[xapi-skills](https://github.com/studiolxd/skills)** para que el agente sepa usar esta librería:

```
# Claude Code
/plugin marketplace add studiolxd/skills
/plugin install xapi-skills@studiolxd

# Cursor: copia xapi-skills/cursor/xapi.mdc en el .cursor/rules/ de tu proyecto
# Codex/ChatGPT: añade xapi-skills/agents/xapi.md al AGENTS.md de tu proyecto
```

## Documentación adicional

- [xAPI 1.0.3 vs 2.0](./docs/version-differences.md)
- [Guía del LRS simulado](./docs/mock-lrs.md)
- [Guía de Launch](./docs/launch-guide.md)
- [Guía de Server Helpers](./docs/server-helpers.md)
- [Concurrencia de documentos (ETags)](./docs/concurrency.md)

## Licencia

MIT
