import type { XapiError } from '../errors/xapi-error';
import type { Actor, Context } from './statement';
import type { XapiVersion } from './common';

/** How to authenticate against the LRS. */
export type XapiAuth =
  | { username: string; password: string }
  | { token: string }
  | { header: string };

/** Options accepted by {@link createXapiClient}. */
export interface XapiClientOptions {
  /** Base IRI of the LRS, with or without a trailing slash. */
  endpoint: string;
  auth?: XapiAuth;
  /** Protocol version to speak. Defaults to `'1.0.3'`, the most widely supported by commercial LRSs. */
  version?: XapiVersion;
  /** Merged into `buildStatement()`/`sendStatement()` inputs when the corresponding field is missing. */
  defaults?: {
    actor?: Actor;
    registration?: string;
    context?: Partial<Context>;
  };
  /** Inject a custom `fetch` implementation — used for tests, the mock LRS, or non-global-fetch environments. */
  fetch?: typeof fetch;
  /** Request timeout in milliseconds, enforced via `AbortController`. Defaults to `30000`. */
  timeoutMs?: number;
  /** Whether `set*` document methods manage ETags automatically. Defaults to `'auto'`. */
  concurrency?: 'auto' | 'off';
  /** Whether statements are validated before being sent. Defaults to `true`. */
  validate?: boolean;
  debug?: boolean;
}

/** A snapshot of a client's observable state. */
export interface XapiStatus {
  endpoint: string;
  version: XapiVersion;
  /** Number of requests currently in flight. */
  pending: number;
  /** The most recent network/HTTP error, cleared on the next successful request. */
  lastError: XapiError | null;
}
