import { describe, it, expect } from 'vitest';
import {
  normalizeStatementForVersion,
  isSupportedVersionHeader,
  normalizeVersionHeader,
} from '../../src/internal/version-adapter';
import type { Statement } from '../../src/types/statement';

function statementWithContextAgents(): Statement {
  return {
    actor: { mbox: 'mailto:a@example.com' },
    verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
    object: { id: 'https://example.com/1' },
    context: {
      registration: 'reg-1',
      contextAgents: [{ objectType: 'contextAgent', agent: { mbox: 'mailto:b@example.com' } }],
    },
  };
}

describe('normalizeStatementForVersion', () => {
  it('strips contextAgents/contextGroups for 1.0.3, keeping the rest of context', () => {
    const normalized = normalizeStatementForVersion(statementWithContextAgents(), '1.0.3');
    expect(normalized.context?.registration).toBe('reg-1');
    expect(normalized.context && 'contextAgents' in normalized.context).toBe(false);
  });

  it('drops context entirely if only 2.0-only fields were present', () => {
    const statement: Statement = {
      actor: { mbox: 'mailto:a@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
      object: { id: 'https://example.com/1' },
      context: { contextAgents: [{ objectType: 'contextAgent', agent: { mbox: 'mailto:b@example.com' } }] },
    };
    const normalized = normalizeStatementForVersion(statement, '1.0.3');
    expect(normalized.context).toBeUndefined();
  });

  it('leaves the statement untouched for 2.0', () => {
    const statement = statementWithContextAgents();
    const normalized = normalizeStatementForVersion(statement, '2.0');
    expect(normalized).toBe(statement);
  });

  it('is a no-op when there is no context', () => {
    const statement: Statement = {
      actor: { mbox: 'mailto:a@example.com' },
      verb: { id: 'http://adlnet.gov/expapi/verbs/completed' },
      object: { id: 'https://example.com/1' },
    };
    expect(normalizeStatementForVersion(statement, '1.0.3')).toBe(statement);
  });
});

describe('isSupportedVersionHeader / normalizeVersionHeader', () => {
  it('accepts the 1.0.x family and 2.0', () => {
    for (const v of ['1.0', '1.0.0', '1.0.1', '1.0.2', '1.0.3', '2.0']) {
      expect(isSupportedVersionHeader(v)).toBe(true);
    }
  });

  it('rejects null and unknown versions', () => {
    expect(isSupportedVersionHeader(null)).toBe(false);
    expect(isSupportedVersionHeader('3.0')).toBe(false);
    expect(isSupportedVersionHeader('')).toBe(false);
  });

  it('normalizes any 1.0.x variant to 1.0.3, and leaves 2.0 alone', () => {
    expect(normalizeVersionHeader('1.0')).toBe('1.0.3');
    expect(normalizeVersionHeader('1.0.2')).toBe('1.0.3');
    expect(normalizeVersionHeader('2.0')).toBe('2.0');
  });
});
