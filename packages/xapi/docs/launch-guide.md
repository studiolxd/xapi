# Launch Guide

There are two ways content ends up talking to an LRS: **launched** by an LMS/platform that
decides the endpoint and credentials at runtime, or **pre-configured** with a known
endpoint baked in at build/deploy time. `@studiolxd/xapi` supports both.

## Launched content (TinCan/Rustici-style)

When an LMS or content player launches your course, it typically appends query params to
the launch URL carrying the LRS endpoint, credentials, actor, and registration:

```
https://your-content.example.com/index.html?endpoint=https%3A%2F%2Flrs.example.com%2Fxapi&auth=Basic%20dXNlcjpwYXNz&actor=%7B%22mbox%22%3A%22mailto%3Alearner%40example.com%22%7D&registration=abc-123
```

| Param | Meaning |
|-------|---------|
| `endpoint` | LRS base IRI. Required. |
| `auth` | Raw `Authorization` header value (e.g. `Basic ...` or `Bearer ...`). |
| `actor` | JSON-encoded `Agent`/`Group`. |
| `registration` | Registration UUID grouping statements from one attempt. |
| `activity_id` | The activity being launched. |

Parse it, or go straight to a working client:

```ts
import { parseXapiLaunch, createXapiClientFromLaunch } from '@studiolxd/xapi';

// Just the parsed params:
const launch = parseXapiLaunch(); // defaults to window.location.href
if (launch.ok) {
  const { endpoint, actor, registration, activityId } = launch.value;
}

// Parse + createXapiClient in one step:
const clientResult = createXapiClientFromLaunch();
if (clientResult.ok) {
  const client = clientResult.value;
  // client.buildStatement() already defaults actor/registration from the launch URL
  await client.sendStatement(client.buildStatement({ verb: '...', object: activityId }));
}
```

`createXapiClientFromLaunch(url?, extra?)` accepts an `extra` options object merged on top
of the launch-derived options — `extra` wins on any conflicting key (including
`endpoint`/`auth`), and `extra.defaults` is merged with, not replaced by, the launch's
`actor`/`registration`.

Both functions are SSR-safe: without an explicit `url`, they read `window.location.href`
and return `err(kind: 'usage')` — never throw — when `window` isn't available.

## Pre-configured content (CDN, bundler, known endpoint)

If your endpoint and credentials are already known at build time — a fixed corporate LRS,
a `studiolxd/lrs` deployment tied to your product — skip launch entirely:

```ts
import { createXapiClient } from '@studiolxd/xapi';

const client = createXapiClient({
  endpoint: 'https://lrs.example.com/xapi',
  auth: { username: 'key', password: 'secret' },
  defaults: { actor: { mbox: 'mailto:learner@example.com' } },
});
```

The same applies to the CDN/IIFE build — see the main [README](../README.md#other-frameworks)
for the `window.Xapi` snippet.

## Which to use

- **Launch** when the same content package is deployed across multiple LMSs/tenants and
  the endpoint/credentials vary per launch (the classic SCORM/xAPI content-package model).
- **Pre-configured** when you control the deployment and the LRS is fixed — most
  standalone web apps and internal tools fall here.
