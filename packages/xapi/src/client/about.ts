import type { Result } from '../result/result';
import type { XapiError } from '../errors/xapi-error';
import type { AboutResource } from '../types/about';
import { request } from './transport';
import type { TransportContext } from './transport';

/** The `/about` resource of an {@link XapiClient}. */
export interface AboutResourceClient {
  about(): Promise<Result<AboutResource, XapiError>>;
}

/** Create the `/about` resource, backed by `ctx`. */
export function createAboutResource(ctx: TransportContext): AboutResourceClient {
  return {
    about: () => request<AboutResource>(ctx, '/about', { method: 'GET' }, { operation: 'about' }),
  };
}
