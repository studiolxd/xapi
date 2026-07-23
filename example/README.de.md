🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/xapi` — Interaktive Demo

Eine interaktive, voll funktionsfähige Beispielanwendung, die jede Funktion der Bibliothek
[`@studiolxd/xapi`](https://www.npmjs.com/package/@studiolxd/xapi) demonstriert — den
framework-agnostischen Kern, den `./react`-Adapter sowie die Launch-, Vanilla- und
CDN-Pfade.

Gebaut mit **React 19 + TypeScript + Vite** (über den `@studiolxd/xapi/react`-Adapter). Läuft
standardmäßig vollständig im Browser gegen `createMemoryLrs()` — eine In-Memory-Implementierung
von xAPI — daher ist **kein echtes LRS erforderlich**, um sie auszuprobieren. Ein
**Connection**-Tab erlaubt es außerdem, die Demo mit jedem echten LRS zu verbinden (Ihr
eigenes [`studiolxd/lrs`](https://github.com/studiolxd/lrs), Veracity, SCORM Cloud, Learning
Locker…) via Basic Auth.

---

## Erste Schritte

Vom **Repository-Root** aus (die Demo ist ein npm-Workspace):

```bash
npm install
npm run dev:example
```

Öffnen Sie `http://localhost:5173` im Browser.

---

## Was diese Demo zeigt

Der Header enthält einen **xAPI-Versionsschalter** (1.0.3 / 2.0) und ein **Mock-/Echtes-LRS-
Badge**. Das Umschalten eines der beiden remountet `XapiProvider` mit einem neuen Client — die
Bibliothek hat keine "Neukonfigurieren"-Methode, daher ist ein neuer Client der richtige Weg,
um auf ein anderes LRS oder eine andere Version zu zeigen.

### 10 Demo-Abschnitte

| Tab | Demonstrierte Funktionen |
|-----|-----------------------|
| **Connection** | Live-`XapiStatus`, Umschalten zwischen Mock-LRS und echtem LRS, `client.about()` |
| **Statement Builder** | `client.buildStatement()`, `VERBS`, `client.sendStatement()` — ein Statement aus Actor/Verb/Object/Result erstellen und senden |
| **Query** | `client.getStatements(query)` mit Filtern, Paginierung über `client.getMoreStatements()` |
| **Voiding** | `client.voidStatement()`, `client.getVoidedStatement()` — Statements sind unveränderlich, Voiding ist der Weg, eines zurückzuziehen |
| **State** | `getState` / `setState` / `deleteState` / `getStateIds` — Speicherung pro Actor und Activity |
| **Activity Profile** | `getActivityProfile` / `setActivityProfile` / `deleteActivityProfile` / `getActivityProfileIds` — gemeinsame Speicherung pro Activity |
| **Agent Profile** | `getAgentProfile` / `setAgentProfile` / `deleteAgentProfile` / `getAgentProfileIds` — gemeinsame Speicherung pro Agent |
| **Launch** | `parseXapiLaunch()` — Parsen einer TinCan/Rustici-artigen Launch-URL |
| **Vanilla / CDN** | `createXapiClient()` außerhalb von React, plus das `window.Xapi`-IIFE/CDN-Snippet |
| **About & Versions** | Spickzettel 1.0.3 vs. 2.0, Live-`client.about()` |

---

## Über das Mock-LRS

Die App verwendet `createMemoryLrs()` aus `@studiolxd/xapi` — eine In-Memory-Implementierung
des xAPI-Protokolls (dieselbe, gegen die auch die Testsuite der Bibliothek läuft). Sie wird
einmalig auf Modulebene erstellt, sodass Ihre Demo-Daten Versionswechsel überstehen.

```tsx
// App.tsx
const memoryLrs = createMemoryLrs();

<XapiProvider
  key={`${version}-${connection.mode}-${connection.endpoint}`}
  options={{ endpoint: 'https://mock.lrs/xapi', version, fetch: memoryLrs.fetch }}
>
  {/* alle Komponenten, die useXapiClient() aufrufen, kommen hierhin */}
</XapiProvider>
```

Nutzen Sie den **Connection**-Tab, um zu einem echten LRS zu wechseln: Endpoint und
Basic-Auth-Zugangsdaten eingeben und auf **Connect** klicken.

---

## Bibliotheksübersicht

`@studiolxd/xapi` ist ein framework-agnostischer xAPI-Client (Experience API / Tin Can): ein
Kern mit Adaptern für React, Vue, Angular und Svelte, plus ein `./server`-Subpath mit
Protokoll-Helfern zur Implementierung eines LRS. Diese Demo verwendet den React-Adapter.

### Kernkonzepte

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
  const client = useXapiClient();   // stabiler XapiClient
  const status = useXapiStatus();   // reaktiver XapiStatus (rendert bei jeder Anfrage neu)
}
```

**2. Result-basierte Fehlerbehandlung**

Jede Netzwerkmethode liefert `Promise<Result<T, XapiError>>` — keine geworfenen Exceptions:

```tsx
const result = await client.sendStatement(statement);

if (result.ok) {
  console.log('gespeichert mit id', result.value);
} else {
  console.error(`${result.error.kind}: ${result.error.message}`);
}
```

**3. Statements werden gebaut, nicht von Hand geschrieben**

```tsx
const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,                     // oder eine IRI als String
  object: 'https://example.com/course/1',    // Kurzform für eine Activity
  result: { success: true, score: { raw: 90, min: 0, max: 100 } },
});
```

`id` und `timestamp` werden automatisch generiert, falls weggelassen.

**4. Duale Versionsunterstützung**

Derselbe Client spricht sowohl xAPI 1.0.3 als auch 2.0 — wählen Sie mit
`createXapiClient({ version })`. Siehe den **About & Versions**-Tab und
[`packages/xapi/docs/version-differences.md`](../packages/xapi/docs/version-differences.md)
für die genauen Details der Abstraktion.

---

## Projektstruktur

```
src/
├── main.tsx                       # Vite-Einstiegspunkt
├── App.tsx                        # Versions-/Verbindungsschalter + XapiProvider + Tab-Navigation
├── connection.ts                  # ConnectionConfig-Typ + Standardwerte
├── XapiConnectionContext.tsx      # Teilt den Mock-/Echt-Verbindungsstatus zwischen den Abschnitten
├── ResultView.tsx                 # Rendert ein Result<T, XapiError> als ok/error + JSON
├── App.css / index.css            # Designsystem (wiederverwendet aus der @studiolxd/scorm-Demo)
└── sections/
    ├── ConnectionSection.tsx      # Live-Status, Mock-/Echt-Umschaltung, about()
    ├── StatementBuilderSection.tsx
    ├── QuerySection.tsx
    ├── VoidingSection.tsx
    ├── StateSection.tsx
    ├── ActivityProfileSection.tsx
    ├── AgentProfileSection.tsx
    ├── LaunchSection.tsx
    ├── PlatformsSection.tsx       # createXapiClient() + CDN-Snippet von window.Xapi
    └── AboutSection.tsx
```

---

## Entwicklungs-Stack

- **Build**: [Vite](https://vite.dev) 8 + `@vitejs/plugin-react`. Der Produktions-Build ist
  `tsc -b && vite build` — erst Typprüfung, dann Bundling.
- **Sprache**: TypeScript 5.9, Strict-Modus (`tsconfig.app.json`).
- **Linting**: ESLint 9 mit Flat Config (`typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`). Ausführen mit `npm run lint`.

### Scripts

| Script | Befehl | Beschreibung |
|--------|---------|-------------|
| `npm run dev` | `vite` | Startet den Dev-Server unter `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Typprüfung + Produktions-Bundle |
| `npm run lint` | `eslint .` | Lintet alle `.ts` / `.tsx`-Dateien |
| `npm run preview` | `vite preview` | Zeigt den Produktions-Build lokal in der Vorschau an |

Vom Repository-Root aus: `npm run dev:example` führt `npm run dev --workspace=example` aus.

---

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
