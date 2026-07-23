/**
 * VoidingSection — statements are immutable; "deleting" one means voiding it.
 *
 * Covers:
 *   client.voidStatement(id)       — sends a Voided statement referencing the target
 *   client.getVoidedStatement(id)  — the only way to read a voided statement back
 */
import { useState } from 'react';
import { useXapiClient } from '@studiolxd/xapi/react';
import type { Result, XapiError, Statement } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

export function VoidingSection() {
  const client = useXapiClient();
  const [targetId, setTargetId] = useState('');
  const [voidResult, setVoidResult] = useState<Result<string, XapiError> | null>(null);
  const [fetchResult, setFetchResult] = useState<Result<Statement, XapiError> | null>(null);

  const voidIt = async () => setVoidResult(await client.voidStatement(targetId, { mbox: 'mailto:learner@example.com' }));
  const fetchVoided = async () => setFetchResult(await client.getVoidedStatement(targetId));

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Voiding</h2>
        <p className="section-description">
          xAPI statements are immutable — there is no delete. To retract one, you send a new
          statement with the <code>Voided</code> verb, referencing the original by id. The
          original stops appearing in normal queries but stays recoverable via{' '}
          <code>getVoidedStatement()</code>.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Target statement id</div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="void-id">
              Statement id
            </label>
            <input
              id="void-id"
              className="field-input"
              type="text"
              placeholder="paste an id from the Statement Builder / Query tabs"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
          </div>
        </div>

        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-danger" onClick={voidIt} disabled={!targetId}>
            Void it
          </button>
          <button className="btn" onClick={fetchVoided} disabled={!targetId}>
            Fetch voided statement
          </button>
        </div>

        <ResultView result={voidResult} />
        <ResultView result={fetchResult} />

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`// actor defaults to options.defaults.actor if you pass none here
const voided = await client.voidStatement(targetId, { mbox: 'mailto:learner@example.com' });

const original = await client.getVoidedStatement(targetId);`}</pre>
        </details>
      </div>
    </div>
  );
}
