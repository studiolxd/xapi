import type { Verb } from '../types/statement';

/**
 * Common verbs from the ADL vocabulary, ready to use in {@link buildStatement}.
 * The classic set (`completed`, `passed`, …) is defined at `adlnet.gov`; `progressed`
 * and `launched` were added later under the `w3id.org/xapi/adl` vocabulary.
 *
 * @example
 * ```ts
 * buildStatement({ actor, verb: VERBS.completed, object: 'https://example.com/course/1' });
 * ```
 */
export const VERBS = {
  completed: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
  passed: { id: 'http://adlnet.gov/expapi/verbs/passed', display: { en: 'passed' } },
  failed: { id: 'http://adlnet.gov/expapi/verbs/failed', display: { en: 'failed' } },
  answered: { id: 'http://adlnet.gov/expapi/verbs/answered', display: { en: 'answered' } },
  attempted: { id: 'http://adlnet.gov/expapi/verbs/attempted', display: { en: 'attempted' } },
  experienced: { id: 'http://adlnet.gov/expapi/verbs/experienced', display: { en: 'experienced' } },
  initialized: { id: 'http://adlnet.gov/expapi/verbs/initialized', display: { en: 'initialized' } },
  terminated: { id: 'http://adlnet.gov/expapi/verbs/terminated', display: { en: 'terminated' } },
  responded: { id: 'http://adlnet.gov/expapi/verbs/responded', display: { en: 'responded' } },
  interacted: { id: 'http://adlnet.gov/expapi/verbs/interacted', display: { en: 'interacted' } },
  voided: { id: 'http://adlnet.gov/expapi/verbs/voided', display: { en: 'voided' } },
  launched: { id: 'https://w3id.org/xapi/adl/verbs/launched', display: { en: 'launched' } },
  progressed: { id: 'https://w3id.org/xapi/adl/verbs/progressed', display: { en: 'progressed' } },
} satisfies Record<string, Verb>;
