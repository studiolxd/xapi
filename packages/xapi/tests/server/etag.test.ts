import { describe, it, expect } from 'vitest';
import { etagFor, checkConditionalHeaders } from '../../src/server/etag';

function reqWithHeaders(headers: Record<string, string>): Request {
  return new Request('https://lrs.example.com/activities/state', { headers });
}

describe('etagFor', () => {
  it('is deterministic for the same content', async () => {
    const a = await etagFor('hello world');
    const b = await etagFor('hello world');
    expect(a).toBe(b);
  });

  it('differs for different content', async () => {
    const a = await etagFor('hello');
    const b = await etagFor('world');
    expect(a).not.toBe(b);
  });

  it('is quoted', async () => {
    const etag = await etagFor('x');
    expect(etag.startsWith('"')).toBe(true);
    expect(etag.endsWith('"')).toBe(true);
  });
});

describe('checkConditionalHeaders', () => {
  it('allows a first write with no existing document and no headers', () => {
    const result = checkConditionalHeaders(reqWithHeaders({}), null);
    expect(result.ok).toBe(true);
  });

  it('rejects If-Match on a document that does not exist yet (412)', () => {
    const result = checkConditionalHeaders(reqWithHeaders({ 'If-Match': '"abc"' }), null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(412);
  });

  it('requires a conditional header when the document already exists (409)', () => {
    const result = checkConditionalHeaders(reqWithHeaders({}), '"abc"');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(409);
  });

  it('rejects If-None-Match: * when the document already exists (412)', () => {
    const result = checkConditionalHeaders(reqWithHeaders({ 'If-None-Match': '*' }), '"abc"');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(412);
  });

  it('rejects a mismatched If-Match (412)', () => {
    const result = checkConditionalHeaders(reqWithHeaders({ 'If-Match': '"wrong"' }), '"abc"');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.status).toBe(412);
  });

  it('allows a matching If-Match', () => {
    const result = checkConditionalHeaders(reqWithHeaders({ 'If-Match': '"abc"' }), '"abc"');
    expect(result.ok).toBe(true);
  });
});
