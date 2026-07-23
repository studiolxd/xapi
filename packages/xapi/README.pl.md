🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · Polski

# @studiolxd/xapi

Bezinterfejsowy (headless) klient TypeScript dla protokołu xAPI (Experience API / Tin Can). **Rdzeń niezależny od frameworka** komunikuje się z dowolnym LRS (Learning Record Store) zgodnym ze standardem — Twoim własnym lub komercyjnym, jak Veracity, SCORM Cloud, Learning Locker czy Watershed — poprzez xAPI 1.0.3 lub xAPI 2.0 (IEEE 9274.1.1), z lekkimi adapterami dla **React, Vue, Angular, Svelte** oraz czystego JavaScriptu (vanilla) / `<script>`.

**Kluczowe funkcje:**
- Pełne wsparcie xAPI 1.0.3 i 2.0 dzięki jednej opcji `version`
- Rdzeń niezależny od frameworka + adaptery React / Vue / Angular / Svelte
- Headless (bez UI) — interfejs budujesz sam
- Ścisłe typy TypeScript dla całego modelu danych xAPI (`Statement`, `Actor`, `Verb`, `Activity`, `Context`, …)
- Obsługa błędów oparta na `Result` (bez niejawnego rzucania wyjątków)
- Symulowany LRS w pamięci do lokalnego developmentu i testów (bez potrzeby prawdziwego LRS)
- Podścieżka `./server` z helperami protokołu dla zespołów implementujących własny LRS
- Helpery launch do deep-linkingu treści w stylu TinCan/Rustici

## Instalacja

```bash
npm install @studiolxd/xapi
```

Pakiety frameworków (React, Vue itd.) są **opcjonalnymi** peer dependencies — zainstaluj tylko ten, którego używasz.

## Punkty wejścia

| Import | Do |
|--------|-----|
| `@studiolxd/xapi` | Rdzeń niezależny od frameworka + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React 18+: `XapiProvider`, `useXapiClient`, `useXapiStatus` |
| `@studiolxd/xapi/vue` | Vue 3.3+: composable `useXapiClient()` |
| `@studiolxd/xapi/angular` | Angular 17+: `provideXapi()` + token `XAPI` |
| `@studiolxd/xapi/svelte` | Svelte 4+: `createXapiStore()` |
| `@studiolxd/xapi/server` | Helpery protokołu do implementacji LRS (tylko Web API) |
| `window.Xapi` (CDN `<script>`) | Zwykły HTML, bez bundlera |

## Szybki start — vanilla

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
  console.log('Statement wysłany', result.value);
} else {
  console.error(result.error.kind, result.error.message);
}
```

## Szybki start — React

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
  const status = useXapiStatus(); // reaktywny: re-renderuje przy każdym żądaniu

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
      <p>Żądania w toku: {status.pending}</p>
      <button onClick={handleComplete}>Oznacz jako ukończone</button>
    </div>
  );
}
```

## Inne frameworki

Wszystkie adaptery opakowują ten sam obserwowalny klient (`createXapiClient`). Zainstaluj tylko pakiet frameworka, którego używasz, jako peer dependency.

**Vue 3**
```vue
<script setup lang="ts">
import { useXapiClient } from '@studiolxd/xapi/vue';
const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
// status to reaktywny ref → status.value.pending
</script>
```

**Angular 17+**
```ts
import { provideXapi, XAPI } from '@studiolxd/xapi/angular';
bootstrapApplication(App, { providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })] });
// w komponencie: const { client, status } = inject(XAPI);  // status() to signal
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
{#if $status.pending}wysyłanie…{/if}
```

**CDN `<script>` (bez bundlera)** — udostępnia `window.Xapi`:
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

| Opcja | Typ | Opis |
|--------|------|-------------|
| `endpoint` | `string` | Bazowe IRI LRS. Wymagane. |
| `auth` | `{username,password}` \| `{token}` \| `{header}` | Basic, Bearer lub surowa wartość nagłówka `Authorization`. |
| `version` | `'1.0.3' \| '2.0'` | Wersja protokołu. Domyślnie `'1.0.3'` (najszersza kompatybilność z komercyjnymi LRS). |
| `defaults` | `{actor?, registration?, context?}` | Łączone w `buildStatement()`/`sendStatement()`, gdy brakuje danego pola. |
| `fetch` | `typeof fetch` | Wstrzykuje własną implementację `fetch` — testy, symulowany LRS lub środowiska bez globalnego fetch. |
| `timeoutMs` | `number` | Limit czasu żądania, egzekwowany przez `AbortController`. Domyślnie `30000`. |
| `concurrency` | `'auto' \| 'off'` | Czy metody `set*` dokumentów zarządzają ETagami automatycznie. Domyślnie `'auto'`. |
| `validate` | `boolean` | Czy statementy są walidowane przed wysłaniem. Domyślnie `true`. |
| `debug` | `boolean` | Włącza logowanie do konsoli. Domyślnie `false`. |

## API wysokiego poziomu

Każda operacja sieciowa zwraca `Promise<Result<T, XapiError>>` — sprawdź `result.ok` przed dostępem do `.value`.

### Statements

```ts
await client.sendStatement(statement);               // Result<string, XapiError> — id statementu
await client.sendStatements([s1, s2]);                // Result<string[], XapiError>
await client.getStatement(id);                        // Result<Statement, XapiError>
await client.getVoidedStatement(id);                   // Result<Statement, XapiError>
await client.getStatements({ verb: '...', limit: 20 }); // Result<StatementsPage, XapiError>
await client.getMoreStatements(page.more);              // podąża za StatementsPage.more
await client.voidStatement(targetId);                    // używa options.defaults.actor, gdy nie podano actor
```

`client.buildStatement(input)` buduje poprawnie sformułowany `Statement`: `verb`/`object` akceptują jako skrót zwykły ciąg IRI, `id`/`timestamp` są generowane, jeśli pominięte, a `options.defaults.actor`/`registration`/`context` uzupełniają brakujące pola.

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

`getState`/`getActivityProfile`/`getAgentProfile` zwracają `ok(null)` przy 404 — brakujący dokument nie jest błędem.

### Activities & Agents

```ts
await client.getActivity(activityId); // Result<Activity, XapiError>
await client.getPerson(agent);        // Result<Person, XapiError> — GET /agents
```

### About

```ts
await client.about(); // Result<AboutResource, XapiError>
```

## Obsługa błędów

Każda operacja mogąca się nie powieść zwraca `Result<T, XapiError>` zamiast rzucać wyjątek:

```ts
const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Wysłano', result.value);
} else {
  console.error(result.error.kind, result.error.status, result.error.message);
}
```

Pola `XapiError`: `kind` (`'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage'`), `operation`, `endpoint`, `status`, `responseBody`, `issues` (wypełniane, gdy `kind === 'validation'`), `exception`.

Funkcje pomocnicze: `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

## Launch

Sparsuj adres URL launch w stylu TinCan/Rustici (`?endpoint=...&auth=...&actor=...&registration=...`) i zbuduj z niego od razu gotowy do użycia klient:

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

const launch = parseXapiLaunch(); // domyślnie window.location.href
if (launch.ok) console.log(launch.value.endpoint, launch.value.actor);

const clientResult = createXapiClientFromLaunch(); // parsowanie + createXapiClient w jednym kroku
if (clientResult.ok) {
  const client = clientResult.value;
  await client.sendStatement(client.buildStatement({ verb: '...', object: '...' }));
}
```

Jeśli Twoja treść jest instalowana ze znanym z góry endpointem/danymi uwierzytelniającymi (CDN, bundler), pomiń launch całkowicie i wywołaj bezpośrednio `createXapiClient()` — launch jest potrzebny tylko dla deep-linkingu sterowanego przez LMS.

## Symulowany LRS / Testowanie

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({ actor, verb: '...', object: '...' }));
console.log(lrs.store.statements.size); // 1 — bezpośredni dostęp do asercji
```

`createMemoryLrs()` implementuje zgodny ze standardem LRS w pamięci: idempotentne zapisy statementów (409 przy konflikcie tego samego id), voiding, paginację kursorem (`more`) oraz dokumenty obsługujące ETagi. Używaj go w testach i demach — bez prawdziwej sieci, bez prawdziwego LRS.

## Helpery serwerowe (./server)

Dla zespołów implementujących własny LRS. Ograniczone wyłącznie do **Web API** (`Request`, `Response`, `Headers`, `crypto.subtle`) — bez importów specyficznych dla Node — działa więc zarówno w Route Handlerach Next.js, workerach Cloudflare/Deno, jak i w Node ≥18.

| Export | Cel |
|--------|---------|
| `validateStatement` | Walidacja strukturalna (współdzielona z klientem) |
| `statementsEquivalent(a, b)` | Sprawdzenie idempotencji dla zapisów statementów o tym samym id |
| `applyFormat(statement, 'exact' \| 'ids' \| 'canonical', lang?)` | Projekcja dla `GET /statements?format=` |
| `buildMultipartBody` / `parseMultipartBody` | Kodek `multipart/mixed` dla załączników statementów |
| `etagFor(content)` / `checkConditionalHeaders(req, etag)` | Semantyka żądań warunkowych dla dokumentów |
| `negotiateVersion(req)` | Waliduje `X-Experience-API-Version`, rozstrzyga `1.0.3`/`2.0` |
| `isVoidingStatement` / `voidingTarget` | Wykrywanie statementów typu voiding |
| `verifySignedStatement` | Weryfikacja JWS podpisanych statementów (RS256/ES256, `crypto.subtle`) |

```ts
import { negotiateVersion, validateStatement, checkConditionalHeaders } from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) return new Response(null, { status: 400 });

  const statement = await req.json();
  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) return Response.json(validation.error, { status: 400 });

  // ... zapisz statement
}
```

## xAPI 1.0.3 vs 2.0

Obie wersje protokołu są obsługiwane przez ten sam klient — wybierz jedną za pomocą opcji `version`. Różnice specyficzne dla wersji (akceptowane wartości `X-Experience-API-Version`, `context.contextAgents`/`contextGroups`, rygor ETagów w dokumentach) są skupione w jednym wewnętrznym adapterze, dzięki czemu reszta API pozostaje jednolita. Zobacz [xAPI 1.0.3 vs 2.0](./docs/version-differences.md) dla pełnej tabeli porównawczej.

## TypeScript

Cały model danych xAPI jest eksportowany jako typy: `Statement`, `Actor`, `Agent`, `Group`, `Verb`, `Activity`, `ActivityDefinition`, `StatementRef`, `SubStatement`, `Context`, `XapiResult`, `Score`, `Attachment`, `LanguageMap`, `Extensions` i więcej:

```ts
import type { Statement, Actor, Verb } from '@studiolxd/xapi';

const actor: Actor = { mbox: 'mailto:learner@example.com' };
```

## Agenci AI do programowania

Używasz Claude Code, Cursora lub innego asystenta AI do programowania? Dodaj **[xapi-skills](https://github.com/studiolxd/skills)**, aby agent wiedział, jak korzystać z tej biblioteki:

```
# Claude Code
/plugin marketplace add studiolxd/skills
/plugin install xapi-skills@studiolxd

# Cursor: skopiuj xapi-skills/cursor/xapi.mdc do .cursor/rules/ swojego projektu
# Codex/ChatGPT: dołącz xapi-skills/agents/xapi.md do pliku AGENTS.md swojego projektu
```

## Dodatkowa dokumentacja

- [xAPI 1.0.3 vs 2.0](./docs/version-differences.md)
- [Przewodnik po symulowanym LRS](./docs/mock-lrs.md)
- [Przewodnik po Launch](./docs/launch-guide.md)
- [Przewodnik po helperach serwerowych](./docs/server-helpers.md)
- [Współbieżność dokumentów (ETagi)](./docs/concurrency.md)

## Licencja

MIT
