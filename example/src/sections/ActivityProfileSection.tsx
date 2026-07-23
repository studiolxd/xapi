/**
 * ActivityProfileSection — the xAPI Activity Profile API: shared, per-activity storage.
 *
 * Covers:
 *   client.getActivityProfile / setActivityProfile / deleteActivityProfile / getActivityProfileIds
 *
 * Unlike State, an Activity Profile is not scoped to a single actor — it's shared metadata
 * about the activity itself (e.g. aggregate stats, authoring config).
 */
import { useState } from 'react';
import { useXapiClient } from '@studiolxd/xapi/react';
import type { Result, XapiError, XapiDocument } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

export function ActivityProfileSection() {
  const client = useXapiClient();
  const [activityId, setActivityId] = useState('https://example.com/course/1');
  const [profileId, setProfileId] = useState('difficulty-config');
  const [value, setValue] = useState('{"difficulty": "medium"}');
  const [getResult, setGetResult] = useState<Result<XapiDocument | null, XapiError> | null>(null);
  const [writeResult, setWriteResult] = useState<Result<true, XapiError> | null>(null);
  const [idsResult, setIdsResult] = useState<Result<string[], XapiError> | null>(null);

  const get = async () => setGetResult(await client.getActivityProfile(activityId, profileId));
  const set = async () => {
    let parsed: unknown = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      /* send as raw string if not valid JSON */
    }
    setWriteResult(await client.setActivityProfile(activityId, profileId, parsed));
  };
  const del = async () => setWriteResult(await client.deleteActivityProfile(activityId, profileId));
  const listIds = async () => setIdsResult(await client.getActivityProfileIds(activityId));

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Activity Profile Documents</h2>
        <p className="section-description">
          Scoped to an activity only — no actor. Any learner (and the authoring tool itself)
          reads and writes the same document, so it's the right place for activity-level
          configuration or aggregate metadata, not per-learner state.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">activityId / profileId / value</div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="ap-activity">
              Activity IRI
            </label>
            <input
              id="ap-activity"
              className="field-input"
              type="text"
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="ap-id">
              Profile id
            </label>
            <input
              id="ap-id"
              className="field-input"
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="ap-value">
              Value (JSON or text)
            </label>
            <input
              id="ap-value"
              className="field-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={set}>
            setActivityProfile
          </button>
          <button className="btn" onClick={get}>
            getActivityProfile
          </button>
          <button className="btn btn-danger" onClick={del}>
            deleteActivityProfile
          </button>
          <button className="btn" onClick={listIds}>
            getActivityProfileIds
          </button>
        </div>

        <ResultView result={writeResult} />
        <ResultView result={getResult} />
        <ResultView result={idsResult} />

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`await client.setActivityProfile(activityId, 'difficulty-config', { difficulty: 'medium' });
const doc = await client.getActivityProfile(activityId, 'difficulty-config');`}</pre>
        </details>
      </div>
    </div>
  );
}
