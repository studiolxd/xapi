/**
 * LaunchSection — parsing a TinCan/Rustici-style xAPI launch URL.
 *
 * Covers:
 *   parseXapiLaunch()          — reads endpoint/auth/actor/registration from query params
 *   createXapiClientFromLaunch() — parses + builds a ready-to-use client in one step
 *
 * Real LMSs launch xAPI content by appending these params to the content's URL — this
 * section lets you paste an example query string without needing an actual launch.
 */
import { useState } from 'react';
import { parseXapiLaunch } from '@studiolxd/xapi/react';
import type { Result, XapiError, XapiLaunchParams } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

const EXAMPLE =
  '?endpoint=https://lrs.example.com/xapi&auth=Basic%20dXNlcjpwYXNz&actor=%7B%22mbox%22%3A%22mailto%3Alearner%40example.com%22%7D&registration=550e8400-e29b-41d4-a716-446655440000&activity_id=https://example.com/course/1';

export function LaunchSection() {
  const [query, setQuery] = useState(EXAMPLE);
  const [result, setResult] = useState<Result<XapiLaunchParams, XapiError> | null>(null);

  const parse = () => setResult(parseXapiLaunch(`https://content.example.com/lesson${query}`));

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Launch</h2>
        <p className="section-description">
          When an LMS launches xAPI content, it appends the LRS endpoint, credentials and
          learner identity as query params on the content's URL — the same convention used by
          TinCan/Rustici launch links and cmi5's AU launch. <code>parseXapiLaunch()</code> reads
          them; <code>createXapiClientFromLaunch()</code> goes straight to a working client.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Launch query string</div>
        <div className="controls">
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label" htmlFor="launch-query">
              Query string (appended to a content URL)
            </label>
            <input
              id="launch-query"
              className="field-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={parse}>
            Parse launch URL
          </button>
        </div>
        <ResultView result={result} />
        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`// SSR-safe: defaults to window.location.href, pass \`url\` explicitly otherwise.
const parsed = parseXapiLaunch();
if (parsed.ok) console.log(parsed.value.endpoint, parsed.value.actor);

// Or build a ready-to-use client in one call:
const clientResult = createXapiClientFromLaunch();
if (clientResult.ok) {
  await clientResult.value.sendStatement(
    clientResult.value.buildStatement({ verb: VERBS.launched, object: 'https://example.com/course/1' }),
  );
}`}</pre>
        </details>
      </div>
    </div>
  );
}
