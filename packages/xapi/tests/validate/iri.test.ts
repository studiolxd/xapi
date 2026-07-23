import { describe, it, expect } from 'vitest';
import { isValidIri, isValidMbox, isValidUuid } from '../../src/validate/iri';

describe('isValidIri', () => {
  it('accepts well-formed IRIs', () => {
    expect(isValidIri('http://adlnet.gov/expapi/verbs/completed')).toBe(true);
    expect(isValidIri('https://example.com/course/1')).toBe(true);
    expect(isValidIri('mailto:learner@example.com')).toBe(true);
  });

  it('rejects empty strings, whitespace and missing scheme', () => {
    expect(isValidIri('')).toBe(false);
    expect(isValidIri('not a url')).toBe(false);
    expect(isValidIri('example.com/course')).toBe(false);
  });
});

describe('isValidMbox', () => {
  it('accepts mailto IRIs with a plausible email', () => {
    expect(isValidMbox('mailto:learner@example.com')).toBe(true);
  });

  it('rejects non-mailto IRIs and malformed emails', () => {
    expect(isValidMbox('https://example.com')).toBe(false);
    expect(isValidMbox('mailto:not-an-email')).toBe(false);
    expect(isValidMbox('mailto:')).toBe(false);
  });
});

describe('isValidUuid', () => {
  it('accepts canonical UUIDs', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('rejects malformed UUIDs', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUuid('')).toBe(false);
  });
});
