import type { Activity, Statement, Verb, XapiObject } from '../types/statement';
import { VERBS } from './verbs';

/**
 * Input to {@link buildStatement}. Same shape as {@link Statement}, but `verb` and
 * `object` accept a plain IRI string as shorthand, and `id`/`timestamp` are optional
 * (generated if omitted).
 */
export type BuildStatementInput = Omit<Statement, 'verb' | 'object' | 'id' | 'timestamp'> & {
  verb: string | Verb;
  object: string | XapiObject;
  id?: string;
  timestamp?: string;
};

function resolveVerb(verb: string | Verb): Verb {
  if (typeof verb !== 'string') return verb;
  const known = Object.values(VERBS).find((entry) => entry.id === verb);
  return known ?? { id: verb };
}

function resolveObject(object: string | XapiObject): XapiObject {
  if (typeof object !== 'string') return object;
  const activity: Activity = { objectType: 'Activity', id: object };
  return activity;
}

/**
 * Build a well-formed {@link Statement} from a shorthand input: verbs and objects can
 * be passed as plain IRI strings, and `id`/`timestamp` are filled in automatically.
 *
 * @example
 * ```ts
 * const statement = buildStatement({
 *   actor: { mbox: 'mailto:learner@example.com' },
 *   verb: 'http://adlnet.gov/expapi/verbs/completed',
 *   object: 'https://example.com/course/1',
 * });
 * ```
 */
export function buildStatement(input: BuildStatementInput): Statement {
  const { verb, object, id, timestamp, ...rest } = input;

  return {
    ...rest,
    id: id ?? crypto.randomUUID(),
    verb: resolveVerb(verb),
    object: resolveObject(object),
    timestamp: timestamp ?? new Date().toISOString(),
  };
}
