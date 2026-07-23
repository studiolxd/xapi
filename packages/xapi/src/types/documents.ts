import type { Agent } from './statement';

/** A document fetched from a State, Activity Profile or Agent Profile resource. */
export interface XapiDocument {
  /** Parsed content when `contentType` is JSON; otherwise identical to `raw`. */
  content: unknown;
  contentType: string;
  /** The document's current ETag, if the LRS returned one. */
  etag: string | null;
  /** The exact response body, unparsed. */
  raw: string;
}

/** Parameters identifying a single State document. */
export interface StateDocOpts {
  activityId: string;
  agent?: Agent;
  registration?: string;
  stateId: string;
}

/** Parameters identifying a single Activity Profile document. */
export interface ActivityProfileDocOpts {
  activityId: string;
  profileId: string;
}

/** Parameters identifying a single Agent Profile document. */
export interface AgentProfileDocOpts {
  agent?: Agent;
  profileId: string;
}

/** Common shape for the params accepted by the get/set/delete document methods. */
export type DocOpts = StateDocOpts | ActivityProfileDocOpts | AgentProfileDocOpts;

/** Extra options accepted by `set*` document methods. */
export interface SetDocOpts {
  /** Send `If-Match` with this ETag instead of letting the client manage concurrency. */
  etag?: string;
  /** Content-Type of `value`. Defaults to `application/json` for JSON-serializable values. */
  contentType?: string;
}
