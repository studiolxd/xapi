import { useCallback, useSyncExternalStore } from 'react';
import { useXapiClient } from './use-xapi-client';
import type { XapiStatus } from '../types/options';

/**
 * Reactive client status — re-renders whenever a request starts, settles, or errors.
 *
 * Subscribes to the client via `useSyncExternalStore`, so the component re-renders
 * even when another component sharing the same client triggers the change.
 *
 * @example
 * ```tsx
 * function ConnectionBadge() {
 *   const status = useXapiStatus();
 *   return <span>{status.pending > 0 ? 'sending…' : 'idle'}</span>;
 * }
 * ```
 */
export function useXapiStatus(): XapiStatus {
  const client = useXapiClient();

  const subscribe = useCallback((onStoreChange: () => void) => client.on('change', onStoreChange), [client]);
  const getSnapshot = useCallback(() => client.status, [client]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
