import { describe, it, expect } from 'vitest';
import { verifySignedStatement } from '../../src/server/jws';

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJws(alg: 'RS256', header: Record<string, unknown>, payload: Record<string, unknown>) {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  );

  const headerB64 = base64Url(new TextEncoder().encode(JSON.stringify({ alg, ...header })));
  const payloadB64 = base64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    keyPair.privateKey,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );

  return { jws: `${headerB64}.${payloadB64}.${base64Url(new Uint8Array(signature))}`, publicKey: keyPair.publicKey };
}

describe('verifySignedStatement', () => {
  it('verifies a valid RS256 JWS', async () => {
    const { jws, publicKey } = await signJws('RS256', {}, { hello: 'world' });
    const result = await verifySignedStatement(jws, {
      allowedAlgorithms: ['RS256'],
      resolveKey: async () => publicKey,
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a tampered signature', async () => {
    const { jws, publicKey } = await signJws('RS256', {}, { hello: 'world' });
    const lastChar = jws.slice(-1);
    const swapped = lastChar === 'A' ? 'B' : 'A';
    const tampered = jws.slice(0, -1) + swapped;
    const result = await verifySignedStatement(tampered, {
      allowedAlgorithms: ['RS256'],
      resolveKey: async () => publicKey,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a disallowed algorithm even if the signature is valid', async () => {
    const { jws, publicKey } = await signJws('RS256', {}, { hello: 'world' });
    const result = await verifySignedStatement(jws, {
      allowedAlgorithms: ['ES256'],
      resolveKey: async () => publicKey,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a malformed JWS', async () => {
    const result = await verifySignedStatement('not-a-jws', {
      allowedAlgorithms: ['RS256'],
      resolveKey: async () => {
        throw new Error('should not be called');
      },
    });
    expect(result.ok).toBe(false);
  });
});
