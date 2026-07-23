import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';
import type { Actor } from '../types/statement';
import type { XapiClientOptions } from '../types/options';
import { createXapiClient } from '../client/create-xapi-client';
import type { XapiClient } from '../client/create-xapi-client';

/** Parameters extracted from a TinCan/Rustici-style xAPI launch URL. */
export interface XapiLaunchParams {
  endpoint: string;
  /** Raw `Authorization` header value (e.g. `"Basic dXNlcjpwYXNz"`), or `null` if absent. */
  auth: string | null;
  actor: Actor | null;
  registration: string | null;
  activityId: string | null;
}

function usageErr(operation: string, message: string): XapiError {
  return new XapiError({ kind: 'usage', operation, endpoint: null, status: null, responseBody: message, issues: [] });
}

function validationErr(operation: string, message: string): XapiError {
  return new XapiError({
    kind: 'validation',
    operation,
    endpoint: null,
    status: null,
    responseBody: null,
    issues: [{ path: 'actor', rule: 'json', message }],
  });
}

/**
 * Parse the query params of a TinCan/Rustici-style xAPI launch URL: `endpoint`, `auth`,
 * `actor` (JSON-encoded {@link Actor}), `registration`, `activity_id`. SSR-safe — pass `url`
 * explicitly wherever `window` isn't available; without it in that environment this returns
 * `err`, it never throws.
 *
 * @example
 * ```ts
 * const result = parseXapiLaunch();
 * if (result.ok) console.log(result.value.endpoint);
 * ```
 */
export function parseXapiLaunch(url?: string): Result<XapiLaunchParams, XapiError> {
  const href = url ?? (typeof window === 'undefined' ? undefined : window.location.href);
  if (!href) {
    return err(usageErr('parseXapiLaunch', 'no `url` was given and `window` is not available (SSR/Node)'));
  }

  const params = new URL(href).searchParams;
  const endpoint = params.get('endpoint');
  if (!endpoint) {
    return err(usageErr('parseXapiLaunch', 'the launch URL is missing the required `endpoint` param'));
  }

  const actorRaw = params.get('actor');
  let actor: Actor | null = null;
  if (actorRaw) {
    try {
      actor = JSON.parse(actorRaw) as Actor;
    } catch {
      return err(validationErr('parseXapiLaunch', `\`actor\` param is not valid JSON: "${actorRaw}"`));
    }
  }

  return ok({
    endpoint,
    auth: params.get('auth'),
    actor,
    registration: params.get('registration'),
    activityId: params.get('activity_id'),
  });
}

/**
 * Parse a launch URL and build a ready-to-use {@link XapiClient} from it in one step.
 * `extra` is merged on top of the launch-derived options — `extra` wins on any conflicting
 * key, including `endpoint`/`auth`, and `extra.defaults` is merged with (not replaced by)
 * the actor/registration carried in the launch URL.
 *
 * @example
 * ```ts
 * const result = createXapiClientFromLaunch();
 * if (result.ok) await result.value.sendStatement(result.value.buildStatement({ verb, object }));
 * ```
 */
export function createXapiClientFromLaunch(
  url?: string,
  extra?: Partial<XapiClientOptions>,
): Result<XapiClient, XapiError> {
  const parsed = parseXapiLaunch(url);
  if (!parsed.ok) return parsed;

  const { endpoint, auth, actor, registration } = parsed.value;
  const defaults: NonNullable<XapiClientOptions['defaults']> = {
    ...(actor ? { actor } : {}),
    ...(registration ? { registration } : {}),
    ...extra?.defaults,
  };

  const options: XapiClientOptions = {
    endpoint,
    ...(auth ? { auth: { header: auth } } : {}),
    ...extra,
    defaults: Object.keys(defaults).length > 0 ? defaults : undefined,
  };

  return ok(createXapiClient(options));
}
