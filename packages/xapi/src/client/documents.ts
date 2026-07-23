import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';
import type { Agent } from '../types/statement';
import type { XapiDocument, SetDocOpts } from '../types/documents';
import { rawRequest, request } from './transport';
import type { TransportContext } from './transport';

/** Extra scoping accepted by the `state*` methods, beyond the positional `activityId`/`stateId`. */
export interface StateOpts {
  agent?: Agent;
  registration?: string;
}

/** {@link StateOpts} plus {@link SetDocOpts}, accepted by `setState`. */
export type SetStateOpts = StateOpts & SetDocOpts;

/** The State, Activity Profile and Agent Profile document resources of an {@link XapiClient}. */
export interface DocumentsResource {
  getState(activityId: string, stateId: string, opts?: StateOpts): Promise<Result<XapiDocument | null, XapiError>>;
  setState(activityId: string, stateId: string, value: unknown, opts?: SetStateOpts): Promise<Result<true, XapiError>>;
  deleteState(activityId: string, stateId: string, opts?: StateOpts): Promise<Result<true, XapiError>>;
  getStateIds(activityId: string, opts?: StateOpts & { since?: string }): Promise<Result<string[], XapiError>>;

  getActivityProfile(activityId: string, profileId: string): Promise<Result<XapiDocument | null, XapiError>>;
  setActivityProfile(activityId: string, profileId: string, value: unknown, opts?: SetDocOpts): Promise<Result<true, XapiError>>;
  deleteActivityProfile(activityId: string, profileId: string): Promise<Result<true, XapiError>>;
  getActivityProfileIds(activityId: string, opts?: { since?: string }): Promise<Result<string[], XapiError>>;

  getAgentProfile(agent: Agent, profileId: string): Promise<Result<XapiDocument | null, XapiError>>;
  setAgentProfile(agent: Agent, profileId: string, value: unknown, opts?: SetDocOpts): Promise<Result<true, XapiError>>;
  deleteAgentProfile(agent: Agent, profileId: string): Promise<Result<true, XapiError>>;
  getAgentProfileIds(agent: Agent, opts?: { since?: string }): Promise<Result<string[], XapiError>>;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) usp.set(key, value);
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

async function getDocument(ctx: TransportContext, path: string, operation: string): Promise<Result<XapiDocument | null, XapiError>> {
  const raw = await rawRequest(ctx, path, { method: 'GET' }, operation);
  if (!raw.ok) return raw;

  const { status, headers, text } = raw.value;
  if (status === 404) {
    ctx.reportOutcome(null);
    return ok(null);
  }
  if (status < 200 || status >= 300) {
    const error = new XapiError({ kind: 'http', operation, endpoint: ctx.endpoint, status, responseBody: text.slice(0, 2048), issues: [] });
    ctx.reportOutcome(error);
    return err(error);
  }

  ctx.reportOutcome(null);
  const contentType = headers.get('Content-Type') ?? 'application/octet-stream';
  const etag = headers.get('ETag');
  let content: unknown = text;
  if (contentType.includes('json')) {
    try {
      content = text.length > 0 ? JSON.parse(text) : null;
    } catch {
      content = text;
    }
  }
  return ok({ content, contentType, etag, raw: text });
}

/**
 * Write a document, managing ETag concurrency per `concurrency` (see {@link XapiClientOptions}).
 * `'auto'`: sends `If-None-Match: *` on first write; if the LRS reports a 412 (document
 * already exists), retries once with `If-Match` on the current ETag. `'off'`: no
 * conditional headers unless `opts.etag` is set explicitly.
 */
async function setDocument(
  ctx: TransportContext,
  path: string,
  value: unknown,
  opts: SetDocOpts | undefined,
  concurrency: 'auto' | 'off',
  operation: string,
): Promise<Result<true, XapiError>> {
  const contentType = opts?.contentType ?? 'application/json';
  const body = contentType.includes('json') ? JSON.stringify(value) : String(value);

  const baseHeaders: Record<string, string> = { 'Content-Type': contentType };
  if (opts?.etag) {
    baseHeaders['If-Match'] = opts.etag;
  } else if (concurrency === 'auto') {
    baseHeaders['If-None-Match'] = '*';
  }

  let raw = await rawRequest(ctx, path, { method: 'PUT', headers: baseHeaders, body }, operation);
  if (!raw.ok) return raw;

  if (raw.value.status === 412 && concurrency === 'auto' && !opts?.etag) {
    const current = await rawRequest(ctx, path, { method: 'GET' }, operation);
    const currentEtag = current.ok ? current.value.headers.get('ETag') : null;
    if (current.ok && current.value.status === 200 && currentEtag) {
      raw = await rawRequest(
        ctx,
        path,
        { method: 'PUT', headers: { 'Content-Type': contentType, 'If-Match': currentEtag }, body },
        operation,
      );
      if (!raw.ok) return raw;
    }
  }

  if (raw.value.status < 200 || raw.value.status >= 300) {
    const error = new XapiError({
      kind: 'http',
      operation,
      endpoint: ctx.endpoint,
      status: raw.value.status,
      responseBody: raw.value.text.slice(0, 2048),
      issues: [],
    });
    ctx.reportOutcome(error);
    return err(error);
  }
  ctx.reportOutcome(null);
  return ok(true);
}

async function deleteDocument(ctx: TransportContext, path: string, operation: string): Promise<Result<true, XapiError>> {
  const raw = await rawRequest(ctx, path, { method: 'DELETE' }, operation);
  if (!raw.ok) return raw;
  if (raw.value.status < 200 || raw.value.status >= 300) {
    const error = new XapiError({
      kind: 'http',
      operation,
      endpoint: ctx.endpoint,
      status: raw.value.status,
      responseBody: raw.value.text.slice(0, 2048),
      issues: [],
    });
    ctx.reportOutcome(error);
    return err(error);
  }
  ctx.reportOutcome(null);
  return ok(true);
}

function getIds(ctx: TransportContext, path: string, operation: string): Promise<Result<string[], XapiError>> {
  return request<string[]>(ctx, path, { method: 'GET' }, { operation });
}

/** Create the State / Activity Profile / Agent Profile resources, backed by `ctx`. */
export function createDocumentsResource(ctx: TransportContext, concurrency: 'auto' | 'off'): DocumentsResource {
  function stateQuery(activityId: string, stateId: string | undefined, opts: StateOpts | undefined, since?: string): string {
    return buildQuery({
      activityId,
      stateId,
      agent: opts?.agent ? JSON.stringify(opts.agent) : undefined,
      registration: opts?.registration,
      since,
    });
  }

  function activityProfileQuery(activityId: string, profileId: string | undefined, since?: string): string {
    return buildQuery({ activityId, profileId, since });
  }

  function agentProfileQuery(agent: Agent, profileId: string | undefined, since?: string): string {
    return buildQuery({ agent: JSON.stringify(agent), profileId, since });
  }

  return {
    getState: (activityId, stateId, opts) => getDocument(ctx, `/activities/state${stateQuery(activityId, stateId, opts)}`, 'getState'),
    setState: (activityId, stateId, value, opts) =>
      setDocument(ctx, `/activities/state${stateQuery(activityId, stateId, opts)}`, value, opts, concurrency, 'setState'),
    deleteState: (activityId, stateId, opts) =>
      deleteDocument(ctx, `/activities/state${stateQuery(activityId, stateId, opts)}`, 'deleteState'),
    getStateIds: (activityId, opts) =>
      getIds(ctx, `/activities/state${stateQuery(activityId, undefined, opts, opts?.since)}`, 'getStateIds'),

    getActivityProfile: (activityId, profileId) =>
      getDocument(ctx, `/activities/profile${activityProfileQuery(activityId, profileId)}`, 'getActivityProfile'),
    setActivityProfile: (activityId, profileId, value, opts) =>
      setDocument(ctx, `/activities/profile${activityProfileQuery(activityId, profileId)}`, value, opts, concurrency, 'setActivityProfile'),
    deleteActivityProfile: (activityId, profileId) =>
      deleteDocument(ctx, `/activities/profile${activityProfileQuery(activityId, profileId)}`, 'deleteActivityProfile'),
    getActivityProfileIds: (activityId, opts) =>
      getIds(ctx, `/activities/profile${activityProfileQuery(activityId, undefined, opts?.since)}`, 'getActivityProfileIds'),

    getAgentProfile: (agent, profileId) => getDocument(ctx, `/agents/profile${agentProfileQuery(agent, profileId)}`, 'getAgentProfile'),
    setAgentProfile: (agent, profileId, value, opts) =>
      setDocument(ctx, `/agents/profile${agentProfileQuery(agent, profileId)}`, value, opts, concurrency, 'setAgentProfile'),
    deleteAgentProfile: (agent, profileId) =>
      deleteDocument(ctx, `/agents/profile${agentProfileQuery(agent, profileId)}`, 'deleteAgentProfile'),
    getAgentProfileIds: (agent, opts) =>
      getIds(ctx, `/agents/profile${agentProfileQuery(agent, undefined, opts?.since)}`, 'getAgentProfileIds'),
  };
}
