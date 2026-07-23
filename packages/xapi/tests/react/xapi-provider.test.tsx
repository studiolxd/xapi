import { renderHook, act, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { XapiProvider } from '../../src/react/xapi-provider';
import { useXapiClient } from '../../src/react/use-xapi-client';
import { useXapiStatus } from '../../src/react/use-xapi-status';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

function wrapper(fetchImpl: typeof fetch) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(XapiProvider, {
      options: { endpoint: 'https://mock.lrs/xapi', fetch: fetchImpl },
      children,
    });
  };
}

describe('useXapiClient', () => {
  it('throws when used outside a XapiProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useXapiClient();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/XapiProvider/);
  });

  it('provides a configured client inside the provider', () => {
    const lrs = createMemoryLrs();
    const { result } = renderHook(() => useXapiClient(), { wrapper: wrapper(lrs.fetch) });
    expect(result.current.status.endpoint).toBe('https://mock.lrs/xapi');
  });
});

describe('useXapiStatus', () => {
  it('re-renders reactively as requests start and settle', async () => {
    const lrs = createMemoryLrs();
    const { result } = renderHook(
      () => ({ client: useXapiClient(), status: useXapiStatus() }),
      { wrapper: wrapper(lrs.fetch) },
    );

    expect(result.current.status.pending).toBe(0);

    await act(async () => {
      await result.current.client.sendStatement(
        result.current.client.buildStatement({
          actor: { mbox: 'mailto:learner@example.com' },
          verb: 'http://adlnet.gov/expapi/verbs/completed',
          object: 'https://example.com/course/1',
        }),
      );
    });

    await waitFor(() => expect(result.current.status.pending).toBe(0));
    expect(result.current.status.lastError).toBeNull();
  });
});
