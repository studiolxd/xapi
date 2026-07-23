import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';
import type { XapiVersion } from '../types/common';
import { isSupportedVersionHeader, normalizeVersionHeader } from '../internal/version-adapter';

/**
 * Validate and resolve the `X-Experience-API-Version` header of an incoming `Request`,
 * per the xAPI conformance requirement that a LRS reject requests with a missing or
 * unsupported version header (400).
 *
 * @example
 * ```ts
 * const negotiated = negotiateVersion(request);
 * if (!negotiated.ok) return new Response(null, { status: 400 });
 * ```
 */
export function negotiateVersion(req: Request): Result<XapiVersion, XapiError> {
  const header = req.headers.get('X-Experience-API-Version');
  if (!isSupportedVersionHeader(header)) {
    return err(
      new XapiError({
        kind: 'version',
        operation: 'negotiateVersion',
        endpoint: null,
        status: 400,
        responseBody: header
          ? `unsupported X-Experience-API-Version: "${header}"`
          : 'missing X-Experience-API-Version header',
        issues: [],
      }),
    );
  }
  return ok(normalizeVersionHeader(header as string));
}
