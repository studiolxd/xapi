import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';
import { validateStatement } from '../validate/statement';
import type { ValidationIssue } from '../validate/issues';
import type { Actor, Statement } from '../types/statement';
import type { StatementsQuery, StatementsPage } from '../types/query';
import { VERBS } from '../build/verbs';
import { normalizeStatementForVersion } from '../internal/version-adapter';
import { request } from './transport';
import type { TransportContext } from './transport';

/** The `/statements` resource of an {@link XapiClient}. */
export interface StatementsResource {
  sendStatement(statement: Statement): Promise<Result<string, XapiError>>;
  sendStatements(statements: Statement[]): Promise<Result<string[], XapiError>>;
  getStatement(id: string): Promise<Result<Statement, XapiError>>;
  getVoidedStatement(id: string): Promise<Result<Statement, XapiError>>;
  getStatements(query?: StatementsQuery): Promise<Result<StatementsPage, XapiError>>;
  getMoreStatements(more: string): Promise<Result<StatementsPage, XapiError>>;
  voidStatement(targetId: string, actor?: Actor): Promise<Result<string, XapiError>>;
}

function buildQueryString(query: StatementsQuery | undefined): string {
  if (!query) return '';
  const params = new URLSearchParams();
  if (query.agent) params.set('agent', JSON.stringify(query.agent));
  if (query.verb) params.set('verb', query.verb);
  if (query.activity) params.set('activity', query.activity);
  if (query.registration) params.set('registration', query.registration);
  if (query.related_activities !== undefined) params.set('related_activities', String(query.related_activities));
  if (query.related_agents !== undefined) params.set('related_agents', String(query.related_agents));
  if (query.since) params.set('since', query.since);
  if (query.until) params.set('until', query.until);
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.format) params.set('format', query.format);
  if (query.attachments !== undefined) params.set('attachments', String(query.attachments));
  if (query.ascending !== undefined) params.set('ascending', String(query.ascending));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function validationError(operation: string, ctx: TransportContext, issues: ValidationIssue[]): XapiError {
  return new XapiError({ kind: 'validation', operation, endpoint: ctx.endpoint, status: null, responseBody: null, issues });
}

/** Create the `/statements` resource, backed by `ctx`. */
export function createStatementsResource(
  ctx: TransportContext,
  opts: { validate: boolean; defaultActor?: Actor },
): StatementsResource {
  async function sendStatement(statement: Statement): Promise<Result<string, XapiError>> {
    const normalized = normalizeStatementForVersion(statement, ctx.version);
    if (opts.validate) {
      const validation = validateStatement(normalized, { version: ctx.version });
      if (!validation.ok) return validation;
    }

    const result = await request<string[]>(
      ctx,
      '/statements',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalized) },
      { operation: 'sendStatement' },
    );
    if (!result.ok) return result;

    const id = result.value[0];
    if (!id) {
      return err(
        new XapiError({
          kind: 'http',
          operation: 'sendStatement',
          endpoint: ctx.endpoint,
          status: null,
          responseBody: 'LRS response did not include a statement id',
          issues: [],
        }),
      );
    }
    return ok(id);
  }

  async function sendStatements(statements: Statement[]): Promise<Result<string[], XapiError>> {
    const normalized = statements.map((statement) => normalizeStatementForVersion(statement, ctx.version));

    if (opts.validate) {
      const issues: ValidationIssue[] = [];
      normalized.forEach((statement, index) => {
        const validation = validateStatement(statement, { version: ctx.version });
        if (!validation.ok) {
          issues.push(...validation.error.issues.map((issue) => ({ ...issue, path: `[${index}].${issue.path}` })));
        }
      });
      if (issues.length > 0) return err(validationError('sendStatements', ctx, issues));
    }

    return request<string[]>(
      ctx,
      '/statements',
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalized) },
      { operation: 'sendStatements' },
    );
  }

  function getStatement(id: string): Promise<Result<Statement, XapiError>> {
    return request<Statement>(
      ctx,
      `/statements?statementId=${encodeURIComponent(id)}`,
      { method: 'GET' },
      { operation: 'getStatement' },
    );
  }

  function getVoidedStatement(id: string): Promise<Result<Statement, XapiError>> {
    return request<Statement>(
      ctx,
      `/statements?voidedStatementId=${encodeURIComponent(id)}`,
      { method: 'GET' },
      { operation: 'getVoidedStatement' },
    );
  }

  function getStatements(query?: StatementsQuery): Promise<Result<StatementsPage, XapiError>> {
    return request<StatementsPage>(
      ctx,
      `/statements${buildQueryString(query)}`,
      { method: 'GET' },
      { operation: 'getStatements' },
    );
  }

  function getMoreStatements(more: string): Promise<Result<StatementsPage, XapiError>> {
    return request<StatementsPage>(ctx, more, { method: 'GET' }, { operation: 'getMoreStatements' });
  }

  async function voidStatement(targetId: string, actor?: Actor): Promise<Result<string, XapiError>> {
    const voidingActor = actor ?? opts.defaultActor;
    if (!voidingActor) {
      return err(
        new XapiError({
          kind: 'usage',
          operation: 'voidStatement',
          endpoint: ctx.endpoint,
          status: null,
          responseBody: null,
          issues: [],
        }),
      );
    }

    return sendStatement({
      actor: voidingActor,
      verb: VERBS.voided,
      object: { objectType: 'StatementRef', id: targetId },
    });
  }

  return { sendStatement, sendStatements, getStatement, getVoidedStatement, getStatements, getMoreStatements, voidStatement };
}
