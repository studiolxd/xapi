# @studiolxd/xapi — Especificación de implementación

> **Estado: diseño cerrado (2026-07-22), listo para implementar.** Este
> documento es autocontenido: un agente sin contexto previo debe poder
> construir la librería completa siguiéndolo. La plantilla arquitectónica es
> `/Users/suvi/Dev/scorm` (`@studiolxd/scorm` v2.0.0) — cuando este documento
> diga "igual que scorm", el archivo equivalente de ese repo es la referencia
> normativa y puede copiarse adaptando nombres.
>
> Repo aún no bootstrapeado en GitHub: primero se crea `studiolxd/xapi`
> (público, MIT) con la estructura de la Fase 0.

## 1. Qué es

**Un único paquete npm `@studiolxd/xapi`**: cliente xAPI (Experience API /
Tin Can) agnóstico de framework para que cualquier contenido o producto de
Studio LXD hable con **cualquier LRS estándar** (el propio `studiolxd/lrs`,
Veracity, SCORM Cloud, Learning Locker, Watershed…), más helpers de servidor
para *implementar* un LRS. Soporta **xAPI 1.0.3 y xAPI 2.0 (IEEE 9274.1.1)**.

Ecosistema (mismo patrón que scorm):

| Repo | Rol | Referencia |
|---|---|---|
| `studiolxd/scorm` | Plantilla arquitectónica a calcar | `/Users/suvi/Dev/scorm` |
| `studiolxd/lrs` | Primer consumidor: su validador de `/api/xapi/**` y helpers de backend deben consumir esta librería en vez de reimplementar | `/Users/suvi/Dev/lrs/PLAN.md` (puntos 2 y 3) |
| `studiolxd/skills` | Marketplace de skills de agente IA (incluye `xapi-skills`, que enseña a usar esta librería) | `/Users/suvi/Dev/skills/xapi-skills/PLAN.md` |

`@studiolxd/lrs-widget` es un concepto **distinto**: habla con la API de
lectura propia de LRS (`/api/widget/v1/**` + `ReadToken`), no con el
protocolo xAPI. No confundir.

## 2. Decisiones cerradas

- **Nombre del paquete/repo**: `@studiolxd/xapi` / `studiolxd/xapi`.
- **Factory principal**: **`createXapiClient`** (no `createXapiSession` —
  xAPI no tiene ciclo de vida initialize/terminate; el nombre
  `createXapiSession` queda reservado para un futuro helper de contexto de
  lanzamiento estilo cmi5).
- **Alcance v1: completo** — cliente (statements, documents, about, launch)
  **+** subpath `./server` con helpers para implementar un LRS (validación,
  equivalencia, multipart, ETag…), reutilizables por `studiolxd/lrs`.
- **Adaptador `./wc`: fuera de v1.** El caso "HTML plano sin build" lo cubre
  el build IIFE (`window.Xapi` vía CDN). Queda anotado como extensión futura.
- **Adaptadores v1**: `.` (vanilla/core), `./react`, `./vue`, `./angular`
  (≥17), `./svelte`, `./server`.
- **Patrón `Result<T, XapiError>`** idéntico al de scorm (discriminante
  `ok`, campos `value`/`error`, ambos `readonly`). La API pública **nunca
  lanza**.
- **Licencia MIT**, repo público desde el inicio, publicación **manual** a
  npm (sin changesets ni provenance, como scorm).
- **Fuera de v1** (anotado para futuro): `./wc`, puente SCORM→xAPI, cola
  offline con reintentos, `createXapiSession` (cmi5), firma JWS de
  statements en el *cliente* (la verificación sí está en `./server`).

## 3. Estructura del repo (calcada de scorm)

Monorepo **npm workspaces** (no pnpm, no turborepo). Raíz privada.

```
xapi/
├── package.json                  # name @studiolxd/xapi-monorepo, private,
│                                 # workspaces ["packages/*","example"],
│                                 # devDep jsdom hoisted, scripts build/test/dev:lib/dev:example
├── .gitignore                    # node_modules/ dist/ *.tsbuildinfo coverage/ .DS_Store
├── AGENTS.md                     # reglas del repo (ver §12)
├── README.md (+ .es .fr .pt .de .pl)   # 6 idiomas, switcher 🌐 en línea 1
├── PLAN.md                       # este documento
├── .github/workflows/
│   └── angular-smoke.yml         # npm pack + instala en tests/angular-smoke + ng build production
├── packages/
│   └── xapi/                     # EL PAQUETE PUBLICABLE
│       ├── package.json          # ver §4
│       ├── tsup.config.ts        # ver §4
│       ├── tsconfig.json         # copiar el de packages/scorm (strict, ES2020,
│       │                         # moduleResolution bundler, noUncheckedIndexedAccess…)
│       ├── vitest.config.ts      # jsdom, globals, setupFiles tests/setup.ts,
│       │                         # include tests/**/*.test.{ts,tsx}, coverage v8
│       ├── .npmignore            # src/ tests/ docs/ configs
│       ├── CHANGELOG.md          # Keep a Changelog
│       ├── LICENSE               # MIT "Copyright (c) 2026 Studio LXD"
│       ├── llms.txt              # doc condensada para IA, se publica en npm
│       ├── README.md (+ 5 idiomas)
│       ├── .github/workflows/ci.yml   # npm ci → typecheck → test:run → build (node 20)
│       ├── src/                  # ver §5-§8
│       ├── tests/                # espejo de src/, ver §10
│       └── docs/                 # ver §11
├── example/                      # app demo React 19 + Vite, private, ver §9
└── tests/
    └── angular-smoke/            # fixture Angular 17 AOT (copiar de scorm; el workflow
                                  # borra package-lock.json antes de instalar — bug npm/cli#4828)
```

## 4. Paquete publicable — empaquetado

`packages/xapi/package.json` (campos clave; el resto igual que
`packages/scorm/package.json`):

```jsonc
{
  "name": "@studiolxd/xapi",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "unpkg": "./dist/xapi.global.js",
  "jsdelivr": "./dist/xapi.global.js",
  "sideEffects": false,             // no hay ./wc → nada con efectos secundarios
  "files": ["dist", "llms.txt"],
  "exports": {
    ".":          { "import": { "types": "./dist/index.d.ts",   "default": "./dist/index.js" },
                    "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" } },
    "./react":    { /* mismo shape → dist/react.* */ },
    "./vue":      { /* → dist/vue.* */ },
    "./angular":  { /* → dist/angular.* */ },
    "./svelte":   { /* → dist/svelte.* */ },
    "./server":   { /* → dist/server.* */ },
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "react": ">=18", "react-dom": ">=18", "vue": ">=3.3",
    "@angular/core": ">=17", "svelte": ">=4"
  },
  "peerDependenciesMeta": { /* las 5 con { "optional": true } */ },
  "scripts": {
    "build": "tsup", "dev": "tsup --watch",
    "test": "vitest", "test:run": "vitest run", "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run typecheck && npm run test:run && npm run build"
  },
  "keywords": ["xapi", "tin-can", "experience-api", "lrs", "statements",
               "react", "vue", "angular", "svelte", "vanilla", "e-learning", "headless"],
  "repository": { "type": "git", "url": "git+https://github.com/studiolxd/xapi.git",
                  "directory": "packages/xapi" },
  "publishConfig": { "access": "public" }
}
```

**Sin dependencias de runtime** (`dependencies` vacío): fetch nativo, UUID
vía `crypto.randomUUID()`, multipart implementado a mano (igual que hizo lrs
en `src/lib/xapi/multipart.ts` — el formato xAPI es `multipart/mixed`, no
`multipart/form-data`, así que no sirven librerías estándar).

`tsup.config.ts` — dos configuraciones, calcado de scorm:

```ts
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.ts',
      vue: 'src/vue/index.ts',
      angular: 'src/angular/index.ts',
      svelte: 'src/svelte/index.ts',
      server: 'src/server/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true, sourcemap: true, clean: true, splitting: false, treeshake: true,
    external: ['react', 'react-dom', 'vue', /^@angular\//, /^svelte($|\/)/],
  },
  {
    entry: { xapi: 'src/index.ts' },      // solo el core, sin frameworks ni ./server
    format: ['iife'], globalName: 'Xapi',
    sourcemap: true, minify: true, treeshake: true, clean: false,
  },
]);
```

## 5. Núcleo — tipos y utilidades base

Árbol de `src/` (los adaptadores en §8; nada fuera de sus carpetas importa
framework alguno):

```
src/
├── index.ts                # barrel del core: TODO lo de §5-§6, cero imports de framework
├── result/result.ts        # COPIA LITERAL de scorm: Result, ok, err, isOk, isErr, unwrap, unwrapOr
├── errors/xapi-error.ts    # clase XapiError (ver abajo)
├── types/                  # tipos del protocolo, por archivo:
│   ├── statement.ts        # Statement, Actor (Agent|Group), Verb, Object (Activity|
│   │                       #   StatementRef|SubStatement|Agent|Group), XapiResult, Context,
│   │                       #   Attachment, LanguageMap, Extensions, Score…
│   ├── documents.ts        # StateParams, ActivityProfileParams, AgentProfileParams, XapiDocument
│   ├── query.ts            # StatementsQuery (agent, verb, activity, registration, since,
│   │                       #   until, limit, format, attachments, ascending, related_*)
│   ├── about.ts            # AboutResource
│   ├── options.ts          # XapiClientOptions, XapiAuth, XapiStatus
│   └── common.ts           # XapiVersion = '1.0.3' | '2.0'
├── validate/               # validación estructural aislada de red — la consume también ./server
│   ├── statement.ts        # validateStatement(st, { version }): Result<Statement, XapiError>
│   ├── iri.ts              # isValidIri, isValidMbox, isValidUuid…
│   └── issues.ts           # ValidationIssue { path, rule, message }
├── build/
│   ├── build-statement.ts  # buildStatement(input): Statement
│   ├── verbs.ts            # VERBS: IRIs ADL (completed, passed, failed, answered, attempted,
│   │                       #   experienced, initialized, terminated, launched, progressed,
│   │                       #   responded, interacted, voided…)
│   └── activity-types.ts   # ACTIVITY_TYPES: IRIs comunes (course, module, assessment,
│                           #   question, media/video, objective…)
├── client/
│   ├── create-xapi-client.ts   # la factory (ver §6)
│   ├── transport.ts            # fetch + auth + headers de versión + timeout + errores HTTP→XapiError
│   ├── statements.ts           # recurso /statements (send, get, query, void, more)
│   ├── documents.ts            # recursos /activities/state, /activities/profile, /agents/profile
│   ├── activities.ts           # GET /activities, GET /agents (Person)
│   └── about.ts                # GET /about
├── launch/
│   └── launch.ts           # parseXapiLaunch, createXapiClientFromLaunch (ver §6.4)
├── internal/
│   ├── multipart.ts        # codec multipart/mixed a nivel de bytes (compartido cliente/server;
│   │                       #   referencia de implementación: /Users/suvi/Dev/lrs src/lib/xapi/multipart.ts)
│   └── version-adapter.ts  # normalización de payloads 1.0.3 ⇄ 2.0 (ver §6.5)
├── mock/
│   └── memory-lrs.ts       # createMemoryLrs() (ver §6.6)
├── debug/logger.ts         # createLogger(debug) — copiar de scorm
├── server/                 # ver §7
└── react/  vue/  angular/  svelte/   # ver §8
```

**`Result<T, E>`** — copiar `packages/scorm/src/result/result.ts` tal cual:
unión discriminada `{ ok: true; value: T } | { ok: false; error: E }`,
helpers `ok/err/isOk/isErr/unwrap/unwrapOr`. Regla dura: nunca leer
`.value` sin comprobar `.ok`.

**`XapiError`** — clase `extends Error`, mismo espíritu que `ScormError`:

```ts
type XapiErrorKind = 'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage';

interface XapiErrorInfo {
  kind: XapiErrorKind;
  operation: string;          // 'sendStatement', 'getState'…
  endpoint: string | null;
  status: number | null;      // código HTTP si kind === 'http'
  responseBody: string | null;   // cuerpo de la respuesta de error del LRS (truncado a 2 KB)
  issues: ValidationIssue[];  // si kind === 'validation'
  exception?: Error;          // causa original (TypeError de fetch, AbortError…)
}
class XapiError extends Error implements XapiErrorInfo { /* name = 'XapiError';
  message compuesto desde los campos, como hace ScormError */ }
```

## 6. Núcleo — API del cliente

### 6.1 Factory y opciones

```ts
function createXapiClient(options: XapiClientOptions): XapiClient;

type XapiAuth =
  | { username: string; password: string }   // Basic
  | { token: string }                        // Bearer
  | { header: string };                      // valor Authorization crudo (escape hatch)

interface XapiClientOptions {
  endpoint: string;             // IRI base del LRS, con o sin '/' final (se normaliza)
  auth?: XapiAuth;
  version?: XapiVersion;        // default '1.0.3' (lo más compatible con LRS comerciales)
  defaults?: {                  // se mezclan en buildStatement()/sendStatement() si faltan
    actor?: Actor;
    registration?: string;
    context?: Partial<Context>;
  };
  fetch?: typeof fetch;         // inyección: tests, mock LRS, entornos sin fetch global
  timeoutMs?: number;           // default 30000, vía AbortController
  concurrency?: 'auto' | 'off'; // ETags en documents (ver §6.3), default 'auto'
  validate?: boolean;           // default true: valida statements antes de enviar
  debug?: boolean;              // default false: logging con createLogger
}
```

Toda operación de red devuelve `Promise<Result<T, XapiError>>` (a
diferencia de scorm, que es síncrono — es la única divergencia de contrato,
impuesta por HTTP). El transporte añade siempre `X-Experience-API-Version`
(`1.0.3` o `2.0` según `options.version`) y `Authorization`.

### 6.2 Interfaz `XapiClient`

```ts
interface XapiClient {
  // — Statements —
  sendStatement(st: Statement): Promise<Result<string, XapiError>>;          // devuelve el id
  sendStatements(sts: Statement[]): Promise<Result<string[], XapiError>>;
  getStatement(id: string): Promise<Result<Statement, XapiError>>;
  getVoidedStatement(id: string): Promise<Result<Statement, XapiError>>;
  getStatements(q?: StatementsQuery): Promise<Result<StatementsPage, XapiError>>;
  getMoreStatements(more: string): Promise<Result<StatementsPage, XapiError>>;  // IRL de paginación
  voidStatement(targetId: string, actor?: Actor): Promise<Result<string, XapiError>>;
      // construye y envía el statement con VERBS.voided + StatementRef;
      // actor opcional si hay defaults.actor, si no → err(kind:'usage')

  // — State (usa defaults.actor/registration si no se pasan en opts) —
  getState(activityId: string, stateId: string, opts?: DocOpts): Promise<Result<XapiDocument | null, XapiError>>;
  setState(activityId: string, stateId: string, value: unknown, opts?: SetDocOpts): Promise<Result<true, XapiError>>;
  deleteState(activityId: string, stateId?: string, opts?: DocOpts): Promise<Result<true, XapiError>>;
  getStateIds(activityId: string, opts?: DocOpts & { since?: string }): Promise<Result<string[], XapiError>>;

  // — Activity profile / Agent profile: mismo cuarteto get/set/delete/getIds —
  getActivityProfile(...); setActivityProfile(...); deleteActivityProfile(...); getActivityProfileIds(...);
  getAgentProfile(...);    setAgentProfile(...);    deleteAgentProfile(...);    getAgentProfileIds(...);

  // — Otros recursos —
  getActivity(activityId: string): Promise<Result<Activity, XapiError>>;
  getPerson(agent: Agent): Promise<Result<Person, XapiError>>;   // GET /agents
  about(): Promise<Result<AboutResource, XapiError>>;

  // — Construcción con defaults del cliente —
  buildStatement(input: BuildStatementInput): Statement;   // = buildStatement() + defaults

  // — Observabilidad (contrato idéntico a ScormSession para que los adaptadores
  //    sean calcados de los de scorm) —
  readonly status: XapiStatus;   // snapshot inmutable, referencia estable entre 'change'
  on(event: 'change', cb: (s: XapiStatus) => void): () => void;   // devuelve unsubscribe
  off(event: 'change', cb: (s: XapiStatus) => void): void;
  destroy(): void;               // cancela peticiones en vuelo y libera listeners
}

interface XapiStatus {
  endpoint: string;
  version: XapiVersion;
  pending: number;               // peticiones en vuelo
  lastError: XapiError | null;   // último error de red/HTTP (se limpia en el siguiente éxito)
}
```

`buildStatement` standalone (sin cliente) también se exporta desde el core:
genera `id` (`crypto.randomUUID()`) y `timestamp` ISO 8601 si faltan; acepta
`verb` como IRI string (busca display en `VERBS`) o como objeto `Verb`
completo, y `object` como IRI string (→ `Activity` mínima) o como objeto.

`XapiDocument`: `{ content: unknown; contentType: string; etag: string | null; raw: string }`
(si `contentType` es JSON, `content` viene parseado; si no, `content === raw`).

`getState`/`getAgentProfile`/… devuelven `ok(null)` en 404 (documento no
existe **no** es un error); el resto de 4xx/5xx → `err(kind:'http')`.

### 6.3 Concurrencia de documents (ETag)

Con `concurrency: 'auto'` (default): los `set*` hacen `If-None-Match: *` si
no se conoce ETag (creación segura) y, si el LRS responde 412, un ciclo
GET→PUT con `If-Match` (un solo reintento). `SetDocOpts` acepta
`{ etag?: string, contentType?: string }` para control manual. Con
`concurrency: 'off'` no se envían headers condicionales (algunos LRS 1.0.3
los rechazan). Documentar la matriz de comportamiento en
`docs/concurrency.md`.

### 6.4 Launch (equivalente al "locator" de scorm)

El equivalente xAPI de "encontrar la API del LMS en frames padre" es leer
los **query params de lanzamiento** (convención TinCan/Rustici launch:
`endpoint`, `auth`, `actor`, `registration`, `activity_id`):

```ts
function parseXapiLaunch(url?: string):        // default: window.location.href (SSR-safe)
  Result<XapiLaunchParams, XapiError>;
function createXapiClientFromLaunch(
  url?: string, extra?: Partial<XapiClientOptions>,
): Result<XapiClient, XapiError>;              // launch params + extra → createXapiClient;
                                               // actor/registration del launch → defaults
```

cmi5 queda fuera de v1 (anotado como futuro `createXapiSession`).

### 6.5 Soporte dual 1.0.3 / 2.0

`internal/version-adapter.ts` concentra TODAS las diferencias; el resto del
código trabaja con los tipos internos (basados en 1.0.3, el formato más
extendido) y el adaptador traduce en la frontera de red. Mínimo a cubrir
(documentado en `docs/version-differences.md` con tabla campo a campo):

- Header `X-Experience-API-Version` y validación de la respuesta de `/about`.
- Campos nuevos/retirados de 2.0 en `context` (`contextAgents`/
  `contextGroups` se exponen como opcionales tipados que el adaptador omite
  en 1.0.3).
- 2.0 exige headers condicionales (ETag) en documents; en 1.0.3 son
  recomendados (ver §6.3).
- Formato `timestamp`/`stored` (2.0 restringe a variantes ISO 8601 estrictas).
- La validación (`validateStatement`) recibe `{ version }` y aplica las
  reglas de la versión correspondiente.

### 6.6 Mock LRS (equivalente al mock mode de scorm)

```ts
function createMemoryLrs(): {
  fetch: typeof fetch;   // implementación en memoria de /statements, /activities/state,
                         // /activities/profile, /agents/profile, /activities, /agents, /about
  store: MemoryLrsStore; // acceso directo para asserts en tests y para la demo
  reset(): void;
}
```

Se usa vía `createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: memoryLrs.fetch })`.
Implementa la semántica observable de la spec: idempotencia de `statementId`
(reenviar mismo id con contenido distinto → 409), voiding, paginación con
`more`, ETags en documents. Lo usan **todos los tests** y la app de ejemplo,
que así corre 100 % en navegador sin LRS real.

## 7. Subpath `./server` — helpers para implementar un LRS

Restricción dura: **solo Web APIs** (`Request`, `Response`, `Headers`,
`Uint8Array`, `crypto.subtle`) — nada de Node ni DOM — para que funcione en
Route Handlers de Next.js, workers y Node ≥18. El primer consumidor es
`studiolxd/lrs`, que hoy tiene implementaciones propias que sirven de
**referencia normativa de comportamiento** (portar, no reinventar):

| Export | Qué hace | Referencia en /Users/suvi/Dev/lrs |
|---|---|---|
| `validateStatement` y familia | Reexport de `src/validate/` (compartido con el cliente) | `src/lib/xapi/statement.ts` |
| `statementsEquivalent(a, b)` | Equivalencia para idempotencia de POST/PUT con mismo id | `statementsEquivalent()` en `src/lib/xapi/statement.ts` |
| `applyFormat(st, 'exact' \| 'canonical' \| 'ids', lang?)` | Proyección de statements según `format` | `src/lib/xapi/format.ts` |
| `parseMultipartStatements(body, contentType)` / `buildMultipartResponse(...)` | Codec `multipart/mixed` de attachments a nivel de bytes | `src/lib/xapi/multipart.ts` |
| `verifySignedStatement(st, opts)` | Verificación JWS de statements firmados (allow-list de algoritmos) | `src/lib/xapi/jws.ts` (usa `jose`; aquí reimplementar sobre `crypto.subtle` para mantener cero deps — si no es viable, documentar `jose` como peer opcional del subpath) |
| `etagFor(content)` / `checkConditionalHeaders(req, currentEtag)` | SHA-1 hex + semántica If-Match/If-None-Match de la spec | punto 2 del PLAN.md de lrs |
| `negotiateVersion(req)` | Valida `X-Experience-API-Version` y resuelve 1.0.3/2.0 | idem |
| `voidingTarget(st)` / reglas de voiding | Detecta statements de voiding y extrae el target | `voidedStatementId` en `src/app/api/xapi/statements/route.ts` |

`./server` **no** incluye routing, persistencia ni auth — eso es del LRS.
Criterio de inclusión: lógica del *protocolo* que cualquier implementador
necesita y que hoy lrs tiene duplicada.

## 8. Adaptadores (finos: 70-105 líneas, calcados de scorm)

Contrato común (idéntico al de scorm, receta en su `AGENTS.md` §"Adding a
framework adapter"): crear el cliente → puentear `client.on('change')` a la
reactividad del framework → cleanup con `destroy()` en el hook de
destrucción. **Ningún adaptador contiene lógica xAPI.** Cada entry de
adaptador hace además `export * from '../index'` para poder importarlo todo
desde el subpath (como hace `src/react/index.ts` de scorm).

- **`./react`** (espejo de `src/react/` de scorm, 6 archivos):
  - `XapiProvider({ options, children })` — crea el cliente con `useMemo`
    (deps: campos individuales de options), lo mete en
    `XapiContext = createContext<XapiContextValue | null>(null)`;
    `XapiContextValue = { client, status }`.
  - `useXapiClient(): XapiClient` — lanza si no hay provider (mensaje claro).
  - `useXapiStatus(): XapiStatus` — `useSyncExternalStore` sobre
    `client.on('change')` (espejo de `use-scorm-session.ts`).
- **`./vue`** — `useXapiClient(options): { client, status: ShallowRef<XapiStatus>, destroy }`;
  `shallowRef` + `on('change')` + `onScopeDispose(destroy)` solo si
  `getCurrentScope()` (espejo de `src/vue/index.ts`).
- **`./angular`** (≥17, decorator-free, sin ng-packagr):
  `XAPI = new InjectionToken<XapiHandle>('@studiolxd/xapi')`;
  `provideXapi(options): Provider` con `useFactory` que crea cliente +
  `signal<XapiStatus>` + `inject(DestroyRef).onDestroy(destroy)`;
  `XapiHandle = { client, status: Signal<XapiStatus> }` (espejo de
  `src/angular/index.ts`).
- **`./svelte`** (≥4) — `createXapiStore(options): { client, status: Readable<XapiStatus>, destroy }`
  con `readable(client.status, set => client.on('change', set))` (espejo de
  `src/svelte/index.ts`).

## 9. App de ejemplo (`example/`, calcada de la de scorm)

React 19 + TypeScript + Vite, `"private": true`, dep `"@studiolxd/xapi": "*"`
(link de workspace). Corre **100 % en navegador contra `createMemoryLrs()`**
por defecto, con un formulario para apuntar a un LRS real
(endpoint + Basic auth) — así sirve también como probador contra Veracity,
SCORM Cloud, `studiolxd/lrs`, etc.

- `src/App.tsx`: shell con selector de versión 1.0.3/2.0 (remount con
  `key={version}`, como scorm), badge "mock LRS"/"LRS real", tabs.
- `src/sections/` — una sección por dominio (espejo de las 10 de scorm):
  `ConnectionSection` (endpoint/auth/about), `StatementBuilderSection`
  (formulario actor/verbo/objeto/resultado → JSON en vivo → enviar),
  `QuerySection` (filtros + paginación `more`), `VoidingSection`,
  `StateSection`, `ActivityProfileSection`, `AgentProfileSection`,
  `LaunchSection` (simula una URL de launch y usa
  `createXapiClientFromLaunch`), `PlatformsSection` (vanilla
  `createXapiClient` + snippet CDN/IIFE en vivo), `AboutSection`
  (diferencias 1.0.3/2.0).
- Resto igual que `scorm/example`: `vercel.json` (deploy, install desde
  raíz), ESLint flat config, READMEs en 6 idiomas con tabla de secciones.
- Ejecución: `npm install` en la raíz + `npm run dev:example` →
  `http://localhost:5173`.

## 10. Tests

Vitest 4 + jsdom + `@vitest/coverage-v8`, config copiada de scorm
(`environment: 'jsdom'`, `globals: true`, `setupFiles: ['./tests/setup.ts']`
con cleanup de testing-library). `tests/` **espeja `src/`**:
`result/`, `errors/`, `validate/` (casos válidos e inválidos por versión),
`build/`, `client/` (cada recurso contra `createMemoryLrs`, incl. timeout,
401/403, 409 idempotencia, 412+retry de ETag, paginación), `launch/`,
`internal/` (multipart round-trip a nivel de bytes, version-adapter),
`mock/`, `server/` (equivalencia, format, multipart, ETag, JWS,
negotiateVersion), `adapters/` (vue con `effectScope`, angular, svelte),
`react/` (`.test.tsx` con testing-library), `integration/`
(flujo completo enviar→query→void→state por cada versión). Referencia de
volumen en scorm: ~420 tests. Todos los tests usan el mock LRS — cero red.

## 11. Documentación

- **README del paquete** (~450 líneas, inglés + 5 traducciones es/fr/pt/de/pl
  con switcher 🌐 en línea 1, **sin badges**): misma estructura que el de
  scorm — features → Installation → Entry points (tabla) → Quick Start
  vanilla → Quick Start React → Other frameworks (Vue/Angular/Svelte/CDN,
  snippet cada uno) → opciones del cliente (tabla) → High-Level API por
  dominio (cada método con snippet) → Error Handling (`Result`) → Launch →
  Mock LRS / Testing → Server helpers → TypeScript → AI coding agents
  (marketplace `studiolxd/skills`) → Additional Documentation → License.
- **README raíz** (6 idiomas): tabla de packages, getting started, estructura,
  publishing (manual), license — como el de scorm.
- **`packages/xapi/docs/`**: `version-differences.md` (tabla 1.0.3 vs 2.0,
  equivalente a `scorm-mapping-table.md`), `mock-lrs.md`, `launch-guide.md`
  (integrar en contenidos: launch TinCan, CDN, bundlers),
  `server-helpers.md` (guía para implementadores de LRS), `concurrency.md`
  (matriz ETag §6.3).
- **`llms.txt`** (se publica en npm): mismo formato que el de scorm —
  resumen, entry points, regla de `Result`, lista completa de métodos,
  quickstart por adaptador, gotchas (IRI mal formada, mbox vs mbox_sha1sum,
  timestamp sin zona, reenvío de id con contenido distinto → 409, voiding).

## 12. AGENTS.md del nuevo repo

Copiar el de scorm adaptando dominio. Reglas que debe codificar:
TypeScript strict; JSDoc con `@example` en todo símbolo público;
`Result<T, XapiError>` universal y nunca lanzar en API pública; aislamiento
de framework (fuera de `src/{react,vue,angular,svelte}/` no se importa
framework; fuera de `src/server/` no se asume servidor); SSR-safe (guardar
`window`/`document` con `typeof`); `./server` solo Web APIs; tests en
`tests/` espejando `src/` con el mock LRS; receta de 5 pasos para añadir
adaptadores; flujo de release (CHANGELOG → `npm version` → publish manual).

## 13. CI y publicación

- `packages/xapi/.github/workflows/ci.yml`: push/PR a `main`, node 20,
  `npm ci` → `typecheck` → `test:run` → `build` (copiar de scorm).
- `.github/workflows/angular-smoke.yml`: `npm pack` del paquete → instalar
  en `tests/angular-smoke` → `ng build --configuration production` (copiar
  de scorm, incluido el borrado de `package-lock.json`).
- Publicación **manual**: `cd packages/xapi && npm publish` (gate:
  `prepublishOnly`). SemVer + CHANGELOG "Keep a Changelog". Conventional
  Commits (`feat:`, `fix:`, `docs:`, `chore:`).

## 14. Fases de implementación (con criterios de aceptación)

1. **Bootstrap** — estructura §3 completa, workspaces instalan, `tsup` builda
   un `index.ts` vacío, CI verde, LICENSE/`.gitignore`/AGENTS.md en su sitio.
2. **Base** — `result/`, `errors/`, `types/`, `validate/`, `build/` con
   tests. ✔ `validateStatement` acepta/rechaza los fixtures de ambas
   versiones; `buildStatement` genera id UUID y timestamp ISO si faltan.
3. **Mock LRS + transporte** — `mock/memory-lrs.ts`, `client/transport.ts`.
   ✔ auth Basic/Bearer, header de versión, timeout y mapeo de errores
   probados contra el mock.
4. **Recursos del cliente** — statements, documents, activities, about,
   `status`/`on('change')`. ✔ toda la interfaz §6.2 con tests, incl. 409,
   412+retry, paginación, `ok(null)` en 404 de documents.
5. **Multipart + dual versión** — `internal/multipart.ts`,
   `internal/version-adapter.ts`, attachments en send/get.
   ✔ round-trip de attachments byte a byte; suite de integración pasa en
   '1.0.3' y '2.0'.
6. **Launch** — §6.4 con tests SSR-safe. ✔ URL de launch estilo Rustici se
   parsea correctamente.
7. **`./server`** — §7 completo. ✔ paridad de comportamiento con las
   implementaciones de referencia de lrs (equivalencia, format, multipart,
   ETag, JWS, versión).
8. **Adaptadores** — react/vue/angular/svelte + tests + angular-smoke verde.
9. **Ejemplo** — §9 completo, deploy Vercel funcionando contra el mock.
10. **Docs y release** — §11 completo (6 idiomas), `llms.txt`, CHANGELOG
    1.0.0, `npm publish` manual. ✔ `npm install @studiolxd/xapi` + snippet
    CDN del README funcionan tal cual.

Tras publicar: avisar en `/Users/suvi/Dev/skills/xapi-skills/PLAN.md` (su
bloqueo "API sin cerrar" queda resuelto por este documento) y abrir la
migración de `studiolxd/lrs` a los helpers de `./server`.
