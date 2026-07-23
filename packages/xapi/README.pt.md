🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · Português · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Um cliente TypeScript headless para o protocolo xAPI (Experience API / Tin Can). Um **núcleo agnóstico de framework** comunica com qualquer LRS (Learning Record Store) compatível com o padrão — o seu próprio, ou um comercial como Veracity, SCORM Cloud, Learning Locker ou Watershed — via xAPI 1.0.3 ou xAPI 2.0 (IEEE 9274.1.1), com adaptadores leves para **React, Vue, Angular, Svelte**, e JavaScript vanilla / `<script>`.

**Principais características:**
- Suporte completo a xAPI 1.0.3 e 2.0 através de uma única opção `version`
- Núcleo agnóstico de framework + adaptadores React / Vue / Angular / Svelte
- Headless (sem UI) — você constrói a interface
- Tipos TypeScript estritos para todo o modelo de dados xAPI (`Statement`, `Actor`, `Verb`, `Activity`, `Context`, …)
- Tratamento de erros baseado em `Result` (sem exceções implícitas)
- LRS simulado em memória para desenvolvimento local e testes (sem necessidade de um LRS real)
- Subpath `./server` com helpers de protocolo para equipes que implementam seu próprio LRS
- Helpers de launch para deep-linking de conteúdos ao estilo TinCan/Rustici

## Instalação

```bash
npm install @studiolxd/xapi
```

Os pacotes de framework (React, Vue, etc.) são peer dependencies **opcionais** — instale apenas o que você usa.

## Pontos de entrada

| Import | Para |
|--------|-----|
| `@studiolxd/xapi` | Núcleo agnóstico de framework + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React 18+: `XapiProvider`, `useXapiClient`, `useXapiStatus` |
| `@studiolxd/xapi/vue` | Vue 3.3+: composable `useXapiClient()` |
| `@studiolxd/xapi/angular` | Angular 17+: `provideXapi()` + token `XAPI` |
| `@studiolxd/xapi/svelte` | Svelte 4+: `createXapiStore()` |
| `@studiolxd/xapi/server` | Helpers de protocolo para implementar um LRS (apenas Web APIs) |
| `window.Xapi` (CDN `<script>`) | HTML simples, sem bundler |

## Início rápido — vanilla

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

## Início rápido — React

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
  const status = useXapiStatus(); // reativo: re-renderiza a cada requisição

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
      <p>Requisições em andamento: {status.pending}</p>
      <button onClick={handleComplete}>Marcar como concluído</button>
    </div>
  );
}
```

## Outros frameworks

Todos os adaptadores envolvem o mesmo cliente observável (`createXapiClient`). Instale apenas o pacote de framework que você usa, como peer dependency.

**Vue 3**
```vue
<script setup lang="ts">
import { useXapiClient } from '@studiolxd/xapi/vue';
const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
// status é um ref reativo → status.value.pending
</script>
```

**Angular 17+**
```ts
import { provideXapi, XAPI } from '@studiolxd/xapi/angular';
bootstrapApplication(App, { providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })] });
// em um componente: const { client, status } = inject(XAPI);  // status() é um signal
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

**CDN `<script>` (sem bundler)** — expõe `window.Xapi`:
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

| Opção | Tipo | Descrição |
|--------|------|-------------|
| `endpoint` | `string` | IRI base do LRS. Obrigatório. |
| `auth` | `{username,password}` \| `{token}` \| `{header}` | Basic, Bearer, ou um valor bruto de cabeçalho `Authorization`. |
| `version` | `'1.0.3' \| '2.0'` | Versão do protocolo. Padrão `'1.0.3'` (maior compatibilidade com LRS comerciais). |
| `defaults` | `{actor?, registration?, context?}` | Mesclado em `buildStatement()`/`sendStatement()` quando o campo estiver ausente. |
| `fetch` | `typeof fetch` | Injeta uma implementação `fetch` personalizada — testes, LRS simulado, ou ambientes sem fetch global. |
| `timeoutMs` | `number` | Timeout da requisição, via `AbortController`. Padrão `30000`. |
| `concurrency` | `'auto' \| 'off'` | Se os métodos `set*` de documentos gerenciam ETags automaticamente. Padrão `'auto'`. |
| `validate` | `boolean` | Se os statements são validados antes do envio. Padrão `true`. |
| `debug` | `boolean` | Ativa logging no console. Padrão `false`. |

## API de alto nível

Toda operação de rede retorna `Promise<Result<T, XapiError>>` — verifique `result.ok` antes de acessar `.value`.

### Statements

```ts
await client.sendStatement(statement);               // Result<string, XapiError> — o id do statement
await client.sendStatements([s1, s2]);                // Result<string[], XapiError>
await client.getStatement(id);                        // Result<Statement, XapiError>
await client.getVoidedStatement(id);                   // Result<Statement, XapiError>
await client.getStatements({ verb: '...', limit: 20 }); // Result<StatementsPage, XapiError>
await client.getMoreStatements(page.more);              // segue StatementsPage.more
await client.voidStatement(targetId);                    // usa options.defaults.actor se nenhum actor for informado
```

`client.buildStatement(input)` constrói um `Statement` bem formado: `verb`/`object` aceitam uma IRI em texto como atalho, `id`/`timestamp` são gerados se omitidos, e `options.defaults.actor`/`registration`/`context` preenchem o que faltar.

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

`getState`/`getActivityProfile`/`getAgentProfile` retornam `ok(null)` em um 404 — um documento inexistente não é um erro.

### Activities & Agents

```ts
await client.getActivity(activityId); // Result<Activity, XapiError>
await client.getPerson(agent);        // Result<Person, XapiError> — GET /agents
```

### About

```ts
await client.about(); // Result<AboutResource, XapiError>
```

## Tratamento de erros

Toda operação que pode falhar retorna `Result<T, XapiError>` em vez de lançar uma exceção:

```ts
const result = await client.sendStatement(statement);
if (result.ok) {
  console.log('Enviado', result.value);
} else {
  console.error(result.error.kind, result.error.status, result.error.message);
}
```

Campos de `XapiError`: `kind` (`'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage'`), `operation`, `endpoint`, `status`, `responseBody`, `issues` (preenchido quando `kind === 'validation'`), `exception`.

Funções auxiliares: `ok()`, `err()`, `isOk()`, `isErr()`, `unwrap()`, `unwrapOr()`.

## Launch

Analisa uma URL de launch ao estilo TinCan/Rustici (`?endpoint=...&auth=...&actor=...&registration=...`) e constrói um cliente pronto para uso a partir dela:

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

const launch = parseXapiLaunch(); // por padrão usa window.location.href
if (launch.ok) console.log(launch.value.endpoint, launch.value.actor);

const clientResult = createXapiClientFromLaunch(); // parse + createXapiClient em uma única etapa
if (clientResult.ok) {
  const client = clientResult.value;
  await client.sendStatement(client.buildStatement({ verb: '...', object: '...' }));
}
```

Se o seu conteúdo é instalado com um endpoint/credenciais conhecidos de antemão (CDN, bundler), dispense o launch por completo e chame `createXapiClient()` diretamente — o launch só é necessário para deep-linking gerenciado pelo LMS.

## Mock LRS / Testes

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({ actor, verb: '...', object: '...' }));
console.log(lrs.store.statements.size); // 1 — acesso direto para asserções
```

`createMemoryLrs()` implementa um LRS conforme em memória: escritas idempotentes de statements (409 em conflito de mesmo id), voiding, paginação por cursor (`more`), e documentos com suporte a ETag. Use-o em testes e demos — sem rede real, sem LRS real.

## Server helpers (./server)

Para equipes que implementam seu próprio LRS. Restrito a **apenas Web APIs** (`Request`, `Response`, `Headers`, `crypto.subtle`) — sem imports específicos do Node — funcionando assim em Route Handlers do Next.js, workers Cloudflare/Deno, e Node ≥18.

| Export | Propósito |
|--------|---------|
| `validateStatement` | Validação estrutural (compartilhada com o cliente) |
| `statementsEquivalent(a, b)` | Verificação de idempotência para escritas de statements com o mesmo id |
| `applyFormat(statement, 'exact' \| 'ids' \| 'canonical', lang?)` | Projeção para `GET /statements?format=` |
| `buildMultipartBody` / `parseMultipartBody` | Codec `multipart/mixed` para anexos de statements |
| `etagFor(content)` / `checkConditionalHeaders(req, etag)` | Semântica de requisições condicionais para documentos |
| `negotiateVersion(req)` | Valida `X-Experience-API-Version`, resolve `1.0.3`/`2.0` |
| `isVoidingStatement` / `voidingTarget` | Detecção de statements de voiding |
| `verifySignedStatement` | Verificação JWS de statements assinados (RS256/ES256, `crypto.subtle`) |

```ts
import { negotiateVersion, validateStatement, checkConditionalHeaders } from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) return new Response(null, { status: 400 });

  const statement = await req.json();
  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) return Response.json(validation.error, { status: 400 });

  // ... persistir o statement
}
```

## xAPI 1.0.3 vs 2.0

Ambas as versões do protocolo são suportadas pelo mesmo cliente — escolha uma com a opção `version`. As diferenças específicas de versão (valores aceitos de `X-Experience-API-Version`, `context.contextAgents`/`contextGroups`, rigor de ETag em documentos) estão concentradas em um único adaptador interno para que o resto da API permaneça uniforme. Veja [xAPI 1.0.3 vs 2.0](./docs/version-differences.md) para a tabela comparativa completa.

## TypeScript

Todo o modelo de dados xAPI é exportado como tipos: `Statement`, `Actor`, `Agent`, `Group`, `Verb`, `Activity`, `ActivityDefinition`, `StatementRef`, `SubStatement`, `Context`, `XapiResult`, `Score`, `Attachment`, `LanguageMap`, `Extensions`, e mais:

```ts
import type { Statement, Actor, Verb } from '@studiolxd/xapi';

const actor: Actor = { mbox: 'mailto:learner@example.com' };
```

## Agentes de codificação com IA

Usa Claude Code, Cursor, ou outro assistente de codificação com IA? Adicione a skill **[xapi-skills](https://github.com/studiolxd/xapi-skills)** para que o agente saiba usar esta biblioteca:

```
# Claude Code
/plugin marketplace add studiolxd/xapi-skills
/plugin install xapi-skills@studiolxd-xapi

# Cursor: copie cursor/xapi.mdc para o .cursor/rules/ do seu projeto
```

## Documentação adicional

- [xAPI 1.0.3 vs 2.0](./docs/version-differences.md)
- [Guia do LRS simulado](./docs/mock-lrs.md)
- [Guia de Launch](./docs/launch-guide.md)
- [Guia dos Server Helpers](./docs/server-helpers.md)
- [Concorrência de documentos (ETags)](./docs/concurrency.md)

## Licença

MIT
