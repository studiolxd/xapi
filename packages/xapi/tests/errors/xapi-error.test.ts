import { describe, it, expect } from 'vitest';
import { XapiError } from '../../src/errors/xapi-error';

describe('XapiError', () => {
  it('creates error with all fields', () => {
    const error = new XapiError({
      kind: 'http',
      operation: 'sendStatement',
      endpoint: 'https://lrs.example.com/xapi',
      status: 409,
      responseBody: 'Conflict',
      issues: [],
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('XapiError');
    expect(error.kind).toBe('http');
    expect(error.operation).toBe('sendStatement');
    expect(error.endpoint).toBe('https://lrs.example.com/xapi');
    expect(error.status).toBe(409);
    expect(error.responseBody).toBe('Conflict');
    expect(error.issues).toEqual([]);
    expect(error.exception).toBeUndefined();
  });

  describe('message formatting', () => {
    it('includes kind, operation and status for http errors', () => {
      const error = new XapiError({
        kind: 'http',
        operation: 'getState',
        endpoint: 'https://lrs.example.com/xapi',
        status: 404,
        responseBody: null,
        issues: [],
      });

      expect(error.message).toContain('xAPI http error during getState');
      expect(error.message).toContain('(HTTP 404)');
      expect(error.message).toContain('against https://lrs.example.com/xapi');
    });

    it('includes issue summaries for validation errors', () => {
      const error = new XapiError({
        kind: 'validation',
        operation: 'validateStatement',
        endpoint: null,
        status: null,
        responseBody: null,
        issues: [{ path: 'actor', rule: 'required', message: 'actor is required' }],
      });

      expect(error.message).toContain('actor: actor is required');
    });

    it('includes the underlying exception message for network errors', () => {
      const error = new XapiError({
        kind: 'network',
        operation: 'sendStatement',
        endpoint: 'https://lrs.example.com/xapi',
        status: null,
        responseBody: null,
        issues: [],
        exception: new TypeError('Failed to fetch'),
      });

      expect(error.message).toContain('Failed to fetch');
    });
  });

  it('truncates response bodies longer than 2 KB', () => {
    const longBody = 'x'.repeat(3000);
    const error = new XapiError({
      kind: 'http',
      operation: 'sendStatement',
      endpoint: null,
      status: 500,
      responseBody: longBody,
      issues: [],
    });

    expect(error.responseBody).toHaveLength(2049); // 2048 chars + ellipsis
    expect(error.responseBody?.endsWith('…')).toBe(true);
  });
});
