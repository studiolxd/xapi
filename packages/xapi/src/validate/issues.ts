/** A single problem found while validating a statement or document. */
export interface ValidationIssue {
  /** Dot/bracket path into the value that failed, e.g. `"actor.mbox"`. */
  path: string;
  /** Short machine-readable rule identifier, e.g. `"missing-ifi"`. */
  rule: string;
  /** Human-readable explanation. */
  message: string;
}
