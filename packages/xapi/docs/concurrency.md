# Document Concurrency (ETags)

The State, Activity Profile, and Agent Profile document APIs support conditional writes
via `If-Match`/`If-None-Match`, per the xAPI spec. `createXapiClient({ concurrency })`
controls how the **client** manages this automatically; `@studiolxd/xapi/server`'s
`checkConditionalHeaders` implements the matching **server**-side semantics for anyone
implementing an LRS.

## Client behavior (`concurrency` option)

| `concurrency` | `set*` on first write | On a `412 Precondition Failed` |
|---|---|---|
| `'auto'` (default) | Sends `If-None-Match: *` (only succeed if the document doesn't exist yet) | Retries **once**: `GET`s the current ETag, then retries the write with `If-Match: <etag>` |
| `'off'` | No conditional headers, unless `opts.etag` is passed explicitly | No retry — the `412` is returned to the caller as `err` |

Pass `opts.etag` on any `set*` call to take manual control — the client sends
`If-Match: <opts.etag>` and never applies the `'auto'` heuristics, regardless of the
client-level `concurrency` setting:

```ts
const doc = await client.getState(activityId, stateId);
if (doc.ok && doc.value) {
  await client.setState(activityId, stateId, newValue, { etag: doc.value.etag! });
}
```

`concurrency: 'off'` exists because some non-conformant 1.0.3 LRSs reject conditional
headers outright — see [xAPI 1.0.3 vs 2.0](./version-differences.md). It is not
recommended against a 2.0 LRS, where conditional-request support is a conformance
requirement.

## Server-side matrix (`checkConditionalHeaders`)

`checkConditionalHeaders(req, currentEtag)` from `./server` implements this matrix:

| Current document | `If-Match` | `If-None-Match` | Result |
|---|---|---|---|
| Doesn't exist | (any) | absent | `ok` — first write allowed |
| Doesn't exist | present | — | `412` — nothing to match |
| Exists | absent | absent | `409` — ambiguous intent, resend with a conditional header |
| Exists | matches current ETag | — | `ok` |
| Exists | doesn't match | — | `412` |
| Exists | — | `*` | `412` — document already exists |

This is what the client's `'auto'` mode is designed against: it always sends
`If-None-Match: *` on a first write (expecting `412` if a document already exists, then
retrying with the real ETag) rather than sending no header at all, which a conformant LRS
would reject with `409`.
