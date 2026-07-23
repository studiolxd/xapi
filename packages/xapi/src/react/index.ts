// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/xapi/react — React adapter
//
// Re-exports the framework-agnostic core so consumers can import everything from
// a single entry: `import { XapiProvider, useXapiClient, XapiError } from '@studiolxd/xapi/react'`.
// ─────────────────────────────────────────────────────────────────────────────

export { XapiProvider } from './xapi-provider';
export type { XapiProviderProps } from './xapi-provider';
export { useXapiClient } from './use-xapi-client';
export { useXapiStatus } from './use-xapi-status';
export type { XapiContextValue } from './xapi-context';

// Re-export the whole core for convenience
export * from '../index';
