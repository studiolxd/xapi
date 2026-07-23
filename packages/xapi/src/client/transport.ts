import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';
import type { XapiAuth } from '../types/options';
import type { XapiVersion } from '../types/common';
import type { Logger } from '../debug/logger';

/**
 * Everything the transport needs to talk to one LRS. Built once by
 * {@link createXapiClient} and threaded through every resource module.
 */
export interface TransportContext {
  /** Normalized base IRI, without a trailing slash. */
  endpoint: string;
  auth?: XapiAuth;
  version: XapiVersion;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  logger: Logger;
  /** Called before a request is sent — used to drive `XapiStatus.pending`. */
  onRequestStart: () => void;
  /** Called once a request settles, on ANY outcome — decrements `XapiStatus.pending`. */
  onRequestSettle: () => void;
  /**
   * Called by callers once they know the final business-level outcome of an operation —
   * drives `XapiStatus.lastError`. Pass `null` on success (including a "not found" that a
   * caller treats as a non-error, e.g. `getState`'s 404 → `ok(null)`), or the `XapiError`
   * otherwise. `rawRequest` calls this itself only for network/timeout failures, since it
   * cannot know whether a given HTTP status is a business-level error for the caller.
   */
  reportOutcome: (error: XapiError | null) => void;
}

/** A response that completed at the HTTP layer — status may be anything, including 4xx/5xx. */
export interface RawResponse {
  status: number;
  headers: Headers;
  text: string;
}

function buildAuthHeader(auth: XapiAuth | undefined): string | undefined {
  if (!auth) return undefined;
  if ('header' in auth) return auth.header;
  if ('token' in auth) return `Bearer ${auth.token}`;
  return `Basic ${btoa(`${auth.username}:${auth.password}`)}`;
}

function joinUrl(endpoint: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${endpoint}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Send a request and resolve to a {@link RawResponse} for ANY completed HTTP exchange —
 * including 4xx/5xx statuses, which callers inspect themselves (e.g. a 404 on a document
 * fetch is not a network failure). Only fails (`err`) on network errors or timeout.
 */
export async function rawRequest(
  ctx: TransportContext,
  path: string,
  init: RequestInit,
  operation: string,
): Promise<Result<RawResponse, XapiError>> {
  const url = joinUrl(ctx.endpoint, path);
  const headers = new Headers(init.headers);
  headers.set('X-Experience-API-Version', ctx.version);
  const authHeader = buildAuthHeader(ctx.auth);
  if (authHeader) headers.set('Authorization', authHeader);

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), ctx.timeoutMs);

  ctx.logger.debug(`${init.method ?? 'GET'} ${url}`);
  ctx.onRequestStart();

  try {
    const res = await ctx.fetchImpl(url, { ...init, headers, signal: controller.signal });
    const text = await res.text().catch(() => '');
    return ok({ status: res.status, headers: res.headers, text });
  } catch (exception) {
    const isAbort = exception instanceof Error && exception.name === 'AbortError';
    const error = new XapiError({
      kind: isAbort ? 'timeout' : 'network',
      operation,
      endpoint: ctx.endpoint,
      status: null,
      responseBody: null,
      issues: [],
      exception: exception instanceof Error ? exception : undefined,
    });
    ctx.reportOutcome(error);
    return err(error);
  } finally {
    clearTimeout(timeoutHandle);
    ctx.onRequestSettle();
  }
}

function truncate(text: string, max = 2048): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Send a request expecting success (2xx). Any other status is turned into an
 * `err(kind: 'http')`. Use {@link rawRequest} directly when a non-2xx status
 * (e.g. 404, 412) is a meaningful, non-error outcome.
 */
export async function request<T>(
  ctx: TransportContext,
  path: string,
  init: RequestInit,
  opts: { operation: string; parse?: 'json' | 'text' | 'none' } = { operation: 'request' },
): Promise<Result<T, XapiError>> {
  const raw = await rawRequest(ctx, path, init, opts.operation);
  if (!raw.ok) return raw;

  const { status, text } = raw.value;
  if (status < 200 || status >= 300) {
    const error = new XapiError({
      kind: 'http',
      operation: opts.operation,
      endpoint: ctx.endpoint,
      status,
      responseBody: truncate(text),
      issues: [],
    });
    ctx.reportOutcome(error);
    return err(error);
  }

  ctx.reportOutcome(null);
  const parse = opts.parse ?? 'json';
  if (parse === 'none' || text.length === 0) return ok(undefined as T);
  if (parse === 'text') return ok(text as unknown as T);
  return ok(JSON.parse(text) as T);
}
