import { describe, it, expect } from 'vitest';
import { applyFormat } from '../../src/server/format';
import type { Statement } from '../../src/types/statement';

function richStatement(): Statement {
  return {
    id: 'stmt-1',
    actor: { objectType: 'Agent', name: 'Learner Name', mbox: 'mailto:a@example.com' },
    verb: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { en: 'completed', es: 'completado' } },
    object: {
      objectType: 'Activity',
      id: 'https://example.com/1',
      definition: { name: { en: 'Course', es: 'Curso' } },
    },
  };
}

describe('applyFormat', () => {
  it('exact returns the statement unmodified', () => {
    const statement = richStatement();
    expect(applyFormat(statement, 'exact')).toBe(statement);
  });

  it('ids strips actor/verb/activity down to identifying properties', () => {
    const result = applyFormat(richStatement(), 'ids') as unknown as Record<string, unknown>;
    expect(result.actor).toEqual({ objectType: 'Agent', mbox: 'mailto:a@example.com' });
    expect(result.verb).toEqual({ id: 'http://adlnet.gov/expapi/verbs/completed' });
    expect(result.object).toEqual({ objectType: 'Activity', id: 'https://example.com/1' });
  });

  it('canonical collapses language maps to one preferred language', () => {
    const result = applyFormat(richStatement(), 'canonical', 'es') as unknown as {
      verb: { display: unknown };
      object: { definition: { name: unknown } };
    };
    expect(result.verb.display).toBe('completado');
    expect(result.object.definition.name).toBe('Curso');
  });

  it('canonical falls back to the first available language', () => {
    const statement = richStatement();
    const result = applyFormat(statement, 'canonical', 'fr') as unknown as { verb: { display: unknown } };
    expect(result.verb.display).toBe('completed');
  });
});
