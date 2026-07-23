import { describe, it, expect } from 'vitest';
import { createXapiClient } from '../../src/client/create-xapi-client';
import { createMemoryLrs } from '../../src/mock/memory-lrs';
import { VERBS } from '../../src/build/verbs';

function makeClient(extra: Record<string, unknown> = {}) {
  const lrs = createMemoryLrs();
  const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch, ...extra });
  return { client, lrs };
}

describe('XapiClient statements', () => {
  it('sends and retrieves a statement', async () => {
    const { client } = makeClient();
    const statement = client.buildStatement({
      actor: { mbox: 'mailto:learner@example.com' },
      verb: VERBS.completed,
      object: 'https://example.com/course/1',
    });
    const sent = await client.sendStatement(statement);
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const fetched = await client.getStatement(sent.value);
    expect(fetched.ok).toBe(true);
    if (fetched.ok) expect(fetched.value.verb.id).toBe(VERBS.completed.id);
  });

  it('blocks sending an invalid statement without hitting the network', async () => {
    const { client, lrs } = makeClient();
    const result = await client.sendStatement({
      actor: {},
      verb: { id: 'not an iri' },
      object: { id: 'https://example.com/course/1' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('validation');
    expect(lrs.store.statements.size).toBe(0);
  });

  it('skips validation when validate: false', async () => {
    const { client } = makeClient({ validate: false });
    const result = await client.sendStatement({
      actor: {},
      verb: { id: 'not an iri' },
      object: { id: 'https://example.com/course/1' },
    });
    // The mock LRS itself doesn't validate — it just stores it.
    expect(result.ok).toBe(true);
  });

  it('sends multiple statements at once', async () => {
    const { client } = makeClient();
    const st = () =>
      client.buildStatement({ actor: { mbox: 'mailto:a@example.com' }, verb: VERBS.experienced, object: 'https://example.com/x' });
    const result = await client.sendStatements([st(), st()]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });

  it('voids a statement using the client default actor', async () => {
    const actor = { mbox: 'mailto:learner@example.com' };
    const { client } = makeClient({ defaults: { actor } });
    const sent = await client.sendStatement(client.buildStatement({ actor, verb: VERBS.attempted, object: 'https://example.com/x' }));
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;

    const voided = await client.voidStatement(sent.value);
    expect(voided.ok).toBe(true);

    const lookup = await client.getStatement(sent.value);
    expect(lookup.ok).toBe(false);

    const voidedLookup = await client.getVoidedStatement(sent.value);
    expect(voidedLookup.ok).toBe(true);
  });

  it('voidStatement fails with kind "usage" when no actor is available', async () => {
    const { client } = makeClient();
    const result = await client.voidStatement('00000000-0000-0000-0000-000000000000');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('usage');
  });

  it('paginates getStatements and follows `more` via getMoreStatements', async () => {
    const { client } = makeClient();
    for (let i = 0; i < 5; i++) {
      await client.sendStatement(
        client.buildStatement({ actor: { mbox: 'mailto:a@example.com' }, verb: VERBS.experienced, object: 'https://example.com/x' }),
      );
    }
    const first = await client.getStatements({ limit: 2 });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.statements).toHaveLength(2);
    expect(first.value.more).toBeTruthy();

    const second = await client.getMoreStatements(first.value.more as string);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value.statements).toHaveLength(2);
  });

  it('tracks pending requests via the "change" event and settles back to 0', async () => {
    const { client } = makeClient();
    const pendingSeen: number[] = [];
    const unsubscribe = client.on('change', (s) => pendingSeen.push(s.pending));

    await client.sendStatement(
      client.buildStatement({ actor: { mbox: 'mailto:a@example.com' }, verb: VERBS.experienced, object: 'https://example.com/x' }),
    );

    expect(pendingSeen).toContain(1);
    expect(client.status.pending).toBe(0);
    unsubscribe();
  });

  it('sets lastError on a network-level failure (validation failures do not touch the network)', async () => {
    const client = createXapiClient({
      endpoint: 'https://mock.lrs/xapi',
      validate: false,
      fetch: async () => new Response('unauthorized', { status: 401 }),
    });
    await client.sendStatement({ actor: { mbox: 'mailto:a@example.com' }, verb: VERBS.completed, object: { id: 'https://example.com/x' } });
    expect(client.status.lastError).not.toBeNull();
    expect(client.status.lastError?.kind).toBe('http');
  });

  it('reports a network error as kind "network"', async () => {
    const client = createXapiClient({
      endpoint: 'https://mock.lrs/xapi',
      fetch: async () => {
        throw new TypeError('network down');
      },
      validate: false,
    });
    const result = await client.sendStatement({
      actor: { mbox: 'mailto:a@example.com' },
      verb: VERBS.completed,
      object: { id: 'https://example.com/x' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('network');
  });

  it('reports a timeout as kind "timeout"', async () => {
    const client = createXapiClient({
      endpoint: 'https://mock.lrs/xapi',
      timeoutMs: 10,
      validate: false,
      fetch: (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    });
    const result = await client.sendStatement({
      actor: { mbox: 'mailto:a@example.com' },
      verb: VERBS.completed,
      object: { id: 'https://example.com/x' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('timeout');
  });

  it('reports an HTTP error (e.g. 401) as kind "http"', async () => {
    const client = createXapiClient({
      endpoint: 'https://mock.lrs/xapi',
      validate: false,
      fetch: async () => new Response('unauthorized', { status: 401 }),
    });
    const result = await client.sendStatement({
      actor: { mbox: 'mailto:a@example.com' },
      verb: VERBS.completed,
      object: { id: 'https://example.com/x' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
      expect(result.error.status).toBe(401);
    }
  });
});
