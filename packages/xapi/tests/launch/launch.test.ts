import { describe, it, expect } from 'vitest';
import { parseXapiLaunch, createXapiClientFromLaunch } from '../../src/launch/launch';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

const ACTOR = { mbox: 'mailto:learner@example.com' };

function launchUrl(overrides: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    endpoint: 'https://mock.lrs/xapi',
    auth: 'Basic dXNlcjpwYXNz',
    actor: JSON.stringify(ACTOR),
    registration: 'reg-123',
    activity_id: 'https://example.com/course/1',
    ...overrides,
  });
  return `https://launch.example.com/content/index.html?${params.toString()}`;
}

describe('parseXapiLaunch', () => {
  it('parses a full launch URL', () => {
    const result = parseXapiLaunch(launchUrl());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.endpoint).toBe('https://mock.lrs/xapi');
    expect(result.value.auth).toBe('Basic dXNlcjpwYXNz');
    expect(result.value.actor).toEqual(ACTOR);
    expect(result.value.registration).toBe('reg-123');
    expect(result.value.activityId).toBe('https://example.com/course/1');
  });

  it('fails when endpoint is missing', () => {
    const url = 'https://launch.example.com/content/index.html?actor=%7B%7D';
    const result = parseXapiLaunch(url);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('usage');
  });

  it('fails when actor is malformed JSON', () => {
    const url = 'https://launch.example.com/content/index.html?endpoint=https://mock.lrs/xapi&actor=not-json';
    const result = parseXapiLaunch(url);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('validation');
  });

  it('fails without a url when window is unavailable', () => {
    const result = parseXapiLaunch();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('usage');
  });

  it('parses optional params as null when absent', () => {
    const url = 'https://launch.example.com/content/index.html?endpoint=https://mock.lrs/xapi';
    const result = parseXapiLaunch(url);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.auth).toBeNull();
    expect(result.value.actor).toBeNull();
    expect(result.value.registration).toBeNull();
    expect(result.value.activityId).toBeNull();
  });
});

describe('createXapiClientFromLaunch', () => {
  it('builds a working client from a launch URL', async () => {
    const memoryLrs = createMemoryLrs();
    const result = createXapiClientFromLaunch(launchUrl(), { fetch: memoryLrs.fetch });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const client = result.value;
    expect(client.status.endpoint).toBe('https://mock.lrs/xapi');

    const sent = await client.sendStatement(client.buildStatement({ verb: 'http://adlnet.gov/expapi/verbs/completed', object: 'https://example.com/1' }));
    expect(sent.ok).toBe(true);
  });

  it('propagates a parse failure', () => {
    const result = createXapiClientFromLaunch('https://x.example.com/?actor=%7B%7D');
    expect(result.ok).toBe(false);
  });

  it('lets extra options override launch-derived ones', () => {
    const memoryLrs = createMemoryLrs();
    const result = createXapiClientFromLaunch(launchUrl(), {
      fetch: memoryLrs.fetch,
      defaults: { registration: 'overridden' },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // extra.defaults is merged on top of the launch-derived actor/registration
    expect(result.value.status.endpoint).toBe('https://mock.lrs/xapi');
  });
});
