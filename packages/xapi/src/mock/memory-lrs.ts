import type { Statement } from '../types/statement';

const VOIDED_VERB_ID = 'http://adlnet.gov/expapi/verbs/voided';
const DEFAULT_LIMIT = 50;

interface StoredStatement {
  statement: Statement;
  voided: boolean;
}

interface DocumentEntry {
  content: string;
  contentType: string;
  etag: string;
  updated: string;
}

/** Direct access to a {@link createMemoryLrs} instance's internal state, for assertions in tests. */
export interface MemoryLrsStore {
  statements: Map<string, StoredStatement>;
  state: Map<string, DocumentEntry>;
  activityProfile: Map<string, DocumentEntry>;
  agentProfile: Map<string, DocumentEntry>;
}

function createStore(): MemoryLrsStore {
  return {
    statements: new Map(),
    state: new Map(),
    activityProfile: new Map(),
    agentProfile: new Map(),
  };
}

/** FNV-1a hash, hex-encoded — cheap, deterministic content fingerprint used as a mock ETag. */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function etagFor(content: string): string {
  return `"${fnv1a(content)}"`;
}

function jsonResponse(data: unknown, status = 200): Response {
  if (data === undefined) return new Response(null, { status });
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function readBody(init?: RequestInit): Promise<string> {
  if (!init?.body) return '';
  if (typeof init.body === 'string') return init.body;
  return String(init.body);
}

function withoutIdAndStored(statement: Statement): Omit<Statement, 'id' | 'stored'> {
  const { id: _id, stored: _stored, ...rest } = statement;
  return rest;
}

function statementsEqual(a: Statement, b: Statement): boolean {
  return JSON.stringify(withoutIdAndStored(a)) === JSON.stringify(withoutIdAndStored(b));
}

function isVoidingStatement(statement: Statement): string | null {
  if (statement.verb.id !== VOIDED_VERB_ID) return null;
  if (statement.object.objectType === 'StatementRef') return statement.object.id;
  return null;
}

// — Statements —

async function handleStatements(url: URL, method: string, init: RequestInit | undefined, store: MemoryLrsStore): Promise<Response> {
  if (method === 'GET') return handleGetStatements(url, store);
  if (method === 'POST' || method === 'PUT') return handleWriteStatements(url, method, init, store);
  return errorResponse(405, 'method not allowed');
}

function handleGetStatements(url: URL, store: MemoryLrsStore): Response {
  const params = url.searchParams;

  const statementId = params.get('statementId');
  if (statementId) {
    const record = store.statements.get(statementId);
    if (!record || record.voided) return errorResponse(404, 'statement not found');
    return jsonResponse(record.statement);
  }

  const voidedStatementId = params.get('voidedStatementId');
  if (voidedStatementId) {
    const record = store.statements.get(voidedStatementId);
    if (!record || !record.voided) return errorResponse(404, 'voided statement not found');
    return jsonResponse(record.statement);
  }

  const cursor = Number(params.get('_cursor') ?? '0');
  const verb = params.get('verb');
  const activity = params.get('activity');
  const registration = params.get('registration');
  const since = params.get('since');
  const until = params.get('until');
  const agentParam = params.get('agent');
  const agentKey = agentParam ? JSON.stringify(JSON.parse(agentParam)) : null;
  const ascending = params.get('ascending') === 'true';
  const limit = Number(params.get('limit')) || DEFAULT_LIMIT;

  let list = Array.from(store.statements.values())
    .filter((r) => !r.voided)
    .map((r) => r.statement);

  if (verb) list = list.filter((s) => s.verb.id === verb);
  if (activity) list = list.filter((s) => 'id' in s.object && s.object.id === activity);
  if (registration) list = list.filter((s) => s.context?.registration === registration);
  if (since) list = list.filter((s) => (s.stored ?? '') > since);
  if (until) list = list.filter((s) => (s.stored ?? '') <= until);
  if (agentKey) list = list.filter((s) => JSON.stringify(s.actor) === agentKey);

  if (!ascending) list = [...list].reverse();

  const page = list.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit;
  const more = nextCursor < list.length ? buildMoreUrl(url, nextCursor) : '';

  return jsonResponse({ statements: page, more });
}

// Returned as an endpoint-relative path (e.g. "/statements?...&_cursor=50"), matching
// how the client's transport joins any other resource path with `ctx.endpoint`.
function buildMoreUrl(url: URL, cursor: number): string {
  const more = new URL(url.toString());
  more.searchParams.set('_cursor', String(cursor));
  return `/statements${more.search}`;
}

async function handleWriteStatements(
  url: URL,
  method: string,
  init: RequestInit | undefined,
  store: MemoryLrsStore,
): Promise<Response> {
  const bodyText = await readBody(init);
  const parsed = JSON.parse(bodyText) as Statement | Statement[];

  if (method === 'PUT') {
    const statementId = url.searchParams.get('statementId');
    if (!statementId) return errorResponse(400, 'statementId query param is required for PUT');
    const incoming: Statement = { ...(parsed as Statement), id: statementId };
    const conflict = checkConflict(incoming, store);
    if (conflict) return errorResponse(409, 'statement already exists with different content');
    store.statements.set(statementId, {
      statement: { ...incoming, stored: incoming.stored ?? new Date().toISOString() },
      voided: false,
    });
    applyVoidingIfApplicable(incoming, store);
    return new Response(null, { status: 204 });
  }

  const incomingList = Array.isArray(parsed) ? parsed : [parsed];
  const withIds = incomingList.map((s) => ({ ...s, id: s.id ?? crypto.randomUUID() }));

  for (const statement of withIds) {
    const conflict = checkConflict(statement, store);
    if (conflict) return errorResponse(409, `statement ${statement.id} already exists with different content`);
  }

  for (const statement of withIds) {
    store.statements.set(statement.id as string, {
      statement: { ...statement, stored: statement.stored ?? new Date().toISOString() },
      voided: false,
    });
    applyVoidingIfApplicable(statement, store);
  }

  return jsonResponse(withIds.map((s) => s.id));
}

function checkConflict(statement: Statement, store: MemoryLrsStore): boolean {
  if (!statement.id) return false;
  const existing = store.statements.get(statement.id);
  if (!existing) return false;
  return !statementsEqual(existing.statement, statement);
}

function applyVoidingIfApplicable(statement: Statement, store: MemoryLrsStore): void {
  const targetId = isVoidingStatement(statement);
  if (!targetId) return;
  const target = store.statements.get(targetId);
  if (target) target.voided = true;
}

// — Documents (State / Activity Profile / Agent Profile) —

function scopeKeyState(url: URL): string {
  const params = url.searchParams;
  return JSON.stringify({
    a: params.get('activityId'),
    g: params.get('agent') ? JSON.stringify(JSON.parse(params.get('agent') as string)) : null,
    r: params.get('registration'),
  });
}

function scopeKeyActivityProfile(url: URL): string {
  return JSON.stringify({ a: url.searchParams.get('activityId') });
}

function scopeKeyAgentProfile(url: URL): string {
  const params = url.searchParams;
  return JSON.stringify({
    g: params.get('agent') ? JSON.stringify(JSON.parse(params.get('agent') as string)) : null,
  });
}

async function handleDocumentResource(
  url: URL,
  method: string,
  init: RequestInit | undefined,
  store: Map<string, DocumentEntry>,
  scopeKey: string,
  idParam: string,
): Promise<Response> {
  const id = url.searchParams.get(idParam);

  if (method === 'GET' && !id) {
    const since = url.searchParams.get('since');
    const ids: string[] = [];
    for (const [key, entry] of store) {
      if (!key.startsWith(`${scopeKey}::`)) continue;
      if (since && entry.updated <= since) continue;
      ids.push(key.slice(scopeKey.length + 2));
    }
    return jsonResponse(ids);
  }

  if (!id) return errorResponse(400, `${idParam} is required`);
  const key = `${scopeKey}::${id}`;
  const headers = new Headers(init?.headers);

  if (method === 'GET') {
    const entry = store.get(key);
    if (!entry) return errorResponse(404, 'document not found');
    return new Response(entry.content, {
      status: 200,
      headers: { 'Content-Type': entry.contentType, ETag: entry.etag },
    });
  }

  if (method === 'DELETE') {
    store.delete(key);
    return new Response(null, { status: 204 });
  }

  if (method === 'PUT' || method === 'POST') {
    const existing = store.get(key);
    const ifNoneMatch = headers.get('If-None-Match');
    const ifMatch = headers.get('If-Match');

    if (ifNoneMatch === '*' && existing) return errorResponse(412, 'document already exists');
    if (ifMatch && (!existing || existing.etag !== ifMatch)) return errorResponse(412, 'ETag precondition failed');

    const bodyText = await readBody(init);
    const contentType = headers.get('Content-Type') ?? 'application/json';
    store.set(key, { content: bodyText, contentType, etag: etagFor(bodyText), updated: new Date().toISOString() });
    return new Response(null, { status: 204 });
  }

  return errorResponse(405, 'method not allowed');
}

// — Activities / Agents / About —

function handleActivities(url: URL, store: MemoryLrsStore): Response {
  const activityId = url.searchParams.get('activityId');
  if (!activityId) return errorResponse(400, 'activityId is required');
  for (const record of store.statements.values()) {
    const object = record.statement.object;
    if ('id' in object && object.id === activityId && object.objectType !== 'StatementRef') {
      return jsonResponse({ objectType: 'Activity', id: activityId, definition: 'definition' in object ? object.definition : undefined });
    }
  }
  return errorResponse(404, 'activity not found');
}

function handleAgents(url: URL): Response {
  const agentParam = url.searchParams.get('agent');
  if (!agentParam) return errorResponse(400, 'agent is required');
  const agent = JSON.parse(agentParam) as { mbox?: string; name?: string };
  return jsonResponse({
    objectType: 'Person',
    mbox: agent.mbox ? [agent.mbox] : undefined,
    name: agent.name ? [agent.name] : undefined,
  });
}

function handleAbout(): Response {
  return jsonResponse({ version: ['1.0.3', '2.0'], extensions: {} });
}

/**
 * An in-memory, spec-shaped Learning Record Store, exposed as a `fetch`-compatible
 * function. Use it to run the client (and the demo app) with no real LRS.
 *
 * @example
 * ```ts
 * const lrs = createMemoryLrs();
 * const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });
 * ```
 */
export function createMemoryLrs(): { fetch: typeof fetch; store: MemoryLrsStore; reset: () => void } {
  let store = createStore();

  const fetchImpl: typeof fetch = async (input, init) => {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(urlString);
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const pathname = url.pathname;

    try {
      if (pathname.endsWith('/statements')) return await handleStatements(url, method, init, store);

      if (pathname.endsWith('/activities/state')) {
        return await handleDocumentResource(url, method, init, store.state, scopeKeyState(url), 'stateId');
      }
      if (pathname.endsWith('/activities/profile')) {
        return await handleDocumentResource(url, method, init, store.activityProfile, scopeKeyActivityProfile(url), 'profileId');
      }
      if (pathname.endsWith('/agents/profile')) {
        return await handleDocumentResource(url, method, init, store.agentProfile, scopeKeyAgentProfile(url), 'profileId');
      }
      if (pathname.endsWith('/activities')) return handleActivities(url, store);
      if (pathname.endsWith('/agents')) return handleAgents(url);
      if (pathname.endsWith('/about')) return handleAbout();

      return errorResponse(404, `no mock route for ${pathname}`);
    } catch (e) {
      return errorResponse(500, e instanceof Error ? e.message : 'mock LRS internal error');
    }
  };

  return {
    fetch: fetchImpl,
    get store() {
      return store;
    },
    reset() {
      store = createStore();
    },
  };
}
