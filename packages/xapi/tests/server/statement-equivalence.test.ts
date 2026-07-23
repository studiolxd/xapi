import { describe, it, expect } from 'vitest';
import { statementsEquivalent } from '../../src/server/statement-equivalence';
import type { Statement } from '../../src/types/statement';

function base(): Statement {
  return {
    id: 'stmt-1',
    actor: { mbox: 'mailto:a@example.com' },
    verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
    object: { id: 'https://example.com/1' },
  };
}

describe('statementsEquivalent', () => {
  it('treats identical statements as equivalent', () => {
    expect(statementsEquivalent(base(), base())).toBe(true);
  });

  it('ignores the `stored` field', () => {
    const a = { ...base(), stored: '2026-01-01T00:00:00Z' };
    const b = { ...base(), stored: '2026-02-02T00:00:00Z' };
    expect(statementsEquivalent(a, b)).toBe(true);
  });

  it('is insensitive to key order', () => {
    const a = base();
    const b: Statement = { object: a.object, verb: a.verb, actor: a.actor, id: a.id };
    expect(statementsEquivalent(a, b)).toBe(true);
  });

  it('detects a semantic difference', () => {
    const a = base();
    const b = { ...base(), verb: { id: 'http://adlnet.gov/expapi/verbs/passed' } };
    expect(statementsEquivalent(a, b)).toBe(false);
  });
});
