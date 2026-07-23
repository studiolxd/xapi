import { describe, it, expect } from 'vitest';
import { createXapiClient } from '../../src/client/create-xapi-client';
import { createMemoryLrs } from '../../src/mock/memory-lrs';

describe('XapiClient about', () => {
  it('reports the versions the mock LRS supports', async () => {
    const lrs = createMemoryLrs();
    const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });
    const result = await client.about();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.version).toContain('1.0.3');
      expect(result.value.version).toContain('2.0');
    }
  });
});
