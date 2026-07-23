import { get } from 'svelte/store';
import { createXapiStore } from '../../src/svelte/index';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

describe('svelte createXapiStore', () => {
  it('exposes a readable status store that updates on requests', async () => {
    const lrs = createMemoryLrs();
    const store = createXapiStore({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });

    expect(get(store.status).pending).toBe(0);

    const seen: number[] = [];
    const unsubscribe = store.status.subscribe((s) => seen.push(s.pending));

    await store.client.sendStatement(
      store.client.buildStatement({
        actor: { mbox: 'mailto:learner@example.com' },
        verb: 'http://adlnet.gov/expapi/verbs/completed',
        object: 'https://example.com/course/1',
      }),
    );

    expect(seen).toContain(1);
    expect(get(store.status).pending).toBe(0);
    expect(get(store.status).lastError).toBeNull();

    unsubscribe();
    expect(() => store.destroy()).not.toThrow();
  });
});
