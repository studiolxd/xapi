🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/xapi` — Interaktywne demo

Interaktywna, w pełni działająca aplikacja przykładowa, która demonstruje każdą funkcję
biblioteki [`@studiolxd/xapi`](https://www.npmjs.com/package/@studiolxd/xapi) — rdzeń
niezależny od frameworka, adapter `./react` oraz ścieżki launch, vanilla i CDN.

Zbudowana w oparciu o **React 19 + TypeScript + Vite** (przy użyciu adaptera
`@studiolxd/xapi/react`). Działa całkowicie w przeglądarce, domyślnie w oparciu o
`createMemoryLrs()` — implementację xAPI w pamięci — więc **żadne prawdziwe LRS nie jest
wymagane**, aby ją wypróbować. Zakładka **Connection** pozwala też skierować demo do
dowolnego prawdziwego LRS (własnego [`studiolxd/lrs`](https://github.com/studiolxd/lrs),
Veracity, SCORM Cloud, Learning Locker…) przez Basic auth.

---

## Jak zacząć

Z **katalogu głównego repozytorium** (demo jest workspace'em npm):

```bash
npm install
npm run dev:example
```

Otwórz `http://localhost:5173` w przeglądarce.

---

## Co pokazuje to demo

Nagłówek zawiera **przełącznik wersji xAPI** (1.0.3 / 2.0) oraz **odznakę mock / prawdziwe
LRS**. Przełączenie któregokolwiek z nich ponownie montuje `XapiProvider` z nowym klientem —
biblioteka nie ma metody „rekonfiguracji", więc nowy klient to właściwy sposób na wskazanie
innego LRS lub wersji.

### 10 sekcji demo

| Zakładka | Demonstrowane funkcje |
|-----|-----------------------|
| **Connection** | `XapiStatus` na żywo, przełączanie między mock LRS a prawdziwym, `client.about()` |
| **Statement Builder** | `client.buildStatement()`, `VERBS`, `client.sendStatement()` — zbuduj statement z actor/verb/object/result i wyślij go |
| **Query** | `client.getStatements(query)` z filtrami, paginacja przez `client.getMoreStatements()` |
| **Voiding** | `client.voidStatement()`, `client.getVoidedStatement()` — statements są niezmienne, unieważnienie to sposób na ich wycofanie |
| **State** | `getState` / `setState` / `deleteState` / `getStateIds` — przechowywanie per actor i per activity |
| **Activity Profile** | `getActivityProfile` / `setActivityProfile` / `deleteActivityProfile` / `getActivityProfileIds` — współdzielone przechowywanie per activity |
| **Agent Profile** | `getAgentProfile` / `setAgentProfile` / `deleteAgentProfile` / `getAgentProfileIds` — współdzielone przechowywanie per agent |
| **Launch** | `parseXapiLaunch()` — parsowanie adresu URL uruchomienia w stylu TinCan/Rustici |
| **Vanilla / CDN** | `createXapiClient()` poza Reactem, plus fragment kodu IIFE/CDN `window.Xapi` |
| **About & Versions** | Ściąga 1.0.3 vs 2.0, `client.about()` na żywo |

---

## O mock LRS

Aplikacja używa `createMemoryLrs()` z `@studiolxd/xapi` — implementacji protokołu xAPI w
pamięci (tej samej, na której działa własny zestaw testów biblioteki). Jest tworzona
jednorazowo na poziomie modułu, więc dane demo przetrwają przełączanie wersji.

```tsx
// App.tsx
const memoryLrs = createMemoryLrs();

<XapiProvider
  key={`${version}-${connection.mode}-${connection.endpoint}`}
  options={{ endpoint: 'https://mock.lrs/xapi', version, fetch: memoryLrs.fetch }}
>
  {/* wszystkie komponenty wywołujące useXapiClient() idą tutaj */}
</XapiProvider>
```

Użyj zakładki **Connection**, aby przełączyć się na prawdziwe LRS: wpisz jego endpoint i dane
uwierzytelniające Basic auth, a następnie kliknij **Connect**.

---

## Przegląd biblioteki

`@studiolxd/xapi` to niezależny od frameworka klient xAPI (Experience API / Tin Can): rdzeń z
adapterami dla React, Vue, Angular i Svelte, plus podścieżka `./server` z narzędziami
protokołu do implementacji LRS. To demo używa adaptera React.

### Kluczowe koncepcje

**1. Provider + Hooki**

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
  const client = useXapiClient();   // stabilny XapiClient
  const status = useXapiStatus();   // reaktywny XapiStatus (renderuje się ponownie przy każdym żądaniu)
}
```

**2. Obsługa błędów oparta na Result**

Każda metoda sieciowa zwraca `Promise<Result<T, XapiError>>` — bez rzucanych wyjątków:

```tsx
const result = await client.sendStatement(statement);

if (result.ok) {
  console.log('zapisano z id', result.value);
} else {
  console.error(`${result.error.kind}: ${result.error.message}`);
}
```

**3. Statements buduje się, nie pisze ręcznie**

```tsx
const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,                     // lub IRI jako string
  object: 'https://example.com/course/1',    // skrót dla Activity
  result: { success: true, score: { raw: 90, min: 0, max: 100 } },
});
```

`id` i `timestamp` są generowane automatycznie, jeśli zostaną pominięte.

**4. Wsparcie dwóch wersji**

Ten sam klient obsługuje zarówno xAPI 1.0.3, jak i 2.0 — wybierz przez
`createXapiClient({ version })`. Zobacz zakładkę **About & Versions** oraz
[`packages/xapi/docs/version-differences.md`](../packages/xapi/docs/version-differences.md),
aby poznać dokładnie, co jest abstrahowane.

---

## Struktura projektu

```
src/
├── main.tsx                       # Punkt wejścia Vite
├── App.tsx                        # Przełącznik wersji/połączenia + XapiProvider + nawigacja zakładek
├── connection.ts                  # Typ ConnectionConfig + wartości domyślne
├── XapiConnectionContext.tsx      # Współdzieli stan połączenia mock/prawdziwe między sekcjami
├── ResultView.tsx                 # Renderuje Result<T, XapiError> jako ok/error + JSON
├── App.css / index.css            # System designu (ponownie użyty z demo @studiolxd/scorm)
└── sections/
    ├── ConnectionSection.tsx      # Status na żywo, przełącznik mock/prawdziwe, about()
    ├── StatementBuilderSection.tsx
    ├── QuerySection.tsx
    ├── VoidingSection.tsx
    ├── StateSection.tsx
    ├── ActivityProfileSection.tsx
    ├── AgentProfileSection.tsx
    ├── LaunchSection.tsx
    ├── PlatformsSection.tsx       # createXapiClient() + fragment CDN window.Xapi
    └── AboutSection.tsx
```

---

## Stos technologiczny

- **Build**: [Vite](https://vite.dev) 8 + `@vitejs/plugin-react`. Build produkcyjny to
  `tsc -b && vite build` — najpierw sprawdzanie typów, potem bundlowanie.
- **Język**: TypeScript 5.9, tryb strict (`tsconfig.app.json`).
- **Linting**: ESLint 9 w konfiguracji flat (`typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`). Uruchom przez `npm run lint`.

### Skrypty

| Skrypt | Polecenie | Opis |
|--------|---------|-------------|
| `npm run dev` | `vite` | Uruchamia serwer dev pod `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Sprawdzanie typów + build produkcyjny |
| `npm run lint` | `eslint .` | Lintuje wszystkie pliki `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Podgląd builda produkcyjnego lokalnie |

Z katalogu głównego repozytorium: `npm run dev:example` uruchamia
`npm run dev --workspace=example`.

---

## Licencja

MIT — zobacz [LICENSE](./LICENSE).
