import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';

/** Options accepted by {@link verifySignedStatement}. */
export interface VerifySignedStatementOptions {
  /** Algorithms this call will accept — reject everything else even if the signature is valid. */
  allowedAlgorithms: string[];
  /** Resolve the verification key, e.g. from the JWS header's `kid`. */
  resolveKey: (kid?: string) => Promise<CryptoKey>;
}

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(input.length + ((4 - (input.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(base64url: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(base64url))) as Record<string, unknown>;
}

const ALG_TO_SUBTLE: Record<string, { name: string; hash: string }> = {
  RS256: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  ES256: { name: 'ECDSA', hash: 'SHA-256' },
};

function jwsErr(message: string): XapiError {
  return new XapiError({
    kind: 'validation',
    operation: 'verifySignedStatement',
    endpoint: null,
    status: null,
    responseBody: null,
    issues: [{ path: 'attachments', rule: 'jws', message }],
  });
}

/**
 * Verify a compact JWS attached to a statement (the xAPI signed-statement mechanism, carried
 * as an attachment with `usageType: "http://adlnet.gov/expapi/attachments/signature"`).
 * Supports `RS256` and `ES256`, backed entirely by `crypto.subtle` — no `jose` dependency.
 * Pass a narrower `allowedAlgorithms` to reject one of the two.
 *
 * Scope note: this verifies the JWS signature and that the payload is valid JSON — it does
 * **not** itself diff the decoded payload against a `Statement` field-by-field. The spec
 * allows the signed payload to omit fields like `attachments`/`id`/`stored`, so a generic
 * byte-for-byte comparison isn't always correct; callers that need "this JWS covers exactly
 * this statement" should compare the fields that matter to them explicitly.
 *
 * @example
 * ```ts
 * const result = await verifySignedStatement(jwsCompactString, {
 *   allowedAlgorithms: ['RS256'],
 *   resolveKey: (kid) => keyStore.get(kid),
 * });
 * ```
 */
export async function verifySignedStatement(
  jws: string,
  opts: VerifySignedStatementOptions,
): Promise<Result<true, XapiError>> {
  const parts = jws.split('.');
  if (parts.length !== 3) return err(jwsErr('not a compact JWS (expected header.payload.signature)'));
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  let header: Record<string, unknown>;
  try {
    header = decodeJson(headerB64);
  } catch {
    return err(jwsErr('JWS header is not valid base64url JSON'));
  }

  try {
    decodeJson(payloadB64);
  } catch {
    return err(jwsErr('JWS payload is not valid base64url JSON'));
  }

  const alg = header.alg;
  if (typeof alg !== 'string' || !opts.allowedAlgorithms.includes(alg)) {
    return err(jwsErr(`algorithm "${String(alg)}" is not in allowedAlgorithms`));
  }
  const algSpec = ALG_TO_SUBTLE[alg];
  if (!algSpec) return err(jwsErr(`algorithm "${alg}" is not supported (only RS256/ES256)`));

  let key: CryptoKey;
  try {
    key = await opts.resolveKey(typeof header.kid === 'string' ? header.kid : undefined);
  } catch (exception) {
    return err(jwsErr(`resolveKey failed: ${exception instanceof Error ? exception.message : String(exception)}`));
  }

  const signedInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToBytes(signatureB64);
  const verifyAlgorithm = algSpec.name === 'ECDSA' ? { name: 'ECDSA', hash: algSpec.hash } : { name: algSpec.name };

  let valid: boolean;
  try {
    valid = await crypto.subtle.verify(verifyAlgorithm, key, signature as BufferSource, signedInput as BufferSource);
  } catch (exception) {
    return err(jwsErr(`signature verification threw: ${exception instanceof Error ? exception.message : String(exception)}`));
  }
  if (!valid) return err(jwsErr('signature verification failed'));

  return ok(true);
}
