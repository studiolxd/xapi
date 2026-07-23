import { useContext } from 'react';
import { XapiContext } from './xapi-context';
import type { XapiClient } from '../client/create-xapi-client';

/**
 * Hook to access the configured xAPI client.
 *
 * Must be used within a `<XapiProvider>`. Throws if used outside.
 *
 * @example
 * ```tsx
 * function SendCompletion() {
 *   const client = useXapiClient();
 *   const send = () => client.sendStatement(client.buildStatement({ verb: VERBS.completed, object: 'https://example.com/course/1' }));
 * }
 * ```
 */
export function useXapiClient(): XapiClient {
  const context = useContext(XapiContext);
  if (context === null) {
    throw new Error(
      'useXapiClient() must be used within a <XapiProvider>. ' +
        'Wrap your application (or the relevant subtree) with <XapiProvider options={{ endpoint: ... }}>.',
    );
  }
  return context.client;
}
