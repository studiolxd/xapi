import { describe, it, expect } from 'vitest';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

const ENDPOINT = 'https://mock.lrs/xapi';
const HEADERS = { 'Content-Type': 'application/json', 'X-Experience-API-Version': '1.0.3' };

function statement(overrides: Record<string, unknown> = {}) {
  return {
    actor: { mbox: 'mailto:learner@example.com' },
    verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
    object: { id: 'https://example.com/course/1' },
    ...overrides,
  };
}

describe('createMemoryLrs', () => {
  it('stores a statement via POST and generates an id', async () => {
    const lrs = createMemoryLrs();
    const res = await lrs.fetch(`${ENDPOINT}/statements`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(statement()),
    });
    expect(res.status).toBe(200);
    const ids = (await res.json()) as string[];
    expect(ids).toHaveLength(1);
    expect(lrs.store.statements.size).toBe(1);
  });

  it('is idempotent: same id + same content is accepted twice', async () => {
    const lrs = createMemoryLrs();
    const st = statement({ id: '550e8400-e29b-41d4-a716-446655440000' });
    const first = await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(st) });
    const second = await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(st) });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(lrs.store.statements.size).toBe(1);
  });

  it('rejects same id + different content with 409', async () => {
    const lrs = createMemoryLrs();
    const id = '550e8400-e29b-41d4-a716-446655440000';
    await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(statement({ id })) });
    const res = await lrs.fetch(`${ENDPOINT}/statements`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(statement({ id, verb: { id: 'http://adlnet.gov/expapi/verbs/passed' } })),
    });
    expect(res.status).toBe(409);
  });

  it('retrieves a single statement by statementId', async () => {
    const lrs = createMemoryLrs();
    const post = await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(statement()) });
    const [id] = (await post.json()) as string[];
    const res = await lrs.fetch(`${ENDPOINT}/statements?statementId=${id}`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe(id);
  });

  it('404s on an unknown statementId', async () => {
    const lrs = createMemoryLrs();
    const res = await lrs.fetch(`${ENDPOINT}/statements?statementId=00000000-0000-0000-0000-000000000000`, { headers: HEADERS });
    expect(res.status).toBe(404);
  });

  it('voids a statement: it disappears from listing, is retrievable via voidedStatementId', async () => {
    const lrs = createMemoryLrs();
    const post = await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(statement()) });
    const [id] = (await post.json()) as string[];

    const voiding = statement({
      verb: { id: 'http://adlnet.gov/expapi/verbs/voided' },
      object: { objectType: 'StatementRef', id },
    });
    await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(voiding) });

    const list = await lrs.fetch(`${ENDPOINT}/statements`, { headers: HEADERS });
    const page = (await list.json()) as { statements: Array<{ id: string }> };
    expect(page.statements.some((s) => s.id === id)).toBe(false);

    const voided = await lrs.fetch(`${ENDPOINT}/statements?voidedStatementId=${id}`, { headers: HEADERS });
    expect(voided.status).toBe(200);
  });

  it('paginates GET /statements with `more`', async () => {
    const lrs = createMemoryLrs();
    for (let i = 0; i < 5; i++) {
      await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(statement()) });
    }
    const first = await lrs.fetch(`${ENDPOINT}/statements?limit=2`, { headers: HEADERS });
    const firstPage = (await first.json()) as { statements: unknown[]; more: string };
    expect(firstPage.statements).toHaveLength(2);
    expect(firstPage.more).not.toBe('');

    const second = await lrs.fetch(`${ENDPOINT}${firstPage.more}`, { headers: HEADERS });
    const secondPage = (await second.json()) as { statements: unknown[]; more: string };
    expect(secondPage.statements).toHaveLength(2);
  });

  it('state: PUT then GET round-trips content and ETag; DELETE removes it', async () => {
    const lrs = createMemoryLrs();
    const qs = '?activityId=https://example.com/course/1&agent=' + encodeURIComponent(JSON.stringify({ mbox: 'mailto:learner@example.com' })) + '&stateId=progress';

    const put = await lrs.fetch(`${ENDPOINT}/activities/state${qs}`, {
      method: 'PUT',
      headers: { ...HEADERS, 'If-None-Match': '*' },
      body: JSON.stringify({ page: 3 }),
    });
    expect(put.status).toBe(204);

    const get = await lrs.fetch(`${ENDPOINT}/activities/state${qs}`, { headers: HEADERS });
    expect(get.status).toBe(200);
    expect(get.headers.get('ETag')).toBeTruthy();
    const body = (await get.json()) as { page: number };
    expect(body.page).toBe(3);

    const del = await lrs.fetch(`${ENDPOINT}/activities/state${qs}`, { method: 'DELETE', headers: HEADERS });
    expect(del.status).toBe(204);
    const getAfterDelete = await lrs.fetch(`${ENDPOINT}/activities/state${qs}`, { headers: HEADERS });
    expect(getAfterDelete.status).toBe(404);
  });

  it('state: If-None-Match "*" returns 412 when the document already exists', async () => {
    const lrs = createMemoryLrs();
    const qs = '?activityId=https://example.com/course/1&stateId=progress';
    await lrs.fetch(`${ENDPOINT}/activities/state${qs}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ page: 1 }) });
    const res = await lrs.fetch(`${ENDPOINT}/activities/state${qs}`, {
      method: 'PUT',
      headers: { ...HEADERS, 'If-None-Match': '*' },
      body: JSON.stringify({ page: 2 }),
    });
    expect(res.status).toBe(412);
  });

  it('lists state ids for a scope', async () => {
    const lrs = createMemoryLrs();
    const base = 'activityId=https://example.com/course/1';
    await lrs.fetch(`${ENDPOINT}/activities/state?${base}&stateId=a`, { method: 'PUT', headers: HEADERS, body: '"x"' });
    await lrs.fetch(`${ENDPOINT}/activities/state?${base}&stateId=b`, { method: 'PUT', headers: HEADERS, body: '"y"' });
    const res = await lrs.fetch(`${ENDPOINT}/activities/state?${base}`, { headers: HEADERS });
    const ids = (await res.json()) as string[];
    expect(ids.sort()).toEqual(['a', 'b']);
  });

  it('activity profile: PUT/GET/DELETE round-trip', async () => {
    const lrs = createMemoryLrs();
    const qs = '?activityId=https://example.com/course/1&profileId=notes';
    await lrs.fetch(`${ENDPOINT}/activities/profile${qs}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ note: 'hi' }) });
    const get = await lrs.fetch(`${ENDPOINT}/activities/profile${qs}`, { headers: HEADERS });
    expect(get.status).toBe(200);
    const del = await lrs.fetch(`${ENDPOINT}/activities/profile${qs}`, { method: 'DELETE', headers: HEADERS });
    expect(del.status).toBe(204);
  });

  it('agent profile: PUT/GET/DELETE round-trip', async () => {
    const lrs = createMemoryLrs();
    const agent = encodeURIComponent(JSON.stringify({ mbox: 'mailto:learner@example.com' }));
    const qs = `?agent=${agent}&profileId=prefs`;
    await lrs.fetch(`${ENDPOINT}/agents/profile${qs}`, { method: 'PUT', headers: HEADERS, body: JSON.stringify({ theme: 'dark' }) });
    const get = await lrs.fetch(`${ENDPOINT}/agents/profile${qs}`, { headers: HEADERS });
    expect(get.status).toBe(200);
    const del = await lrs.fetch(`${ENDPOINT}/agents/profile${qs}`, { method: 'DELETE', headers: HEADERS });
    expect(del.status).toBe(204);
  });

  it('GET /about reports supported versions', async () => {
    const lrs = createMemoryLrs();
    const res = await lrs.fetch(`${ENDPOINT}/about`, { headers: HEADERS });
    const body = (await res.json()) as { version: string[] };
    expect(body.version).toContain('1.0.3');
    expect(body.version).toContain('2.0');
  });

  it('reset() clears all state', async () => {
    const lrs = createMemoryLrs();
    await lrs.fetch(`${ENDPOINT}/statements`, { method: 'POST', headers: HEADERS, body: JSON.stringify(statement()) });
    expect(lrs.store.statements.size).toBe(1);
    lrs.reset();
    expect(lrs.store.statements.size).toBe(0);
  });
});
