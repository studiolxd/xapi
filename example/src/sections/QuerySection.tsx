/**
 * QuerySection — filters and pages through stored statements.
 *
 * Covers:
 *   client.getStatements(query)   — filtered GET /statements
 *   client.getMoreStatements(id)  — follows the `more` pagination cursor
 */
import { useState } from 'react';
import { useXapiClient } from '@studiolxd/xapi/react';
import type { Statement } from '@studiolxd/xapi/react';

export function QuerySection() {
  const client = useXapiClient();

  const [verb, setVerb] = useState('');
  const [activity, setActivity] = useState('');
  const [limit, setLimit] = useState('10');
  const [ascending, setAscending] = useState(false);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [more, setMore] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runQuery = async () => {
    const result = await client.getStatements({
      verb: verb || undefined,
      activity: activity || undefined,
      limit: Number(limit),
      ascending,
    });
    if (result.ok) {
      setStatements(result.value.statements);
      setMore(result.value.more);
      setError(null);
    } else {
      setError(result.error.message);
    }
  };

  const loadMore = async () => {
    if (!more) return;
    const result = await client.getMoreStatements(more);
    if (result.ok) {
      setStatements((prev) => [...prev, ...result.value.statements]);
      setMore(result.value.more);
      setError(null);
    } else {
      setError(result.error.message);
    }
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Query Statements</h2>
        <p className="section-description">
          Filter by verb, activity or agent, and page through large result sets via the{' '}
          <code>more</code> cursor the LRS returns — <code>getMoreStatements()</code> follows it
          without you having to rebuild the query.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Filters</div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="q-verb">
              Verb IRI
            </label>
            <input
              id="q-verb"
              className="field-input"
              type="text"
              placeholder="(any)"
              value={verb}
              onChange={(e) => setVerb(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="q-activity">
              Activity IRI
            </label>
            <input
              id="q-activity"
              className="field-input"
              type="text"
              placeholder="(any)"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="q-limit">
              Limit
            </label>
            <input
              id="q-limit"
              className="field-input"
              type="number"
              min="1"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <button className={`btn ${ascending ? 'btn-primary' : ''}`} onClick={() => setAscending((v) => !v)}>
            ascending: {String(ascending)}
          </button>
        </div>
        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={runQuery}>
            Run query
          </button>
          {more && (
            <button className="btn" onClick={loadMore}>
              Load more
            </button>
          )}
        </div>

        {error && <div className="result error">✗ {error}</div>}

        {statements.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="feature-block-title">{statements.length} statement(s)</div>
            <pre className="result info">{JSON.stringify(statements, null, 2)}</pre>
          </div>
        )}

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`const page = await client.getStatements({ verb: VERBS.completed.id, limit: 10 });
if (page.ok) {
  console.log(page.value.statements);
  if (page.value.more) {
    const next = await client.getMoreStatements(page.value.more);
  }
}`}</pre>
        </details>
      </div>
    </div>
  );
}
