import { createContext } from 'react';
import type { XapiClient } from '../client/create-xapi-client';
import type { XapiStatus } from '../types/options';

/** The value provided by XapiProvider via React context. */
export interface XapiContextValue {
  /** The configured xAPI client. */
  client: XapiClient;
  /** Client status snapshot at render time. For reactive status use `useXapiStatus()`. */
  status: XapiStatus;
}

export const XapiContext = createContext<XapiContextValue | null>(null);
