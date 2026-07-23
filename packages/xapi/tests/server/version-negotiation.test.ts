import { describe, it, expect } from 'vitest';
import { negotiateVersion } from '../../src/server/version-negotiation';

function reqWithVersion(version: string | undefined): Request {
  const headers = new Headers();
  if (version !== undefined) headers.set('X-Experience-API-Version', version);
  return new Request('https://lrs.example.com/statements', { headers });
}

describe('negotiateVersion', () => {
  it('accepts 1.0.3', () => {
    const result = negotiateVersion(reqWithVersion('1.0.3'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('1.0.3');
  });

  it('normalizes 1.0 to 1.0.3', () => {
    const result = negotiateVersion(reqWithVersion('1.0'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('1.0.3');
  });

  it('accepts 2.0', () => {
    const result = negotiateVersion(reqWithVersion('2.0'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe('2.0');
  });

  it('rejects a missing header (400)', () => {
    const result = negotiateVersion(reqWithVersion(undefined));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(400);
  });

  it('rejects an unsupported version (400)', () => {
    const result = negotiateVersion(reqWithVersion('3.0'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(400);
  });
});
