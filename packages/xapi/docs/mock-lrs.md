# Mock LRS Guide

`createMemoryLrs()` implements a standards-conformant LRS entirely in memory, exposed as
a `fetch`-compatible function. It backs the library's own test suite (122 tests) and the
example app's default "Mock LRS" mode — no network, no real LRS, deterministic.

## Usage

```ts
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

const lrs = createMemoryLrs();
const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

await client.sendStatement(client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: 'http://adlnet.gov/expapi/verbs/completed',
  object: 'https://example.com/course/1',
}));
```

The `endpoint` you pass is arbitrary — the mock routes on the request's pathname, not its
origin, so any placeholder host works.

## What it implements

- **Statements**: `POST`/`GET /statements` with idempotent writes (resending the same `id`
  with different content returns 409), voiding (a `voided` statement hides its target from
  normal reads but keeps it retrievable via `voidedStatementId`), and cursor-based
  pagination (`more`).
- **Documents**: `PUT`/`POST`/`GET`/`DELETE` for `/activities/state`, `/activities/profile`,
  and `/agents/profile`, with `If-Match`/`If-None-Match` conditional-request support (a
  content fingerprint stands in for a real ETag).
- **Activities & Agents**: `GET /activities`, `GET /agents`.
- **About**: `GET /about`.

## Inspecting state in tests

```ts
const lrs = createMemoryLrs();
// ... exercise the client ...

console.log(lrs.store.statements.size);
console.log(lrs.store.state.size);

lrs.reset(); // clears everything between test cases
```

`lrs.store` exposes the internal `Map`s directly — reach for it when you want to assert on
what was persisted without going back through the client's read methods.

## Limitations

- **In-memory only** — state does not persist across process restarts and is not shared
  across workers/tabs. Each `createMemoryLrs()` call is an isolated instance.
- **Not multi-process** — it's a drop-in `fetch` for a single test/demo process, not a
  substitute for a real LRS in integration tests that need process isolation.
- **Simplified ETag** — uses a fast, deterministic hash (FNV-1a) rather than the SHA-1
  used by `./server`'s `etagFor` — sufficient for conditional-request testing, not meant
  to be compared against ETags from a real LRS.
