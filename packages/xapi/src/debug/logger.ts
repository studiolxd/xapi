/** Logger interface used throughout the library. */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/** Create a logger that either logs to console or does nothing. */
export function createLogger(enabled: boolean): Logger {
  const noop = () => {};
  if (!enabled) {
    return { debug: noop, warn: noop, error: noop };
  }
  return {
    debug: (msg, ...args) => console.debug(`[xapi] ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[xapi] ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[xapi] ${msg}`, ...args),
  };
}
