// Result pattern
export { ok, err, isOk, isErr, unwrap, unwrapOr } from './result/result';
export type { Result } from './result/result';

// Errors
export { XapiError } from './errors/xapi-error';
export type { XapiErrorKind, XapiErrorInfo } from './errors/xapi-error';

// Core types
export type { XapiVersion } from './types/common';
export type {
  LanguageMap,
  Extensions,
  Account,
  Agent,
  Group,
  Actor,
  Verb,
  ActivityDefinition,
  InteractionComponent,
  Activity,
  StatementRef,
  SubStatement,
  XapiObject,
  Score,
  XapiResult,
  ContextActivities,
  Context,
  Attachment,
  Statement,
} from './types/statement';
export type { XapiDocument, StateDocOpts, ActivityProfileDocOpts, AgentProfileDocOpts, DocOpts, SetDocOpts } from './types/documents';
export type { StatementsQuery, StatementsPage } from './types/query';
export type { AboutResource } from './types/about';
export type { XapiAuth, XapiClientOptions, XapiStatus } from './types/options';

// Validation
export type { ValidationIssue } from './validate/issues';
export { isValidIri, isValidMbox, isValidUuid } from './validate/iri';
export { validateStatement } from './validate/statement';
export type { ValidateStatementOptions } from './validate/statement';

// Building
export { buildStatement } from './build/build-statement';
export type { BuildStatementInput } from './build/build-statement';
export { VERBS } from './build/verbs';
export { ACTIVITY_TYPES } from './build/activity-types';

// Debug
export { createLogger } from './debug/logger';
export type { Logger } from './debug/logger';

// Mock LRS
export { createMemoryLrs } from './mock/memory-lrs';
export type { MemoryLrsStore } from './mock/memory-lrs';

// Client
export { createXapiClient } from './client/create-xapi-client';
export type { XapiClient, XapiChangeListener, ClientBuildStatementInput } from './client/create-xapi-client';
export type { StatementsResource } from './client/statements';
export type { DocumentsResource, StateOpts, SetStateOpts } from './client/documents';
export type { ActivitiesResource, Person } from './client/activities';
export type { AboutResourceClient } from './client/about';

// Launch
export { parseXapiLaunch, createXapiClientFromLaunch } from './launch/launch';
export type { XapiLaunchParams } from './launch/launch';
