import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';
import type { XapiVersion } from '../types/common';
import type { Actor, Statement } from '../types/statement';
import { isValidIri, isValidUuid } from './iri';
import type { ValidationIssue } from './issues';

/** Options accepted by {@link validateStatement}. */
export interface ValidateStatementOptions {
  version: XapiVersion;
}

const IFI_KEYS = ['mbox', 'mbox_sha1sum', 'openid', 'account'] as const;

function hasExactlyOneIfi(actor: Actor): boolean {
  return IFI_KEYS.filter((key) => actor[key] !== undefined).length === 1;
}

function checkActor(actor: Actor | undefined, path: string, issues: ValidationIssue[]): void {
  if (!actor) {
    issues.push({ path, rule: 'required', message: 'actor is required' });
    return;
  }

  // A Group may be anonymous (no IFI of its own) as long as it has members; an
  // identified Group (or any Agent) must have exactly one Inverse Functional Identifier.
  const isAnonymousGroup = actor.objectType === 'Group' && !hasAnyIfi(actor) && (actor.member?.length ?? 0) > 0;
  if (isAnonymousGroup) return;

  if (!hasExactlyOneIfi(actor)) {
    issues.push({
      path,
      rule: 'ifi',
      message: 'actor must have exactly one of mbox, mbox_sha1sum, openid, or account',
    });
  }
}

function hasAnyIfi(actor: Actor): boolean {
  return IFI_KEYS.some((key) => actor[key] !== undefined);
}

/**
 * Validate a statement's structural correctness before it is sent to an LRS.
 * Accumulates every problem found rather than stopping at the first one.
 *
 * @example
 * ```ts
 * const result = validateStatement(statement, { version: '1.0.3' });
 * if (!result.ok) {
 *   console.error(result.error.issues);
 * }
 * ```
 */
export function validateStatement(statement: Statement, opts: ValidateStatementOptions): Result<Statement, XapiError> {
  // TODO: diferencias específicas de versión, ver PLAN.md §6.5 (por ahora las mismas
  // reglas estructurales se aplican a 1.0.3 y 2.0 — `opts.version` ya se acepta para
  // no romper la firma pública cuando se implementen).
  void opts.version;
  const issues: ValidationIssue[] = [];

  checkActor(statement.actor, 'actor', issues);

  if (!statement.verb) {
    issues.push({ path: 'verb', rule: 'required', message: 'verb is required' });
  } else if (!isValidIri(statement.verb.id)) {
    issues.push({ path: 'verb.id', rule: 'iri', message: `verb.id is not a valid IRI: "${statement.verb.id}"` });
  }

  if (!statement.object) {
    issues.push({ path: 'object', rule: 'required', message: 'object is required' });
  } else if (
    (statement.object.objectType === undefined || statement.object.objectType === 'Activity') &&
    'id' in statement.object &&
    !isValidIri(statement.object.id)
  ) {
    issues.push({
      path: 'object.id',
      rule: 'iri',
      message: `object.id is not a valid IRI: "${statement.object.id}"`,
    });
  } else if (
    statement.object.objectType === 'StatementRef' &&
    !isValidUuid(statement.object.id)
  ) {
    // A StatementRef.id references another statement's UUID, not an IRI.
    issues.push({
      path: 'object.id',
      rule: 'uuid',
      message: `object.id (StatementRef) is not a valid UUID: "${statement.object.id}"`,
    });
  }

  if (statement.timestamp !== undefined && Number.isNaN(Date.parse(statement.timestamp))) {
    issues.push({
      path: 'timestamp',
      rule: 'iso8601',
      message: `timestamp is not a valid ISO 8601 date: "${statement.timestamp}"`,
    });
  }

  if (statement.id !== undefined && !isValidUuid(statement.id)) {
    issues.push({ path: 'id', rule: 'uuid', message: `id is not a valid UUID: "${statement.id}"` });
  }

  if (issues.length > 0) {
    return err(
      new XapiError({
        kind: 'validation',
        operation: 'validateStatement',
        endpoint: null,
        status: null,
        responseBody: null,
        issues,
      }),
    );
  }

  return ok(statement);
}
