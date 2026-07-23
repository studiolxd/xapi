🌐 [English](README.md) · [Español](README.es.md) · [Français](README.fr.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Polski](README.pl.md)

# `@studiolxd/xapi` — Demo interactiva

Una aplicación de ejemplo interactiva y totalmente funcional que demuestra todas las
funcionalidades de la librería [`@studiolxd/xapi`](https://www.npmjs.com/package/@studiolxd/xapi)
— el núcleo agnóstico de framework, el adaptador `./react`, y las rutas de lanzamiento
(launch), vanilla y CDN.

Construida con **React 19 + TypeScript + Vite** (usando el adaptador `@studiolxd/xapi/react`).
Corre íntegramente en el navegador por defecto contra `createMemoryLrs()` — una implementación
xAPI en memoria — así que **no necesitas un LRS real** para probarla. Una pestaña
**Connection** también te permite apuntar la demo a cualquier LRS real (tu propio
[`studiolxd/lrs`](https://github.com/studiolxd/lrs), Veracity, SCORM Cloud, Learning Locker…)
con Basic auth.

---

## Cómo empezar

Desde la **raíz del repositorio** (la demo es un workspace de npm):

```bash
npm install
npm run dev:example
```

Abre `http://localhost:5173` en tu navegador.

---

## Qué demuestra esta demo

La cabecera tiene un **selector de versión xAPI** (1.0.3 / 2.0) y una **insignia mock / LRS
real**. Cambiar cualquiera de los dos remonta `XapiProvider` con un cliente nuevo — la
librería no tiene un método "reconfigurar", así que un cliente nuevo es la forma correcta de
apuntar a otro LRS o versión.

### 10 secciones de la demo

| Pestaña | Funcionalidades demostradas |
|-----|-----------------------|
| **Connection** | `XapiStatus` en vivo, cambio entre el LRS mock y uno real, `client.about()` |
| **Statement Builder** | `client.buildStatement()`, `VERBS`, `client.sendStatement()` — construye un statement desde actor/verbo/objeto/resultado y envíalo |
| **Query** | `client.getStatements(query)` con filtros, paginación con `client.getMoreStatements()` |
| **Voiding** | `client.voidStatement()`, `client.getVoidedStatement()` — los statements son inmutables, anularlos es la forma de retractarlos |
| **State** | `getState` / `setState` / `deleteState` / `getStateIds` — almacenamiento por actor y actividad |
| **Activity Profile** | `getActivityProfile` / `setActivityProfile` / `deleteActivityProfile` / `getActivityProfileIds` — almacenamiento compartido por actividad |
| **Agent Profile** | `getAgentProfile` / `setAgentProfile` / `deleteAgentProfile` / `getAgentProfileIds` — almacenamiento compartido por agente |
| **Launch** | `parseXapiLaunch()` — parseo de una URL de lanzamiento estilo TinCan/Rustici |
| **Vanilla / CDN** | `createXapiClient()` fuera de React, más el snippet IIFE/CDN de `window.Xapi` |
| **About & Versions** | Chuleta 1.0.3 vs 2.0, `client.about()` en vivo |

---

## Sobre el LRS mock

La app usa `createMemoryLrs()` de `@studiolxd/xapi` — una implementación en memoria del
protocolo xAPI (la misma contra la que corre la propia suite de tests de la librería). Se crea
una única vez a nivel de módulo, así que tus datos de demo sobreviven a los cambios de versión.

```tsx
// App.tsx
const memoryLrs = createMemoryLrs();

<XapiProvider
  key={`${version}-${connection.mode}-${connection.endpoint}`}
  options={{ endpoint: 'https://mock.lrs/xapi', version, fetch: memoryLrs.fetch }}
>
  {/* todos los componentes que llaman a useXapiClient() van aquí */}
</XapiProvider>
```

Usa la pestaña **Connection** para cambiar a un LRS real: introduce su endpoint y credenciales
Basic auth y pulsa **Connect**.

---

## Resumen de la librería

`@studiolxd/xapi` es un cliente xAPI (Experience API / Tin Can) agnóstico de framework: un
núcleo con adaptadores para React, Vue, Angular y Svelte, más un subpath `./server` con
helpers de protocolo para implementar un LRS. Esta demo usa el adaptador de React.

### Conceptos clave

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
  const client = useXapiClient();   // XapiClient estable
  const status = useXapiStatus();   // XapiStatus reactivo (re-renderiza en cada petición)
}
```

**2. Manejo de errores basado en Result**

Todo método de red devuelve `Promise<Result<T, XapiError>>` — sin excepciones lanzadas:

```tsx
const result = await client.sendStatement(statement);

if (result.ok) {
  console.log('guardado con id', result.value);
} else {
  console.error(`${result.error.kind}: ${result.error.message}`);
}
```

**3. Los statements se construyen, no se escriben a mano**

```tsx
const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,                     // o una IRI en string
  object: 'https://example.com/course/1',    // atajo para una Activity
  result: { success: true, score: { raw: 90, min: 0, max: 100 } },
});
```

`id` y `timestamp` se generan automáticamente si se omiten.

**4. Soporte dual de versión**

El mismo cliente habla xAPI 1.0.3 y 2.0 — elige con `createXapiClient({ version })`. Consulta
la pestaña **About & Versions** y
[`packages/xapi/docs/version-differences.md`](../packages/xapi/docs/version-differences.md)
para ver exactamente qué se abstrae.

---

## Estructura del proyecto

```
src/
├── main.tsx                       # Punto de entrada de Vite
├── App.tsx                        # Selector de versión/conexión + XapiProvider + navegación de pestañas
├── connection.ts                  # Tipo ConnectionConfig + valores por defecto
├── XapiConnectionContext.tsx      # Comparte el estado de conexión mock/real entre secciones
├── ResultView.tsx                 # Renderiza un Result<T, XapiError> como ok/error + JSON
├── App.css / index.css            # Sistema de diseño (reutilizado de la demo de @studiolxd/scorm)
└── sections/
    ├── ConnectionSection.tsx      # Estado en vivo, cambio mock/real, about()
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

## Stack de desarrollo

- **Build**: [Vite](https://vite.dev) 8 + `@vitejs/plugin-react`. El build de producción es
  `tsc -b && vite build` — comprobación de tipos y luego empaquetado.
- **Lenguaje**: TypeScript 5.9, modo estricto (`tsconfig.app.json`).
- **Linting**: ESLint 9 con configuración flat (`typescript-eslint`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`). Ejecuta con `npm run lint`.

### Scripts

| Script | Comando | Descripción |
|--------|---------|-------------|
| `npm run dev` | `vite` | Arranca el dev server en `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build` | Comprueba tipos + build de producción |
| `npm run lint` | `eslint .` | Lintea todos los `.ts` / `.tsx` |
| `npm run preview` | `vite preview` | Previsualiza el build de producción localmente |

Desde la raíz del repositorio: `npm run dev:example` ejecuta `npm run dev --workspace=example`.

---

## Licencia

MIT — ver [LICENSE](./LICENSE).
