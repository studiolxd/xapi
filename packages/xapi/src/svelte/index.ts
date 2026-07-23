// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/xapi/svelte — Svelte store adapter
// ─────────────────────────────────────────────────────────────────────────────
import { readable, type Readable } from 'svelte/store';
import { createXapiClient, type XapiClient } from '../client/create-xapi-client';
import type { XapiClientOptions, XapiStatus } from '../types/options';

/** Return value of {@link createXapiStore}. */
export interface XapiStore {
  client: XapiClient;
  /** A Svelte readable store of the client status (use with `$status`). */
  status: Readable<XapiStatus>;
  /** Tear down the status listener and destroy the client. */
  destroy(): void;
}

/**
 * Create an xAPI client exposed as a Svelte store.
 *
 * @example
 * ```svelte
 * <script>
 *   import { createXapiStore } from '@studiolxd/xapi/svelte';
 *   import { onDestroy } from 'svelte';
 *   const xapi = createXapiStore({ endpoint: 'https://lrs.example.com/xapi' });
 *   const { status } = xapi;
 *   onDestroy(xapi.destroy);
 * </script>
 * {#if $status.pending}sending…{/if}
 * ```
 */
export function createXapiStore(options: XapiClientOptions): XapiStore {
  const client = createXapiClient(options);

  const status = readable<XapiStatus>(client.status, (set) => {
    // Push the *current* status to a (possibly late) subscriber, then track changes —
    // otherwise a subscriber that attaches after an early change would see the stale
    // creation-time snapshot until the next change.
    set(client.status);
    return client.on('change', set);
  });

  return {
    client,
    status,
    destroy() {
      client.destroy();
    },
  };
}
