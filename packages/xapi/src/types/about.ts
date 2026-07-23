import type { Extensions } from './statement';

/** The response of `GET /about` — which xAPI versions the LRS supports. */
export interface AboutResource {
  version: string[];
  extensions?: Extensions;
}
