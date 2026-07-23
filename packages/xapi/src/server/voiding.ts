import type { Statement } from '../types/statement';
import { VERBS } from '../build/verbs';

/** Whether `statement` is a voiding statement — its verb is `VERBS.voided`. */
export function isVoidingStatement(statement: Statement): boolean {
  return statement.verb.id === VERBS.voided.id;
}

/**
 * The id of the statement being voided, or `null` if `statement` isn't a voiding statement
 * targeting a `StatementRef` (per the spec, a voiding statement's object must be one).
 */
export function voidingTarget(statement: Statement): string | null {
  if (!isVoidingStatement(statement)) return null;
  return statement.object.objectType === 'StatementRef' ? statement.object.id : null;
}
