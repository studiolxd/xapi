import { describe, it, expect } from 'vitest';
import { buildMultipartBody, parseMultipartBody } from '../../src/internal/multipart';

describe('multipart', () => {
  it('round-trips a body with no attachments', () => {
    const json = JSON.stringify({ actor: {}, verb: { id: 'x' }, object: { id: 'y' } });
    const { body, contentType } = buildMultipartBody(json, []);
    const parsed = parseMultipartBody(body, contentType);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.statementsJson).toBe(json);
      expect(parsed.value.attachments).toHaveLength(0);
    }
  });

  it('round-trips a body with binary attachments byte-for-byte', () => {
    const json = JSON.stringify({ id: 'stmt-1' });
    const data1 = new Uint8Array([0, 1, 2, 255, 254, 253, 10, 13]);
    const data2 = new Uint8Array(Array.from({ length: 300 }, (_, i) => i % 256));

    const { body, contentType } = buildMultipartBody(json, [
      { sha2: 'hash-1', contentType: 'application/octet-stream', data: data1 },
      { sha2: 'hash-2', contentType: 'image/png', data: data2 },
    ]);

    const parsed = parseMultipartBody(body, contentType);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.statementsJson).toBe(json);
    expect(parsed.value.attachments).toHaveLength(2);
    expect(parsed.value.attachments[0]?.hash).toBe('hash-1');
    expect(parsed.value.attachments[0]?.contentType).toBe('application/octet-stream');
    expect(Array.from(parsed.value.attachments[0]?.data ?? [])).toEqual(Array.from(data1));
    expect(parsed.value.attachments[1]?.hash).toBe('hash-2');
    expect(Array.from(parsed.value.attachments[1]?.data ?? [])).toEqual(Array.from(data2));
  });

  it('rejects a Content-Type without a boundary', () => {
    const result = parseMultipartBody(new TextEncoder().encode('irrelevant'), 'multipart/mixed');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('validation');
  });

  it('rejects a malformed body', () => {
    const result = parseMultipartBody(new TextEncoder().encode('garbage'), 'multipart/mixed; boundary=xyz');
    expect(result.ok).toBe(false);
  });
});
