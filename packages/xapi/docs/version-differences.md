# xAPI 1.0.3 vs 2.0 — what this client abstracts

`@studiolxd/xapi` supports both xAPI 1.0.3 and xAPI 2.0 (IEEE 9274.1.1) through a single
`createXapiClient({ version })` option. All version-specific behavior is concentrated in
`src/internal/version-adapter.ts` — the rest of the codebase works with one internal shape
(based on 1.0.3, the more widely deployed format) and the adapter translates at the network
boundary.

| Behavior | xAPI 1.0.3 | xAPI 2.0 |
|---|---|---|
| `X-Experience-API-Version` header | `1.0`, `1.0.0`, `1.0.1`, `1.0.2` and `1.0.3` are all accepted (backward-compat requirement of the 1.0.x line) and normalized to `1.0.3` | Only `2.0` is accepted |
| `context.contextAgents` / `context.contextGroups` | Not part of the spec — stripped from outgoing statements by `normalizeStatementForVersion` before the request is sent | Supported as declared |
| ETags on State / Activity Profile / Agent Profile documents | Recommended (`concurrency: 'auto'` still manages them, but a non-conformant 1.0.3 LRS that ignores conditional headers is more common) | Required by conformant implementations — `concurrency: 'off'` is not recommended against a 2.0 LRS |
| `timestamp` / `stored` format | ISO 8601, generally permissive about which valid variant is used | Restricted to a stricter ISO 8601 subset by some 2.0 test suites; this client always emits `Date.prototype.toISOString()` output, which satisfies both |
| Statement validation (`validateStatement`) | Same structural rules (actor IFI, verb/object IRIs, UUID `id`, ISO 8601 `timestamp`) applied for both versions today — no additional 2.0-only structural checks are enforced yet | Same as 1.0.3 (see limitation below) |

## Known limitation

`validateStatement` does not yet enforce version-specific structural differences beyond
what's listed above (e.g. it does not reject `contextAgents`/`contextGroups` on a `'1.0.3'`
statement before sending — the client normalizes them away instead of failing validation).
`opts.version` is threaded through the validator's signature already so this can be tightened
without a breaking API change.
