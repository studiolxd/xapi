import type { Agent, Statement } from './statement';

/** Filters accepted by `GET /statements`. */
export interface StatementsQuery {
  agent?: Agent;
  verb?: string;
  activity?: string;
  registration?: string;
  related_activities?: boolean;
  related_agents?: boolean;
  /** ISO 8601 timestamp — only statements stored since this time. */
  since?: string;
  /** ISO 8601 timestamp — only statements stored until this time. */
  until?: string;
  limit?: number;
  format?: 'ids' | 'exact' | 'canonical';
  attachments?: boolean;
  ascending?: boolean;
}

/** One page of results from `GET /statements`. */
export interface StatementsPage {
  statements: Statement[];
  /** IRL to fetch the next page, or `null` if this is the last page. */
  more: string | null;
}
