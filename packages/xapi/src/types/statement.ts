/** A map of BCP 47 language codes to localized strings, e.g. `{ en: 'Completed', es: 'Completado' }`. */
export type LanguageMap = Record<string, string>;

/** Free-form, domain-specific data attached to a statement, activity or context. Keyed by IRI. */
export type Extensions = Record<string, unknown>;

/** An xAPI account identifier: a user on a specific system, e.g. an LMS. */
export interface Account {
  /** The home page of the account's namespace, e.g. `"https://example.com"`. */
  homePage: string;
  /** The unique id of the account on that home page. */
  name: string;
}

/**
 * A single actor (person or system). Identified by exactly one of `mbox`,
 * `mbox_sha1sum`, `openid` or `account` — this is the Inverse Functional Identifier (IFI).
 */
export interface Agent {
  objectType?: 'Agent';
  name?: string;
  mbox?: string;
  mbox_sha1sum?: string;
  openid?: string;
  account?: Account;
}

/** A collection of agents. Identified (optionally) the same way as an {@link Agent}. */
export interface Group {
  objectType: 'Group';
  name?: string;
  mbox?: string;
  mbox_sha1sum?: string;
  openid?: string;
  account?: Account;
  member?: Agent[];
}

/** Who performed the action described by a statement: a single agent or a group. */
export type Actor = Agent | Group;

/** The action a statement describes, identified by an IRI. */
export interface Verb {
  id: string;
  display?: LanguageMap;
}

/**
 * Definition of an {@link Activity} — the fixed, reusable metadata about "what" was
 * interacted with, as opposed to the per-statement `result`.
 */
export interface ActivityDefinition {
  name?: LanguageMap;
  description?: LanguageMap;
  type?: string;
  moreInfo?: string;
  extensions?: Extensions;
  /** Present only when `type` is a cmi.interaction activity type. */
  interactionType?:
    | 'true-false'
    | 'choice'
    | 'fill-in'
    | 'long-fill-in'
    | 'matching'
    | 'performance'
    | 'sequencing'
    | 'likert'
    | 'numeric'
    | 'other';
  correctResponsesPattern?: string[];
  choices?: InteractionComponent[];
  scale?: InteractionComponent[];
  source?: InteractionComponent[];
  target?: InteractionComponent[];
  steps?: InteractionComponent[];
}

/** One entry of a `choice`/`scale`/`source`/`target`/`steps` interaction component list. */
export interface InteractionComponent {
  id: string;
  description?: LanguageMap;
}

/** A thing that was interacted with — the most common kind of statement `object`. */
export interface Activity {
  objectType?: 'Activity';
  id: string;
  definition?: ActivityDefinition;
}

/** A reference to another statement, e.g. the target of a voiding statement. */
export interface StatementRef {
  objectType: 'StatementRef';
  id: string;
}

/**
 * A statement nested inside another statement's `object`, used to describe one actor's
 * statement about another actor's statement (e.g. "Bob answered Alice's question").
 * Cannot itself have an `id`, `stored`, `version` or `authority`, and cannot nest further.
 */
export interface SubStatement {
  objectType: 'SubStatement';
  actor: Actor;
  verb: Verb;
  object: Activity | StatementRef | Agent | Group;
  result?: XapiResult;
  context?: Context;
  timestamp?: string;
  attachments?: Attachment[];
}

/** What a statement is about. */
export type XapiObject = Activity | StatementRef | SubStatement | Agent | Group;

/** A learner's score on a scaled (-1 to 1), raw, or bounded basis. */
export interface Score {
  scaled?: number;
  raw?: number;
  min?: number;
  max?: number;
}

/** The outcome of the statement's action, e.g. a score or completion/success flags. */
export interface XapiResult {
  completion?: boolean;
  success?: boolean;
  response?: string;
  /** ISO 8601 duration, e.g. `"PT1H30M"`. */
  duration?: string;
  score?: Score;
  extensions?: Extensions;
}

/** Related activities grouped by their relationship to the statement's main activity. */
export interface ContextActivities {
  parent?: Activity[];
  grouping?: Activity[];
  category?: Activity[];
  other?: Activity[];
}

/** Contextual information that gives a statement more meaning. */
export interface Context {
  registration?: string;
  instructor?: Agent;
  team?: Group;
  contextActivities?: ContextActivities;
  revision?: string;
  platform?: string;
  language?: string;
  statement?: StatementRef;
  extensions?: Extensions;
  /** xAPI 2.0 only — additional agents providing context. */
  contextAgents?: Array<{ objectType: 'contextAgent'; agent: Agent; relevantTypes?: string[] }>;
  /** xAPI 2.0 only — additional groups providing context. */
  contextGroups?: Array<{ objectType: 'contextGroup'; group: Group; relevantTypes?: string[] }>;
}

/** A file or binary object associated with a statement. */
export interface Attachment {
  usageType: string;
  display: LanguageMap;
  description?: LanguageMap;
  contentType: string;
  length: number;
  /** SHA-2 hash of the attachment content. */
  sha2: string;
  /** Present when the attachment is referenced by URL rather than embedded. */
  fileUrl?: string;
}

/** The core record of an xAPI experience: "actor verb object", plus optional context. */
export interface Statement {
  id?: string;
  actor: Actor;
  verb: Verb;
  object: XapiObject;
  result?: XapiResult;
  context?: Context;
  timestamp?: string;
  stored?: string;
  authority?: Actor;
  version?: string;
  attachments?: Attachment[];
}
