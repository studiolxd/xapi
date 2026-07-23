import { describe, it, expect } from 'vitest';
import { buildStatement } from '../../src/build/build-statement';
import { VERBS } from '../../src/build/verbs';

describe('buildStatement', () => {
  it('generates an id and timestamp when omitted', () => {
    const statement = buildStatement({
      actor: { mbox: 'mailto:learner@example.com' },
      verb: VERBS.completed,
      object: 'https://example.com/course/1',
    });

    expect(statement.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(statement.timestamp).toBeDefined();
    expect(Number.isNaN(Date.parse(statement.timestamp!))).toBe(false);
  });

  it('preserves an explicit id and timestamp', () => {
    const statement = buildStatement({
      id: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2026-07-22T10:00:00Z',
      actor: { mbox: 'mailto:learner@example.com' },
      verb: VERBS.completed,
      object: 'https://example.com/course/1',
    });

    expect(statement.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(statement.timestamp).toBe('2026-07-22T10:00:00Z');
  });

  it('resolves a known verb IRI string to its full display', () => {
    const statement = buildStatement({
      actor: { mbox: 'mailto:learner@example.com' },
      verb: 'http://adlnet.gov/expapi/verbs/completed',
      object: 'https://example.com/course/1',
    });

    expect(statement.verb).toEqual(VERBS.completed);
  });

  it('resolves an unknown verb IRI string to a bare verb with no display', () => {
    const statement = buildStatement({
      actor: { mbox: 'mailto:learner@example.com' },
      verb: 'https://example.com/verbs/custom',
      object: 'https://example.com/course/1',
    });

    expect(statement.verb).toEqual({ id: 'https://example.com/verbs/custom' });
  });

  it('resolves an object IRI string to a minimal Activity', () => {
    const statement = buildStatement({
      actor: { mbox: 'mailto:learner@example.com' },
      verb: VERBS.completed,
      object: 'https://example.com/course/1',
    });

    expect(statement.object).toEqual({ objectType: 'Activity', id: 'https://example.com/course/1' });
  });

  it('passes through a full verb or object object unchanged', () => {
    const verb = { id: 'https://example.com/verbs/custom', display: { en: 'did a thing' } };
    const object = { objectType: 'Activity' as const, id: 'https://example.com/course/1', definition: { name: { en: 'Course 1' } } };

    const statement = buildStatement({ actor: { mbox: 'mailto:learner@example.com' }, verb, object });

    expect(statement.verb).toEqual(verb);
    expect(statement.object).toEqual(object);
  });
});
