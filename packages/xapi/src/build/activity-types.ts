/**
 * Common activity type IRIs from the ADL and Tin Can vocabularies, for use in
 * `Activity.definition.type`.
 *
 * @example
 * ```ts
 * buildStatement({
 *   actor, verb: VERBS.completed,
 *   object: { id: 'https://example.com/course/1', definition: { type: ACTIVITY_TYPES.course } },
 * });
 * ```
 */
export const ACTIVITY_TYPES: Record<string, string> = {
  course: 'http://adlnet.gov/expapi/activities/course',
  module: 'http://adlnet.gov/expapi/activities/module',
  meeting: 'http://adlnet.gov/expapi/activities/meeting',
  media: 'http://adlnet.gov/expapi/activities/media',
  performance: 'http://adlnet.gov/expapi/activities/performance',
  simulation: 'http://adlnet.gov/expapi/activities/simulation',
  assessment: 'http://adlnet.gov/expapi/activities/assessment',
  interaction: 'http://adlnet.gov/expapi/activities/interaction',
  cmiInteraction: 'http://adlnet.gov/expapi/activities/cmi.interaction',
  question: 'http://adlnet.gov/expapi/activities/question',
  objective: 'http://adlnet.gov/expapi/activities/objective',
  lesson: 'http://adlnet.gov/expapi/activities/link',
  video: 'http://id.tincanapi.com/activitytype/video',
};
