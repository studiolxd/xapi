import type { Context, Statement } from '../types/statement';
import type { XapiVersion } from '../types/common';

/**
 * Strip xAPI 2.0-only `context` fields (`contextAgents`, `contextGroups`) before a
 * statement is sent to a 1.0.3 LRS — most 1.0.3 implementations reject or silently drop
 * unknown context fields, so stripping keeps behavior predictable on both sides of the wire.
 * A no-op for `'2.0'` and for statements without those fields.
 */
export function normalizeStatementForVersion(statement: Statement, version: XapiVersion): Statement {
  if (version === '2.0' || !statement.context) return statement;
  if (!('contextAgents' in statement.context) && !('contextGroups' in statement.context)) return statement;

  const { contextAgents: _contextAgents, contextGroups: _contextGroups, ...rest } = statement.context;
  const context: Context = rest;
  if (Object.keys(context).length === 0) {
    const { context: _omitted, ...withoutContext } = statement;
    return withoutContext;
  }
  return { ...statement, context };
}

const NORMALIZABLE_1_0_X = new Set(['1.0', '1.0.0', '1.0.1', '1.0.2', '1.0.3']);

/**
 * Whether an `X-Experience-API-Version` header value is one this client/server understands.
 * xAPI 1.0.3 implementations are required to accept the whole `1.0.x` family for backward
 * compatibility, so `'1.0'`/`'1.0.0'`/`'1.0.1'`/`'1.0.2'` are all accepted alongside `'1.0.3'`
 * and `'2.0'`. Deliberately returns a plain `boolean`, not a `value is XapiVersion` type
 * guard — `'1.0.0'` is accepted but isn't literally assignable to `XapiVersion`; use
 * {@link normalizeVersionHeader} to get the canonical `XapiVersion` once accepted.
 */
export function isSupportedVersionHeader(value: string | null): boolean {
  if (value === null) return false;
  return NORMALIZABLE_1_0_X.has(value) || value === '2.0';
}

/** Normalize an accepted `X-Experience-API-Version` value to its canonical {@link XapiVersion}. */
export function normalizeVersionHeader(value: string): XapiVersion {
  return value === '2.0' ? '2.0' : '1.0.3';
}
