import { describe, it, expect } from 'vitest';
import { validateStatement } from '../../src/validate/statement';
import type { Statement } from '../../src/types/statement';

function validStatement(): Statement {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    actor: { mbox: 'mailto:learner@example.com' },
    verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { en: 'completed' } },
    object: { id: 'https://example.com/course/1' },
    timestamp: '2026-07-22T10:00:00Z',
  };
}

describe('validateStatement', () => {
  it('accepts a well-formed statement', () => {
    const result = validateStatement(validStatement(), { version: '1.0.3' });
    expect(result.ok).toBe(true);
  });

  it('rejects an actor with no identifier', () => {
    const statement = validStatement();
    statement.actor = {}; // no mbox/mbox_sha1sum/openid/account — malformed on purpose
    const result = validateStatement(statement, { version: '1.0.3' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.some((i) => i.path === 'actor')).toBe(true);
    }
  });

  it('rejects a verb with a malformed IRI', () => {
    const statement = validStatement();
    statement.verb = { id: 'not a valid iri' };
    const result = validateStatement(statement, { version: '1.0.3' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.some((i) => i.path === 'verb.id')).toBe(true);
    }
  });

  it('rejects a non-UUID id', () => {
    const statement = validStatement();
    statement.id = 'not-a-uuid';
    const result = validateStatement(statement, { version: '1.0.3' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.some((i) => i.path === 'id')).toBe(true);
    }
  });

  it('rejects a non-ISO-8601 timestamp', () => {
    const statement = validStatement();
    statement.timestamp = 'not-a-date';
    const result = validateStatement(statement, { version: '1.0.3' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.some((i) => i.path === 'timestamp')).toBe(true);
    }
  });

  it('accumulates every issue instead of stopping at the first one', () => {
    const statement: Statement = {
      actor: {}, // no mbox/mbox_sha1sum/openid/account — malformed on purpose
      verb: { id: 'bad' },
      object: { id: 'also bad' },
      id: 'not-a-uuid',
      timestamp: 'not-a-date',
    };
    const result = validateStatement(statement, { version: '1.0.3' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('accepts an anonymous group with members and no IFI of its own', () => {
    const statement = validStatement();
    statement.actor = {
      objectType: 'Group',
      member: [{ mbox: 'mailto:a@example.com' }, { mbox: 'mailto:b@example.com' }],
    };
    const result = validateStatement(statement, { version: '1.0.3' });
    expect(result.ok).toBe(true);
  });
});
