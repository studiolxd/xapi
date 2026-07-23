import type { Statement } from '../types/statement';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`;
}

/**
 * Structural equality for idempotent statement writes: the xAPI spec requires a POST/PUT
 * that reuses an existing statement `id` to succeed (204/200, no duplicate) if the content
 * is equivalent, and to fail with 409 if it differs. Ignores the LRS-authoritative `stored`
 * field, which legitimately differs between the original write and a resubmission, and is
 * tolerant of object key order (compares by sorted keys, not by JSON text).
 *
 * @example
 * ```ts
 * if (existing && !statementsEquivalent(existing, incoming)) {
 *   return new Response(null, { status: 409 });
 * }
 * ```
 */
export function statementsEquivalent(a: Statement, b: Statement): boolean {
  const { stored: _storedA, ...restA } = a;
  const { stored: _storedB, ...restB } = b;
  return stableStringify(restA) === stableStringify(restB);
}
