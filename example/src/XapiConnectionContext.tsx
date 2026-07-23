/**
 * XapiConnectionContext — shares the demo's connection config (mock vs. real LRS,
 * endpoint, credentials) across sections, independent of `XapiProvider`'s own context.
 *
 * `ConnectionSection` writes to it; `App` reads it to compute the `XapiClientOptions`
 * passed to `XapiProvider` (remounted via `key` whenever the resolved connection changes).
 */
import { createContext, useContext } from 'react';
import type { ConnectionConfig } from './connection';

export interface XapiConnectionContextValue {
  config: ConnectionConfig;
  setConfig: (config: ConnectionConfig) => void;
}

export const XapiConnectionContext = createContext<XapiConnectionContextValue | null>(null);

export function useXapiConnection(): XapiConnectionContextValue {
  const ctx = useContext(XapiConnectionContext);
  if (!ctx) throw new Error('useXapiConnection must be used inside XapiConnectionContext.Provider');
  return ctx;
}
