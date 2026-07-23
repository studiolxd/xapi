import { Injector, runInInjectionContext } from '@angular/core';
import { XAPI, provideXapi } from '../../src/angular/index';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

// Angular's DI decorators require `reflect-metadata` semantics normally provided by
// the CLI/compiler toolchain; a plain `Injector.create` + `runInInjectionContext` is
// enough to exercise `useFactory` (a plain function, no decorators involved) without
// needing `TestBed` or a full component compilation pipeline.
describe('angular provideXapi', () => {
  it('provides a handle with a reactive status signal that updates on requests', async () => {
    const lrs = createMemoryLrs();
    const injector = Injector.create({
      providers: [provideXapi({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch })],
    });

    const { client, status } = injector.get(XAPI);

    expect(status().pending).toBe(0);

    await client.sendStatement(
      client.buildStatement({
        actor: { mbox: 'mailto:learner@example.com' },
        verb: 'http://adlnet.gov/expapi/verbs/completed',
        object: 'https://example.com/course/1',
      }),
    );

    expect(status().pending).toBe(0);
    expect(status().lastError).toBeNull();
  });

  it('destroys the client when the injector is destroyed', () => {
    const lrs = createMemoryLrs();
    const injector = Injector.create({
      providers: [provideXapi({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch })],
    });

    injector.get(XAPI);
    // `Injector.create()` is typed as `Injector`, but the runtime instance it returns
    // (an R3Injector) does implement `destroy()` — the same instance `DestroyRef.onDestroy`
    // hooks into inside `provideXapi`. Narrow locally instead of widening the public types.
    const destroyable = injector as Injector & { destroy(): void };
    expect(() => destroyable.destroy()).not.toThrow();
  });

  it('works when resolved via runInInjectionContext', () => {
    const lrs = createMemoryLrs();
    const injector = Injector.create({
      providers: [provideXapi({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch })],
    });

    const handle = runInInjectionContext(injector, () => injector.get(XAPI));
    expect(handle.client.status.endpoint).toBe('https://mock.lrs/xapi');
  });
});
