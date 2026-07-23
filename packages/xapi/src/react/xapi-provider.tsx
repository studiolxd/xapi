import { useEffect, useMemo, type ReactNode } from 'react';
import { XapiContext, type XapiContextValue } from './xapi-context';
import { createXapiClient } from '../client/create-xapi-client';
import type { XapiClientOptions } from '../types/options';

export interface XapiProviderProps {
  options: XapiClientOptions;
  children: ReactNode;
}

/**
 * xAPI Provider component.
 *
 * Creates a {@link XapiClient} bound to the given options and makes it available to
 * descendants via context. The client is destroyed automatically when the provider
 * unmounts or when its options change.
 *
 * For reactive `status` (re-renders on every request) use `useXapiStatus()`; the
 * `status` exposed by `useXapiClient()`'s context is a snapshot read at render time.
 *
 * @example
 * ```tsx
 * <XapiProvider options={{ endpoint: 'https://lrs.example.com/xapi', auth: { username, password } }}>
 *   <CourseContent />
 * </XapiProvider>
 * ```
 */
export function XapiProvider({ options, children }: XapiProviderProps) {
  const client = useMemo(
    () => createXapiClient(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.endpoint, options.version, options.timeoutMs, options.concurrency, options.validate, options.debug, options.auth, options.fetch, options.defaults],
  );

  useEffect(() => () => client.destroy(), [client]);

  const contextValue = useMemo<XapiContextValue>(() => ({ client, status: client.status }), [client]);

  return <XapiContext.Provider value={contextValue}>{children}</XapiContext.Provider>;
}
