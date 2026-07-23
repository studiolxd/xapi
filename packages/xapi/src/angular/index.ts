// ─────────────────────────────────────────────────────────────────────────────
// @studiolxd/xapi/angular — Angular adapter (Angular >= 17)
//
// Decorator-free by design: ships only an InjectionToken + a functional provider,
// so it builds as plain ESM (no ng-packagr / Angular Package Format required) and
// is consumed by the app's own compiler. Requires Angular 17+ (stable signals,
// esbuild builder, standalone APIs).
// ─────────────────────────────────────────────────────────────────────────────
import { InjectionToken, inject, DestroyRef, signal, type Signal, type Provider } from '@angular/core';
import { createXapiClient, type XapiClient } from '../client/create-xapi-client';
import type { XapiClientOptions, XapiStatus } from '../types/options';

/** What {@link XAPI} injects: the client plus a reactive status signal. */
export interface XapiHandle {
  client: XapiClient;
  /** Reactive status signal — call `status()` to read; updates on every request. */
  status: Signal<XapiStatus>;
}

/** Injection token for the xAPI client handle. Inject with `inject(XAPI)`. */
export const XAPI = new InjectionToken<XapiHandle>('@studiolxd/xapi');

/**
 * Provide an xAPI client to an Angular application or component.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [provideXapi({ endpoint: 'https://lrs.example.com/xapi' })],
 * });
 * // in a component:
 * const { client, status } = inject(XAPI);   // status() is a signal
 * ```
 */
export function provideXapi(options: XapiClientOptions): Provider {
  return {
    provide: XAPI,
    useFactory: (): XapiHandle => {
      const client = createXapiClient(options);
      const status = signal<XapiStatus>(client.status);
      const off = client.on('change', (s) => status.set(s));

      inject(DestroyRef).onDestroy(() => {
        off();
        client.destroy();
      });

      return { client, status: status.asReadonly() };
    },
  };
}
