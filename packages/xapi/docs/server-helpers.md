# Server Helpers Guide

`@studiolxd/xapi/server` is for teams **implementing** an LRS — it does not include
routing, persistence, or auth (that's your LRS's job); it covers the protocol-level logic
every conformant LRS needs and that would otherwise be duplicated per implementation.

## Constraint: Web APIs only

Every helper in `./server` is built on `Request`, `Response`, `Headers`, `crypto.subtle`,
and `Uint8Array` — no `node:*` imports, no DOM. This means it runs unmodified in:

- Next.js (and other framework) Route Handlers
- Cloudflare Workers, Deno Deploy, Vercel Edge Functions
- Plain Node.js ≥18 (`Request`/`Response`/`crypto.subtle` are globals since Node 18)

## What each helper resolves

| Export | Resolves |
|--------|----------|
| `validateStatement(statement, { version })` | Structural validation — actor has exactly one IFI, verb/object IRIs are well-formed, `id` is a UUID, `timestamp` is ISO 8601. Shared with the client, so "what the client would refuse to send" and "what the server should refuse to accept" stay in sync. |
| `statementsEquivalent(a, b)` | Whether two statements are equivalent for idempotency purposes — a POST/PUT reusing an existing `id` must succeed without duplicating if equivalent, and fail with 409 if not. |
| `applyFormat(statement, format, lang?)` | Projects a statement per `GET /statements?format=`: `'exact'` (unmodified), `'ids'` (strip to identifiers only), `'canonical'` (collapse language maps to one entry). |
| `buildMultipartBody` / `parseMultipartBody` | Encode/decode the `multipart/mixed` body xAPI uses for statements with attachments (not `multipart/form-data`). |
| `etagFor(content)` | SHA-1-based ETag for a document's content, via `crypto.subtle`. |
| `checkConditionalHeaders(req, currentEtag)` | `If-Match`/`If-None-Match` semantics for the Document APIs — returns `err` with the right 409/412 status baked into `XapiError.status`. |
| `negotiateVersion(req)` | Validates and normalizes the incoming `X-Experience-API-Version` header. |
| `isVoidingStatement` / `voidingTarget` | Detects a voiding statement and extracts the id it targets. |
| `verifySignedStatement(jws, opts)` | Verifies a compact JWS (RS256/ES256) attached as a signed-statement attachment. |

## Minimal example — a `/statements` POST handler

```ts
import {
  negotiateVersion,
  validateStatement,
  statementsEquivalent,
  isVoidingStatement,
} from '@studiolxd/xapi/server';

export async function POST(req: Request) {
  const version = negotiateVersion(req);
  if (!version.ok) {
    return Response.json({ error: version.error.message }, { status: version.error.status ?? 400 });
  }

  const body = await req.json();
  const statement = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...body };

  const validation = validateStatement(statement, { version: version.value });
  if (!validation.ok) {
    return Response.json({ issues: validation.error.issues }, { status: 400 });
  }

  const existing = await store.getStatement(statement.id);
  if (existing && !statementsEquivalent(existing, statement)) {
    return new Response(null, { status: 409 });
  }

  if (isVoidingStatement(statement)) {
    // mark the target as voided instead of a plain insert — see voidingTarget()
  }

  await store.put(statement);
  return Response.json([statement.id], { status: 200 });
}
```

## A minimal document `PUT` handler (State API)

```ts
import { checkConditionalHeaders, etagFor } from '@studiolxd/xapi/server';

export async function PUT(req: Request) {
  const activityId = new URL(req.url).searchParams.get('activityId')!;
  const stateId = new URL(req.url).searchParams.get('stateId')!;
  const key = `${activityId}:${stateId}`;

  const existing = await store.get(key);
  const currentEtag = existing ? await etagFor(existing.content) : null;

  const check = checkConditionalHeaders(req, currentEtag);
  if (!check.ok) return new Response(null, { status: check.error.status! });

  const body = await req.text();
  await store.put(key, body);
  return new Response(null, { status: 204 });
}
```

## Not included on purpose

- **Routing** — map these onto your framework's URL scheme however fits.
- **Persistence** — bring your own database/storage.
- **Authentication/authorization** — `client_id`/`client_secret`, API keys, scopes: all
  application-specific, kept out of a protocol-level library.
