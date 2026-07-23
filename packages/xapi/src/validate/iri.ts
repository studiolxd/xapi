/**
 * Whether `value` looks like a valid IRI: non-empty, no whitespace, and starting
 * with a `scheme:` prefix. Not a full RFC 3987 validator — good enough to catch the
 * common mistakes (missing scheme, stray spaces, empty string).
 */
export function isValidIri(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (/\s/.test(value)) return false;
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\S+$/.test(value);
}

/**
 * Whether `value` is a valid `mbox` IFI: a `mailto:` IRI wrapping a plausible email
 * address, e.g. `"mailto:learner@example.com"`.
 */
export function isValidMbox(value: string): boolean {
  if (typeof value !== 'string' || !value.startsWith('mailto:')) return false;
  const email = value.slice('mailto:'.length);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Whether `value` has the canonical 8-4-4-4-12 hexadecimal UUID shape (any version). */
export function isValidUuid(value: string): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
