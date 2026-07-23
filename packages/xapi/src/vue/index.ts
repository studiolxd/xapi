// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/xapi/vue — Vue 3 composable
// ─────────────────────────────────────────────────────────────────────────────
import { shallowRef, onScopeDispose, getCurrentScope, type ShallowRef } from 'vue';
import { createXapiClient, type XapiClient } from '../client/create-xapi-client';
import type { XapiClientOptions, XapiStatus } from '../types/options';

/** Return value of {@link useXapiClient}. */
export interface UseXapiClientReturn {
  client: XapiClient;
  /** Reactive status. Updates on every request start/settle/error. */
  status: ShallowRef<XapiStatus>;
  /**
   * Tear down the status listener and destroy the client. Called automatically on
   * scope dispose when used inside a component `setup()`. Call it manually when
   * using this composable outside an effect scope.
   */
  destroy: () => void;
}

/**
 * Vue composable that creates an xAPI client bound to the component scope. The
 * client is destroyed automatically on `onScopeDispose`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useXapiClient } from '@studiolxd/xapi/vue';
 * const { client, status } = useXapiClient({ endpoint: 'https://lrs.example.com/xapi' });
 * </script>
 * <template><p v-if="status.pending">sending…</p></template>
 * ```
 */
export function useXapiClient(options: XapiClientOptions): UseXapiClientReturn {
  const client = createXapiClient(options);
  const status = shallowRef<XapiStatus>(client.status);
  const off = client.on('change', (s) => {
    status.value = s;
  });

  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    off();
    client.destroy();
  };

  // Auto-clean only when there is an active effect scope (i.e. inside setup()).
  // Outside a scope, onScopeDispose is a no-op, so the caller uses `destroy()`.
  if (getCurrentScope()) onScopeDispose(destroy);

  return { client, status, destroy };
}
