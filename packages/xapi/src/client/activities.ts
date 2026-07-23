import type { Result } from '../result/result';
import type { XapiError } from '../errors/xapi-error';
import type { Activity, Agent } from '../types/statement';
import { request } from './transport';
import type { TransportContext } from './transport';

/** A person profile, as returned by `GET /agents` — the union of an agent's known identifiers. */
export interface Person {
  objectType: 'Person';
  name?: string[];
  mbox?: string[];
  mbox_sha1sum?: string[];
  openid?: string[];
  account?: Array<{ homePage: string; name: string }>;
}

/** The `/activities` and `/agents` resources of an {@link XapiClient}. */
export interface ActivitiesResource {
  getActivity(activityId: string): Promise<Result<Activity, XapiError>>;
  getPerson(agent: Agent): Promise<Result<Person, XapiError>>;
}

/** Create the `/activities` and `/agents` resources, backed by `ctx`. */
export function createActivitiesResource(ctx: TransportContext): ActivitiesResource {
  return {
    getActivity: (activityId) =>
      request<Activity>(
        ctx,
        `/activities?activityId=${encodeURIComponent(activityId)}`,
        { method: 'GET' },
        { operation: 'getActivity' },
      ),
    getPerson: (agent) =>
      request<Person>(
        ctx,
        `/agents?agent=${encodeURIComponent(JSON.stringify(agent))}`,
        { method: 'GET' },
        { operation: 'getPerson' },
      ),
  };
}
