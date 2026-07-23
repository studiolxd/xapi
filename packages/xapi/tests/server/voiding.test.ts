import { describe, it, expect } from 'vitest';
import { isVoidingStatement, voidingTarget } from '../../src/server/voiding';
import type { Statement } from '../../src/types/statement';

describe('isVoidingStatement / voidingTarget', () => {
  it('detects a voiding statement and its target', () => {
    const statement: Statement = {
      actor: { mbox: 'mailto:a@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/voided' },
      object: { objectType: 'StatementRef', id: 'target-id' },
    };
    expect(isVoidingStatement(statement)).toBe(true);
    expect(voidingTarget(statement)).toBe('target-id');
  });

  it('is false for a non-voiding statement', () => {
    const statement: Statement = {
      actor: { mbox: 'mailto:a@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
      object: { id: 'https://example.com/1' },
    };
    expect(isVoidingStatement(statement)).toBe(false);
    expect(voidingTarget(statement)).toBeNull();
  });

  it('returns null target when the voiding verb is used with a non-StatementRef object', () => {
    const statement: Statement = {
      actor: { mbox: 'mailto:a@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/voided' },
      object: { id: 'https://example.com/1' },
    };
    expect(voidingTarget(statement)).toBeNull();
  });
});
