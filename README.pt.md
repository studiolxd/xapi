🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · Português · [Deutsch](README.de.md) · [Polski](README.pl.md)

# @studiolxd/xapi

Monorepo do `@studiolxd/xapi` — um cliente xAPI (Experience API / Tin Can) headless com um **núcleo agnóstico de framework** e adaptadores para **React, Vue, Angular, Svelte**, e JavaScript vanilla, que se comunica com qualquer LRS compatível com o padrão via xAPI 1.0.3 ou 2.0 — mais um aplicativo de demonstração interativo.

## Pacotes

| Pacote | Descrição | Docs |
|---------|-------------|------|
| [`@studiolxd/xapi`](./packages/xapi/) | Cliente xAPI 1.0.3 / 2.0 headless — núcleo agnóstico + adaptadores de framework + helpers de servidor | [README](./packages/xapi/README.md) |
| [`example`](./example/) | Aplicativo de demonstração interativo — mostra cada funcionalidade da biblioteca contra um LRS simulado | [README](./example/README.md) |

## Primeiros passos

```bash
npm install          # instala todos os workspaces a partir da raiz
npm run dev:lib      # compila a biblioteca em modo watch
npm run dev:example  # inicia o servidor de desenvolvimento do exemplo (http://localhost:5173)
```

Scripts adicionais disponíveis a partir da raiz:

- `npm run build` — compila a biblioteca
- `npm run test` — executa a suíte de testes da biblioteca

## Pontos de entrada

A biblioteca é um único pacote com exports por subpath — importe apenas o que você usa:

| Import | Para |
|--------|-----|
| `@studiolxd/xapi` | Núcleo agnóstico de framework + vanilla (`createXapiClient`) |
| `@studiolxd/xapi/react` | React (`XapiProvider`, `useXapiClient`, `useXapiStatus`) |
| `@studiolxd/xapi/vue` | Vue 3.3+ (`useXapiClient`) |
| `@studiolxd/xapi/angular` | Angular 17+ (`provideXapi`, `XAPI`) |
| `@studiolxd/xapi/svelte` | Svelte 4+ (`createXapiStore`) |
| `@studiolxd/xapi/server` | Helpers de protocolo para implementar um LRS |
| `window.Xapi` (CDN `<script>`) | HTML simples, sem bundler |

## Estrutura do projeto

```
xapi/
├── package.json          # raiz de npm workspaces (privado)
├── AGENTS.md              # guia para agentes de IA que trabalham neste repositório
├── PLAN.md                 # especificação de design / implementação
├── packages/
│   └── xapi/              # @studiolxd/xapi — publicado no npm
│       └── README.md      # documentação completa da biblioteca
├── example/                # demo interativa (não publicada)
│   └── README.md           # documentação da demo
└── tests/angular-smoke/    # fixture do smoke test AOT do Angular
```

## Publicação

Apenas `packages/xapi` é publicado no npm. O workspace `example` e a raiz são privados. Para publicar:

```bash
cd packages/xapi
npm publish
```

A publicação é manual, condicionada por `prepublishOnly` (typecheck + test + build) e pela autenticação do npm — não há um fluxo de release automatizado.

## Licença

MIT
