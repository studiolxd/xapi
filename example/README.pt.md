🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/xapi` — Demo interativa

Uma aplicação de exemplo interativa e totalmente funcional que demonstra todas as
funcionalidades da biblioteca
[`@studiolxd/xapi`](https://www.npmjs.com/package/@studiolxd/xapi) — o núcleo agnóstico de
framework, o adaptador `./react`, e os caminhos de launch, vanilla e CDN.

Construída com **React 19 + TypeScript + Vite** (usando o adaptador `@studiolxd/xapi/react`).
Roda inteiramente no navegador, por padrão contra `createMemoryLrs()` — uma implementação xAPI
em memória — portanto **nenhum LRS real é necessário** para experimentá-la. Uma aba
**Connection** também permite apontar a demo para qualquer LRS real (o seu próprio
[`studiolxd/lrs`](https://github.com/studiolxd/lrs), Veracity, SCORM Cloud, Learning Locker…)
com Basic auth.

---

## Como começar

A partir da **raiz do repositório** (a demo é um workspace npm):

```bash
npm install
npm run dev:example
```

Abra `http://localhost:5173` no navegador.

---

## O que esta demo demonstra

O cabeçalho tem um **seletor de versão xAPI** (1.0.3 / 2.0) e um **selo mock / LRS real**.
Alternar qualquer um dos dois remonta o `XapiProvider` com um cliente novo — a biblioteca não
tem um método de "reconfigurar", então remontar é a forma correta de apontar para outro LRS ou
versão.

### 10 seções da demo

| Aba | Funcionalidades demonstradas |
|-----|-----------------------|
| **Connection** | `XapiStatus` ao vivo, alternância entre o LRS mock e um real, `client.about()` |
| **Statement Builder** | `client.buildStatement()`, `VERBS`, `client.sendStatement()` — construir um statement a partir de ator/verbo/objeto/resultado e enviá-lo |
| **Query** | `client.getStatements(query)` com filtros, paginação via `client.getMoreStatements()` |
| **Voiding** | `client.voidStatement()`, `client.getVoidedStatement()` — statements são imutáveis, anular é como se retrata um |
| **State** | `getState` / `setState` / `deleteState` / `getStateIds` — armazenamento por ator e atividade |
| **Activity Profile** | `getActivityProfile` / `setActivityProfile` / `deleteActivityProfile` / `getActivityProfileIds` — armazenamento compartilhado por atividade |
| **Agent Profile** | `getAgentProfile` / `setAgentProfile` / `deleteAgentProfile` / `getAgentProfileIds` — armazenamento compartilhado por agente |
| **Launch** | `parseXapiLaunch()` — leitura de uma URL de launch no estilo TinCan/Rustici |
| **Vanilla / CDN** | `createXapiClient()` fora do React, mais o snippet IIFE/CDN de `window.Xapi` |
| **About & Versions** | Cola 1.0.3 vs 2.0, `client.about()` ao vivo |

---

## Sobre o LRS mock

O app usa `createMemoryLrs()` de `@studiolxd/xapi` — uma implementação em memória do
protocolo xAPI (a mesma usada pela própria suíte de testes da biblioteca). É criado uma única
vez no nível do módulo, então os dados da demo sobrevivem às trocas de versão.

```tsx
// App.tsx
const memoryLrs = createMemoryLrs();

<XapiProvider
  key={`${version}-${connection.mode}-${connection.endpoint}`}
  options={{ endpoint: 'https://mock.lrs/xapi', version, fetch: memoryLrs.fetch }}
>
  {/* todos os componentes que chamam useXapiClient() vão aqui */}
</XapiProvider>
```

Use a aba **Connection** para trocar para um LRS real: informe o endpoint e as credenciais
Basic auth e clique em **Connect**.

---

## Visão geral da biblioteca

`@studiolxd/xapi` é um cliente xAPI (Experience API / Tin Can) agnóstico de framework: um
núcleo com adaptadores para React, Vue, Angular e Svelte, além de um subpath `./server` com
helpers de protocolo para implementar um LRS. Esta demo usa o adaptador React.

### Conceitos-chave

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
  const client = useXapiClient();   // XapiClient estável
  const status = useXapiStatus();   // XapiStatus reativo (renderiza de novo a cada requisição)
}
```

**2. Tratamento de erros baseado em Result**

Todo método de rede retorna `Promise<Result<T, XapiError>>` — sem exceções lançadas:

```tsx
const result = await client.sendStatement(statement);

if (result.ok) {
  console.log('salvo com id', result.value);
} else {
  console.error(`${result.error.kind}: ${result.error.message}`);
}
```

**3. Statements são construídos, não escritos à mão**

```tsx
const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,                     // ou uma IRI como string
  object: 'https://example.com/course/1',    // atalho para uma Activity
  result: { success: true, score: { raw: 90, min: 0, max: 100 } },
});
```

`id` e `timestamp` são gerados automaticamente se omitidos.

**4. Suporte dual de versão**

O mesmo cliente fala xAPI 1.0.3 e 2.0 — escolha com `createXapiClient({ version })`. Veja a
aba **About & Versions** e
[`packages/xapi/docs/version-differences.md`](../packages/xapi/docs/version-differences.md)
para saber exatamente o que é abstraído.

---

## Estrutura do projeto

```
src/
├── main.tsx                       # Ponto de entrada do Vite
├── App.tsx                        # Seletor de versão/conexão + XapiProvider + navegação por abas
├── connection.ts                  # Tipo ConnectionConfig + valores padrão
├── XapiConnectionContext.tsx      # Compartilha o estado de conexão mock/real entre as seções
├── ResultView.tsx                 # Renderiza um Result<T, XapiError> como ok/error + JSON
├── App.css / index.css            # Sistema de design (reaproveitado da demo do @studiolxd/scorm)
└── sections/
    ├── ConnectionSection.tsx      # Status ao vivo, troca mock/real, about()
    ├── StatementBuilderSection.tsx
    ├── QuerySection.tsx
    ├── VoidingSection.tsx
    ├── StateSection.tsx
    ├── ActivityProfileSection.tsx
    ├── AgentProfileSection.tsx
    ├── LaunchSection.tsx
    ├── PlatformsSection.tsx       # createXapiClient() + snippet CDN de window.Xapi
    └── AboutSection.tsx
```

---

## Stack de desenvolvimento

- **Build**: [Vite](https://vite.dev) 8 + `@vitejs/plugin-react`. O build de produção é
  `tsc -b && vite build` — checagem de tipos e depois empacotamento.
- **Linguagem**: TypeScript 5.9, modo strict (`tsconfig.app.json`).
- **Linting**: ESLint 9 com configuração flat (`typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`). Execute com `npm run lint`.

### Scripts

| Script | Comando | Descrição |
|--------|---------|-------------|
| `npm run dev` | `vite` | Inicia o servidor de dev em `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Checagem de tipos + build de produção |
| `npm run lint` | `eslint .` | Lint em todos os arquivos `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Pré-visualiza o build de produção localmente |

A partir da raiz do repositório: `npm run dev:example` executa `npm run dev --workspace=example`.

---

## Licença

MIT — veja [LICENSE](./LICENSE).
