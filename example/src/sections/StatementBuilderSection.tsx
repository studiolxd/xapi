/**
 * StatementBuilderSection — the core xAPI action: build and send a statement.
 *
 * Covers:
 *   client.buildStatement()  — fills in id/timestamp, resolves shorthand verb/object IRIs
 *   client.sendStatement()   — POSTs it to the LRS (validated first by default)
 *   VERBS                    — the common ADL vocabulary, ready to use
 */
import { useMemo, useState } from 'react';
import { useXapiClient } from '@studiolxd/xapi/react';
import type { Result, XapiError } from '@studiolxd/xapi/react';
import { VERBS } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

const VERB_OPTIONS = Object.entries(VERBS);

export function StatementBuilderSection() {
  const client = useXapiClient();

  const [mbox, setMbox] = useState('learner@example.com');
  const [verbKey, setVerbKey] = useState<string>('completed');
  const [customVerb, setCustomVerb] = useState('');
  const [objectId, setObjectId] = useState('https://example.com/course/1');
  const [withResult, setWithResult] = useState(true);
  const [success, setSuccess] = useState(true);
  const [completion, setCompletion] = useState(true);
  const [scoreRaw, setScoreRaw] = useState('90');
  const [sendResult, setSendResult] = useState<Result<string, XapiError> | null>(null);

  const verb = customVerb.trim() || VERBS[verbKey as keyof typeof VERBS].id;

  const statement = useMemo(
    () =>
      client.buildStatement({
        actor: { mbox: `mailto:${mbox}` },
        verb,
        object: objectId,
        ...(withResult
          ? {
              result: {
                success,
                completion,
                score: { raw: Number(scoreRaw), min: 0, max: 100, scaled: Number(scoreRaw) / 100 },
              },
            }
          : {}),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mbox, verb, objectId, withResult, success, completion, scoreRaw],
  );

  const send = async () => setSendResult(await client.sendStatement(statement));

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Statement Builder</h2>
        <p className="section-description">
          A statement is <strong>actor did verb to object</strong>, optionally with a{' '}
          <code>result</code>. <code>buildStatement()</code> fills in <code>id</code> and{' '}
          <code>timestamp</code> automatically and resolves verb/object shorthand strings to
          full xAPI objects.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Actor / Verb / Object</div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="sb-mbox">
              Actor (mbox)
            </label>
            <input
              id="sb-mbox"
              className="field-input"
              type="text"
              value={mbox}
              onChange={(e) => setMbox(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="sb-verb">
              Verb
            </label>
            <select
              id="sb-verb"
              className="field-input"
              value={verbKey}
              onChange={(e) => {
                setVerbKey(e.target.value);
                setCustomVerb('');
              }}
            >
              {VERB_OPTIONS.map(([key, v]) => (
                <option key={key} value={key}>
                  {v.display?.en ?? key}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="sb-verb-custom">
              …or custom verb IRI
            </label>
            <input
              id="sb-verb-custom"
              className="field-input"
              type="text"
              placeholder="https://example.com/verbs/custom"
              value={customVerb}
              onChange={(e) => setCustomVerb(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="sb-object">
              Object (activity IRI)
            </label>
            <input
              id="sb-object"
              className="field-input"
              type="text"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">
          Result <span className="badge badge-both">optional</span>
        </div>
        <div className="controls">
          <button className={`btn ${withResult ? 'btn-primary' : ''}`} onClick={() => setWithResult((v) => !v)}>
            {withResult ? 'Result included' : 'No result'}
          </button>
          {withResult && (
            <>
              <div className="field">
                <label className="field-label" htmlFor="sb-score">
                  Score (raw, 0-100)
                </label>
                <input
                  id="sb-score"
                  className="field-input"
                  type="number"
                  min="0"
                  max="100"
                  value={scoreRaw}
                  onChange={(e) => setScoreRaw(e.target.value)}
                />
              </div>
              <button className={`btn ${success ? 'btn-primary' : ''}`} onClick={() => setSuccess((v) => !v)}>
                success: {String(success)}
              </button>
              <button className={`btn ${completion ? 'btn-primary' : ''}`} onClick={() => setCompletion((v) => !v)}>
                completion: {String(completion)}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Live statement JSON</div>
        <pre className="result info">{JSON.stringify(statement, null, 2)}</pre>
        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={send}>
            Send statement
          </button>
        </div>
        <ResultView result={sendResult} />
        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`import { createXapiClient, VERBS } from '@studiolxd/xapi';

const statement = client.buildStatement({
  actor: { mbox: 'mailto:learner@example.com' },
  verb: VERBS.completed,
  object: 'https://example.com/course/1',
  result: { success: true, completion: true, score: { raw: 90, min: 0, max: 100 } },
});

const result = await client.sendStatement(statement);
if (result.ok) console.log('stored with id', result.value);`}</pre>
        </details>
      </div>
    </div>
  );
}
