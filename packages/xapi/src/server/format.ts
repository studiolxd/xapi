import type { Statement } from '../types/statement';

export type StatementFormat = 'ids' | 'exact' | 'canonical';

function isActorLike(obj: Record<string, unknown>): boolean {
  return (
    ('mbox' in obj || 'mbox_sha1sum' in obj || 'openid' in obj || 'account' in obj) &&
    (obj.objectType === 'Agent' || obj.objectType === 'Group' || obj.objectType === undefined)
  );
}

function looksLikeActivity(obj: Record<string, unknown>): boolean {
  return 'definition' in obj;
}

function looksLikeVerb(obj: Record<string, unknown>): boolean {
  return 'display' in obj && Object.keys(obj).every((key) => key === 'id' || key === 'display');
}

function stripToIds(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripToIds);
  if (value === null || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;

  if (isActorLike(obj)) {
    const out: Record<string, unknown> = {};
    if (obj.objectType) out.objectType = obj.objectType;
    if (obj.mbox !== undefined) out.mbox = obj.mbox;
    else if (obj.mbox_sha1sum !== undefined) out.mbox_sha1sum = obj.mbox_sha1sum;
    else if (obj.openid !== undefined) out.openid = obj.openid;
    else if (obj.account !== undefined) out.account = obj.account;
    return out;
  }

  if (typeof obj.id === 'string' && (obj.objectType === 'Activity' || (obj.objectType === undefined && looksLikeActivity(obj)))) {
    return { objectType: 'Activity', id: obj.id };
  }

  if (typeof obj.id === 'string' && looksLikeVerb(obj)) {
    return { id: obj.id };
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) out[key] = stripToIds(val);
  return out;
}

const LANG_MAP_KEYS = new Set(['display', 'name', 'description']);

function isLangMap(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}

function collapseLangMaps(value: unknown, lang: string): unknown {
  if (Array.isArray(value)) return value.map((entry) => collapseLangMaps(entry, lang));
  if (value === null || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (LANG_MAP_KEYS.has(key) && isLangMap(val)) {
      const firstKey = Object.keys(val)[0];
      out[key] = val[lang] ?? (firstKey !== undefined ? val[firstKey] : undefined);
    } else {
      out[key] = collapseLangMaps(val, lang);
    }
  }
  return out;
}

/**
 * Project a stored statement per the `format` query param xAPI's `GET /statements` supports.
 *
 * - `'exact'` (default): returned unmodified — required for forwarding integrity.
 * - `'ids'`: strips Agent/Group/Activity/Verb objects down to only their identifying
 *   properties, dropping names/descriptions/display maps.
 * - `'canonical'`: collapses language maps (`display`, `name`, `description`) to a single
 *   entry, preferring `lang` and falling back to the first available language.
 *
 * @example
 * ```ts
 * const projected = applyFormat(stored, request.format ?? 'exact', acceptLanguage);
 * ```
 */
export function applyFormat(statement: Statement, format: StatementFormat, lang = 'en'): Statement {
  if (format === 'exact') return statement;
  if (format === 'ids') return stripToIds(statement) as Statement;
  return collapseLangMaps(statement, lang) as Statement;
}
