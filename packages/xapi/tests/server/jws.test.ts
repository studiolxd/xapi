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
    const [headerB64, payloadB64, signatureB64] = jws.split('.');
    // Tamper with the FIRST signature character, which always carries six
    // significant bits. The last character of a 256-byte (RS256) base64url
    // signature carries only two significant bits plus discarded padding, so
    // flipping it decodes to the same bytes ~25% of the time, leaving the
    // signature intact and the assertion flaky.
    const swapped = signatureB64[0] === 'A' ? 'B' : 'A';
    const tampered = `${headerB64}.${payloadB64}.${swapped}${signatureB64.slice(1)}`;
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
