import type { ValidationIssue } from '../validate/issues';

/** What kind of failure produced this {@link XapiError}. */
export type XapiErrorKind = 'network' | 'http' | 'validation' | 'timeout' | 'version' | 'usage';

/** All fields that describe an xAPI error. */
export interface XapiErrorInfo {
  /** Category of failure — determines which other fields are populated. */
  kind: XapiErrorKind;
  /** What operation was attempted (e.g. 'sendStatement', 'getState'). */
  operation: string;
  /** The LRS endpoint the request was made against, if known. */
  endpoint: string | null;
  /** HTTP status code, populated when `kind === 'http'`. */
  status: number | null;
  /** Response body from the LRS, truncated to 2 KB, when `kind === 'http'`. */
  responseBody: string | null;
  /** Validation problems found, populated when `kind === 'validation'`. */
  issues: ValidationIssue[];
  /** The underlying exception, if any (e.g. a `TypeError` from `fetch`). */
  exception?: Error;
}

const MAX_RESPONSE_BODY_LENGTH = 2048;

/** Typed error class for all `@studiolxd/xapi` operations. Never thrown across the public API. */
export class XapiError extends Error implements XapiErrorInfo {
  public readonly kind: XapiErrorKind;
  public readonly operation: string;
  public readonly endpoint: string | null;
  public readonly status: number | null;
  public readonly responseBody: string | null;
  public readonly issues: ValidationIssue[];
  public readonly exception?: Error;

  constructor(info: XapiErrorInfo) {
    super(formatMessage(info));
    this.name = 'XapiError';
    this.kind = info.kind;
    this.operation = info.operation;
    this.endpoint = info.endpoint;
    this.status = info.status;
    this.responseBody =
      info.responseBody && info.responseBody.length > MAX_RESPONSE_BODY_LENGTH
        ? `${info.responseBody.slice(0, MAX_RESPONSE_BODY_LENGTH)}…`
        : info.responseBody;
    this.issues = info.issues;
    this.exception = info.exception;
  }
}

function formatMessage(info: XapiErrorInfo): string {
  const parts = [`xAPI ${info.kind} error during ${info.operation}`];

  if (info.status !== null) parts.push(`(HTTP ${info.status})`);
  if (info.endpoint) parts.push(`against ${info.endpoint}`);

  if (info.kind === 'validation' && info.issues.length > 0) {
    const summary = info.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    parts.push(`— ${summary}`);
  } else if (info.exception) {
    parts.push(`— ${info.exception.message}`);
  }

  return parts.join(' ');
}
