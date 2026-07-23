/**
 * StateSection — the xAPI State API: per-actor, per-activity key/value storage.
 *
 * Covers:
 *   client.getState / setState / deleteState / getStateIds
 *
 * Typical use: bookmarking (last slide seen), draft answers, UI preferences —
 * anything scoped to "this learner, this activity" that isn't a historical record.
 */
import { useState } from 'react';
import { useXapiClient } from '@studiolxd/xapi/react';
import type { Result, XapiError, XapiDocument } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

export function StateSection() {
  const client = useXapiClient();
  const [activityId, setActivityId] = useState('https://example.com/course/1');
  const [stateId, setStateId] = useState('bookmark');
  const [value, setValue] = useState('{"slide": 4}');
  const [getResult, setGetResult] = useState<Result<XapiDocument | null, XapiError> | null>(null);
  const [writeResult, setWriteResult] = useState<Result<true, XapiError> | null>(null);
  const [idsResult, setIdsResult] = useState<Result<string[], XapiError> | null>(null);

  const opts = { agent: { mbox: 'mailto:learner@example.com' } };

  const get = async () => setGetResult(await client.getState(activityId, stateId, opts));
  const set = async () => {
    let parsed: unknown = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      /* send as raw string if not valid JSON */
    }
    setWriteResult(await client.setState(activityId, stateId, parsed, opts));
  };
  const del = async () => setWriteResult(await client.deleteState(activityId, stateId, opts));
  const listIds = async () => setIdsResult(await client.getStateIds(activityId, opts));

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">State Documents</h2>
        <p className="section-description">
          Scoped to one actor + one activity (+ optional registration). Use it for session-like
          data — a bookmark, a draft answer — that doesn't belong in the permanent statement
          history. A missing document is not an error: <code>getState</code> resolves to{' '}
          <code>ok(null)</code>.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">activityId / stateId / value</div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="state-activity">
              Activity IRI
            </label>
            <input
              id="state-activity"
              className="field-input"
              type="text"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="state-id">
              State id
            </label>
            <input
              id="state-id"
              className="field-input"
              type="text"
              value={stateId}
              onChange={(e) => setStateId(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="state-value">
              Value (JSON or text)
            </label>
            <input
              id="state-value"
              className="field-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={set}>
            setState
          </button>
          <button className="btn" onClick={get}>
            getState
          </button>
          <button className="btn btn-danger" onClick={del}>
            deleteState
          </button>
          <button className="btn" onClick={listIds}>
            getStateIds
          </button>
        </div>

        <ResultView result={writeResult} />
        <ResultView result={getResult} />
        <ResultView result={idsResult} />

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`const opts = { agent: { mbox: 'mailto:learner@example.com' } };

await client.setState(activityId, 'bookmark', { slide: 4 }, opts);
const doc = await client.getState(activityId, 'bookmark', opts);
if (doc.ok && doc.value) console.log(doc.value.content); // { slide: 4 }`}</pre>
        </details>
      </div>
    </div>
  );
}
