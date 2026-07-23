import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute the ETag for a document's content, per the xAPI Document APIs' conditional-request
 * requirements. Uses SHA-1 via `crypto.subtle` — a Web API, so this runs anywhere (Node ≥18,
 * workers, browsers) without a `node:crypto` import.
 */
export async function etagFor(content: string | Uint8Array): Promise<string> {
  const bytes = typeof content === 'string' ? encoder.encode(content) : content;
  const digest = await crypto.subtle.digest('SHA-1', bytes as BufferSource);
  return `"${toHex(digest)}"`;
}

function conditionalErr(status: 409 | 412, message: string): XapiError {
  return new XapiError({
    kind: 'http',
    operation: 'checkConditionalHeaders',
    endpoint: null,
    status,
    responseBody: message,
    issues: [],
  });
}

/**
 * Standard HTTP conditional-request semantics applied to xAPI's Document APIs
 * (State / Activity Profile / Agent Profile):
 *
 * - No `If-Match`/`If-None-Match` on an existing resource → 409 (ambiguous intent — the
 *   client didn't say what it expected to overwrite).
 * - `If-Match` given but doesn't match the current ETag → 412.
 * - `If-Match` given on a resource that doesn't exist yet → 412 (nothing to match).
 * - `If-None-Match: *` given but the resource already exists → 412.
 * - No resource yet and no conditional headers → allowed (first write).
 *
 * @example
 * ```ts
 * const check = checkConditionalHeaders(request, existingEtag);
 * if (!check.ok) return new Response(check.error.responseBody, { status: check.error.status! });
 * ```
 */
export function checkConditionalHeaders(req: Request, currentEtag: string | null): Result<true, XapiError> {
  const ifMatch = req.headers.get('If-Match');
  const ifNoneMatch = req.headers.get('If-None-Match');

  if (currentEtag === null) {
    if (ifMatch) return err(conditionalErr(412, 'If-Match given but the resource does not exist'));
    return ok(true);
  }

  if (!ifMatch && !ifNoneMatch) {
    return err(conditionalErr(409, 'resource exists — resend with If-Match (or If-None-Match: *) to confirm intent'));
  }
  if (ifNoneMatch === '*') return err(conditionalErr(412, 'resource already exists'));
  if (ifMatch && ifMatch !== currentEtag) return err(conditionalErr(412, 'ETag mismatch'));
  return ok(true);
}
