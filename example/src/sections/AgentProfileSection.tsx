/**
 * AgentProfileSection — the xAPI Agent Profile API: shared, per-agent storage.
 *
 * Covers:
 *   client.getAgentProfile / setAgentProfile / deleteAgentProfile / getAgentProfileIds
 *
 * Scoped to an agent only — no activity. Good for cross-course learner preferences
 * (e.g. UI language, accessibility settings) that should follow the learner everywhere.
 */
import { useState } from 'react';
import { useXapiClient } from '@studiolxd/xapi/react';
import type { Result, XapiError, XapiDocument } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

export function AgentProfileSection() {
  const client = useXapiClient();
  const [mbox, setMbox] = useState('learner@example.com');
  const [profileId, setProfileId] = useState('preferences');
  const [value, setValue] = useState('{"language": "es", "fontSize": "large"}');
  const [getResult, setGetResult] = useState<Result<XapiDocument | null, XapiError> | null>(null);
  const [writeResult, setWriteResult] = useState<Result<true, XapiError> | null>(null);
  const [idsResult, setIdsResult] = useState<Result<string[], XapiError> | null>(null);

  const agent = { mbox: `mailto:${mbox}` };

  const get = async () => setGetResult(await client.getAgentProfile(agent, profileId));
  const set = async () => {
    let parsed: unknown = value;
    try {
      parsed = JSON.parse(value);
    } catch {
      /* send as raw string if not valid JSON */
    }
    setWriteResult(await client.setAgentProfile(agent, profileId, parsed));
  };
  const del = async () => setWriteResult(await client.deleteAgentProfile(agent, profileId));
  const listIds = async () => setIdsResult(await client.getAgentProfileIds(agent));

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Agent Profile Documents</h2>
        <p className="section-description">
          Scoped to an agent only — no activity. Use it for learner-level preferences that
          should persist across every course this learner takes, not just the current one.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">agent / profileId / value</div>
        <div className="controls">
          <div className="field">
            <label className="field-label" htmlFor="agp-mbox">
              Agent (mbox)
            </label>
            <input
              id="agp-mbox"
              className="field-input"
              type="text"
              value={mbox}
              onChange={(e) => setMbox(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="agp-id">
              Profile id
            </label>
            <input
              id="agp-id"
              className="field-input"
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="agp-value">
              Value (JSON or text)
            </label>
            <input
              id="agp-value"
              className="field-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={set}>
            setAgentProfile
          </button>
          <button className="btn" onClick={get}>
            getAgentProfile
          </button>
          <button className="btn btn-danger" onClick={del}>
            deleteAgentProfile
          </button>
          <button className="btn" onClick={listIds}>
            getAgentProfileIds
          </button>
        </div>

        <ResultView result={writeResult} />
        <ResultView result={getResult} />
        <ResultView result={idsResult} />

        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`const agent = { mbox: 'mailto:learner@example.com' };
await client.setAgentProfile(agent, 'preferences', { language: 'es' });
const doc = await client.getAgentProfile(agent, 'preferences');`}</pre>
        </details>
      </div>
    </div>
  );
}
