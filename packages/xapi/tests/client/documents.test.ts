import { describe, it, expect } from 'vitest';
import { createXapiClient } from '../../src/client/create-xapi-client';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

const ACTIVITY = 'https://example.com/course/1';
const AGENT = { mbox: 'mailto:learner@example.com' };

function makeClient(extra: Record<string, unknown> = {}) {
  const lrs = createMemoryLrs();
  const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch, ...extra });
  return { client, lrs };
}

describe('XapiClient state documents', () => {
  it('returns ok(null) for a state document that does not exist', async () => {
    const { client } = makeClient();
    const result = await client.getState(ACTIVITY, 'progress', { agent: AGENT });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });

  it('round-trips a state document: set, get, delete', async () => {
    const { client } = makeClient();
    const set = await client.setState(ACTIVITY, 'progress', { page: 3 }, { agent: AGENT });
    expect(set.ok).toBe(true);

    const got = await client.getState(ACTIVITY, 'progress', { agent: AGENT });
    expect(got.ok).toBe(true);
    if (got.ok) {
      expect(got.value?.content).toEqual({ page: 3 });
      expect(got.value?.etag).toBeTruthy();
    }

    const del = await client.deleteState(ACTIVITY, 'progress', { agent: AGENT });
    expect(del.ok).toBe(true);
    const afterDelete = await client.getState(ACTIVITY, 'progress', { agent: AGENT });
    if (afterDelete.ok) expect(afterDelete.value).toBeNull();
  });

  it('lists state ids for a scope', async () => {
    const { client } = makeClient();
    await client.setState(ACTIVITY, 'a', { x: 1 }, { agent: AGENT });
    await client.setState(ACTIVITY, 'b', { x: 2 }, { agent: AGENT });
    const ids = await client.getStateIds(ACTIVITY, { agent: AGENT });
    expect(ids.ok).toBe(true);
    if (ids.ok) expect(ids.value.sort()).toEqual(['a', 'b']);
  });

  it('with concurrency "auto": retries a conflicting write with If-Match after a 412', async () => {
    const { client, lrs } = makeClient({ concurrency: 'auto' });
    await client.setState(ACTIVITY, 'progress', { page: 1 }, { agent: AGENT });

    // Second unconditional-creation write should transparently retry with If-Match and succeed,
    // overwriting the existing document rather than failing.
    const second = await client.setState(ACTIVITY, 'progress', { page: 2 }, { agent: AGENT });
    expect(second.ok).toBe(true);

    const got = await client.getState(ACTIVITY, 'progress', { agent: AGENT });
    if (got.ok) expect(got.value?.content).toEqual({ page: 2 });
    expect(lrs.store.state.size).toBe(1);
  });

  it('with concurrency "off": a second write still succeeds (no conditional headers sent)', async () => {
    const { client } = makeClient({ concurrency: 'off' });
    await client.setState(ACTIVITY, 'progress', { page: 1 }, { agent: AGENT });
    const second = await client.setState(ACTIVITY, 'progress', { page: 2 }, { agent: AGENT });
    expect(second.ok).toBe(true);
    const got = await client.getState(ACTIVITY, 'progress', { agent: AGENT });
    if (got.ok) expect(got.value?.content).toEqual({ page: 2 });
  });

  it('setState with an explicit stale etag fails with kind "http" (412)', async () => {
    const { client } = makeClient();
    await client.setState(ACTIVITY, 'progress', { page: 1 }, { agent: AGENT });
    const result = await client.setState(ACTIVITY, 'progress', { page: 2 }, { agent: AGENT, etag: '"stale-etag"' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
      expect(result.error.status).toBe(412);
    }
  });
});

describe('XapiClient activity profile documents', () => {
  it('round-trips an activity profile document', async () => {
    const { client } = makeClient();
    await client.setActivityProfile(ACTIVITY, 'notes', { text: 'hello' });
    const got = await client.getActivityProfile(ACTIVITY, 'notes');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value?.content).toEqual({ text: 'hello' });

    const del = await client.deleteActivityProfile(ACTIVITY, 'notes');
    expect(del.ok).toBe(true);
  });

  it('lists activity profile ids', async () => {
    const { client } = makeClient();
    await client.setActivityProfile(ACTIVITY, 'a', { x: 1 });
    await client.setActivityProfile(ACTIVITY, 'b', { x: 2 });
    const ids = await client.getActivityProfileIds(ACTIVITY);
    expect(ids.ok).toBe(true);
    if (ids.ok) expect(ids.value.sort()).toEqual(['a', 'b']);
  });
});

describe('XapiClient agent profile documents', () => {
  it('round-trips an agent profile document', async () => {
    const { client } = makeClient();
    await client.setAgentProfile(AGENT, 'prefs', { theme: 'dark' });
    const got = await client.getAgentProfile(AGENT, 'prefs');
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.value?.content).toEqual({ theme: 'dark' });

    const del = await client.deleteAgentProfile(AGENT, 'prefs');
    expect(del.ok).toBe(true);
  });

  it('lists agent profile ids', async () => {
    const { client } = makeClient();
    await client.setAgentProfile(AGENT, 'a', { x: 1 });
    await client.setAgentProfile(AGENT, 'b', { x: 2 });
    const ids = await client.getAgentProfileIds(AGENT);
    expect(ids.ok).toBe(true);
    if (ids.ok) expect(ids.value.sort()).toEqual(['a', 'b']);
  });
});
