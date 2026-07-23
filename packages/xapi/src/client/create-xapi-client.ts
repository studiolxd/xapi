import type { Actor, Context, Statement } from '../types/statement';
import type { XapiClientOptions, XapiStatus } from '../types/options';
import type { XapiVersion } from '../types/common';
import { buildStatement } from '../build/build-statement';
import type { BuildStatementInput } from '../build/build-statement';
import { createLogger } from '../debug/logger';
import type { TransportContext } from './transport';
import { createStatementsResource } from './statements';
import type { StatementsResource } from './statements';
import { createDocumentsResource } from './documents';
import type { DocumentsResource } from './documents';
import { createActivitiesResource } from './activities';
import type { ActivitiesResource } from './activities';
import { createAboutResource } from './about';
import type { AboutResourceClient } from './about';

export type XapiChangeListener = (status: XapiStatus) => void;

/**
 * Input to `client.buildStatement()`. Same as {@link BuildStatementInput}, but `actor`
 * is optional when the client was created with `options.defaults.actor`.
 */
export type ClientBuildStatementInput = Omit<BuildStatementInput, 'actor'> & { actor?: Actor };

/** A client bound to one LRS. See {@link createXapiClient}. */
export interface XapiClient extends StatementsResource, DocumentsResource, ActivitiesResource, AboutResourceClient {
  /** Build a well-formed {@link Statement}, filling in `options.defaults` for anything omitted. */
  buildStatement(input: ClientBuildStatementInput): Statement;
  /** A stable snapshot of the client's observable state — same reference between `'change'` events. */
  readonly status: XapiStatus;
  /** Subscribe to status changes. Returns an unsubscribe function. */
  on(event: 'change', cb: XapiChangeListener): () => void;
  off(event: 'change', cb: XapiChangeListener): void;
  /** Release all listeners. The client remains otherwise usable. */
  destroy(): void;
}

function normalizeEndpoint(endpoint: string): string {
  return endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
}

/**
 * Create an xAPI client bound to one LRS. Works against any standards-compliant LRS
 * (xAPI 1.0.3 or 2.0) — pass `fetch: memoryLrs.fetch` (see `createMemoryLrs`) to run
 * entirely in memory, with no network.
 *
 * @example
 * ```ts
 * const client = createXapiClient({
 *   endpoint: 'https://lrs.example.com/xapi',
 *   auth: { username: 'key', password: 'secret' },
 *   defaults: { actor: { mbox: 'mailto:learner@example.com' } },
 * });
 *
 * const result = await client.sendStatement(
 *   client.buildStatement({ verb: 'http://adlnet.gov/expapi/verbs/completed', object: 'https://example.com/course/1' }),
 * );
 * if (result.ok) console.log('sent', result.value);
 * ```
 */
export function createXapiClient(options: XapiClientOptions): XapiClient {
  const endpoint = normalizeEndpoint(options.endpoint);
  const version: XapiVersion = options.version ?? '1.0.3';
  const validate = options.validate ?? true;
  const concurrency = options.concurrency ?? 'auto';
  const timeoutMs = options.timeoutMs ?? 30000;
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const logger = createLogger(options.debug ?? false);
  const defaults = options.defaults;

  const listeners = new Set<XapiChangeListener>();
  let status: XapiStatus = { endpoint, version, pending: 0, lastError: null };

  function setStatus(patch: Partial<XapiStatus>): void {
    status = { ...status, ...patch };
    for (const listener of listeners) listener(status);
  }

  const ctx: TransportContext = {
    endpoint,
    auth: options.auth,
    version,
    fetchImpl,
    timeoutMs,
    logger,
    onRequestStart: () => setStatus({ pending: status.pending + 1 }),
    onRequestSettle: () => setStatus({ pending: Math.max(0, status.pending - 1) }),
    reportOutcome: (error) => setStatus({ lastError: error }),
  };

  const statements = createStatementsResource(ctx, { validate, defaultActor: defaults?.actor });
  const documents = createDocumentsResource(ctx, concurrency);
  const activities = createActivitiesResource(ctx);
  const about = createAboutResource(ctx);

  /**
   * Missing `actor` with no `options.defaults.actor` configured is a caller bug, not a
   * runtime/network failure — unlike the rest of the public API, this throws rather than
   * returning a `Result`, since `buildStatement` is a synchronous, non-`Result` helper.
   */
  function buildStatementWithDefaults(input: ClientBuildStatementInput): Statement {
    const actor = input.actor ?? defaults?.actor;
    if (!actor) {
      throw new Error('client.buildStatement: no actor was provided and no options.defaults.actor is configured');
    }

    const registration = input.context?.registration ?? defaults?.registration;
    const hasContext = Boolean(input.context || defaults?.context || registration);
    const context: Context | undefined = hasContext
      ? { ...defaults?.context, ...input.context, ...(registration ? { registration } : {}) }
      : undefined;

    return buildStatement({ ...input, actor, context });
  }

  return {
    ...statements,
    ...documents,
    ...activities,
    ...about,
    buildStatement: buildStatementWithDefaults,
    get status() {
      return status;
    },
    on(_event, cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    off(_event, cb) {
      listeners.delete(cb);
    },
    destroy() {
      listeners.clear();
    },
  };
}
