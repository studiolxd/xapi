import { describe, it, expect } from 'vitest';
import { createXapiClient } from '../../src/client/create-xapi-client';
import { createMemoryLrs } from '../../src/mock/memory-lrs';
import { VERBS } from '../../src/build/verbs';

const ACTIVITY = 'https://example.com/course/1';
const AGENT = { mbox: 'mailto:learner@example.com' };

function makeClient() {
  const lrs = createMemoryLrs();
  return createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });
}

describe('XapiClient activities/agents', () => {
  it('getActivity finds an activity referenced by a stored statement', async () => {
    const client = makeClient();
    await client.sendStatement(
      client.buildStatement({
        actor: AGENT,
        verb: VERBS.completed,
        object: { objectType: 'Activity', id: ACTIVITY, definition: { name: { en: 'Course 1' } } },
      }),
    );
    const result = await client.getActivity(ACTIVITY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe(ACTIVITY);
  });

  it('getActivity fails with kind "http" (404) for an unknown activity', async () => {
    const client = makeClient();
    const result = await client.getActivity('https://example.com/never-seen');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('http');
      expect(result.error.status).toBe(404);
    }
  });

  it('getPerson returns a Person-shaped profile for a known agent', async () => {
    const client = makeClient();
    const result = await client.getPerson(AGENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.objectType).toBe('Person');
      expect(result.value.mbox).toEqual([AGENT.mbox]);
    }
  });
});
