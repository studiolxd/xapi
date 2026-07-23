/** Draft/active configuration for where the demo talks xAPI to. */
export interface ConnectionConfig {
  mode: 'mock' | 'real';
  endpoint: string;
  username: string;
  password: string;
}

/** The mock LRS endpoint is a label only — `createMemoryLrs()`'s `fetch` ignores the origin. */
export const MOCK_ENDPOINT = 'https://mock.lrs/xapi';

export const DEFAULT_CONNECTION: ConnectionConfig = {
  mode: 'mock',
  endpoint: 'https://lrs.example.com/xapi',
  username: '',
  password: '',
};
