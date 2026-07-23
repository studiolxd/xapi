import { effectScope } from 'vue';
import { useXapiClient } from '../../src/vue/index';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

describe('vue useXapiClient', () => {
  it('exposes a reactive status ref that updates on requests', async () => {
    const lrs = createMemoryLrs();
    const scope = effectScope();

    const { client, status } = scope.run(() =>
      useXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch }),
    )!;

    expect(status.value.pending).toBe(0);

    await client.sendStatement(
      client.buildStatement({
        actor: { mbox: 'mailto:learner@example.com' },
        verb: 'http://adlnet.gov/expapi/verbs/completed',
        object: 'https://example.com/course/1',
      }),
    );

    expect(status.value.lastError).toBeNull();
    expect(status.value.pending).toBe(0);

    scope.stop();
  });

  it('destroys the client on scope stop without throwing', () => {
    const lrs = createMemoryLrs();
    const scope = effectScope();
    scope.run(() => useXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch }));
    expect(() => scope.stop()).not.toThrow();
  });

  it('supports manual destroy() outside an effect scope', () => {
    const lrs = createMemoryLrs();
    const { destroy } = useXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });
    expect(() => destroy()).not.toThrow();
  });
});
