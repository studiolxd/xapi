/**
 * ConnectionSection — picks the LRS the rest of the demo talks to.
 *
 * Covers:
 *   createMemoryLrs()  — in-memory mock LRS, the default, no network involved
 *   client.about()     — GET /about, the first call any xAPI integration should make
 */
import { useState } from 'react';
import { useXapiClient, useXapiStatus } from '@studiolxd/xapi/react';
import type { Result, XapiError, AboutResource } from '@studiolxd/xapi/react';
import { useXapiConnection } from '../XapiConnectionContext';
import { DEFAULT_CONNECTION } from '../connection';
import { ResultView } from '../ResultView';

export function ConnectionSection() {
  const client = useXapiClient();
  const status = useXapiStatus();
  const { config, setConfig } = useXapiConnection();

  const [mode, setMode] = useState(config.mode);
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [username, setUsername] = useState(config.username);
  const [password, setPassword] = useState(config.password);
  const [about, setAbout] = useState<Result<AboutResource, XapiError> | null>(null);

  const connect = () => setConfig({ mode, endpoint, username, password });
  const useMock = () => setConfig(DEFAULT_CONNECTION);

  const checkAbout = async () => setAbout(await client.about());

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Connection</h2>
        <p className="section-description">
          Every method on the client — <code>sendStatement</code>, <code>getState</code>,{' '}
          <code>about</code> — talks to the LRS configured here. By default this demo runs
          fully offline against <code>createMemoryLrs()</code>, an in-memory implementation of
          the xAPI protocol used by the library's own test suite. Switch to a real LRS (your
          own <code>studiolxd/lrs</code>, Veracity, SCORM Cloud…) to test against it directly.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Live XapiStatus</div>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-item-label">endpoint</span>
            <span className="status-item-value">{status.endpoint}</span>
          </div>
          <div className="status-item">
            <span className="status-item-label">version</span>
            <span className="status-item-value">{status.version}</span>
          </div>
          <div className="status-item">
            <span className="status-item-label">pending</span>
            <span className="status-item-value">{status.pending}</span>
          </div>
          <div className="status-item">
            <span className="status-item-label">lastError</span>
            <span className={`status-item-value ${String(status.lastError === null)}`}>
              {status.lastError ? status.lastError.message : 'none'}
            </span>
          </div>
        </div>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">Target LRS</div>
        <div className="controls">
          <button className={`btn ${mode === 'mock' ? 'btn-primary' : ''}`} onClick={() => setMode('mock')}>
            Mock LRS (in memory)
          </button>
          <button className={`btn ${mode === 'real' ? 'btn-primary' : ''}`} onClick={() => setMode('real')}>
            Real LRS
          </button>
        </div>

        {mode === 'real' && (
          <div className="controls" style={{ marginTop: 12 }}>
            <div className="field">
              <label className="field-label" htmlFor="conn-endpoint">
                Endpoint
              </label>
              <input
                id="conn-endpoint"
                className="field-input"
                type="text"
                value={endpoint}
                placeholder="https://lrs.example.com/xapi"
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="conn-username">
                Username
              </label>
              <input
                id="conn-username"
                className="field-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="conn-password">
                Password
              </label>
              <input
                id="conn-password"
                className="field-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="controls" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={connect}>
            Connect
          </button>
          <button className="btn" onClick={useMock}>
            Reset to mock
          </button>
        </div>

        <p className="note" style={{ marginTop: 12 }}>
          Connecting remounts the client — any in-flight requests from the previous connection
          are discarded.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">client.about()</div>
        <div className="controls">
          <button className="btn btn-primary" onClick={checkAbout}>
            Check /about
          </button>
        </div>
        <ResultView result={about} />
        <details className="code-details">
          <summary>Code example</summary>
          <pre>{`import { createXapiClient } from '@studiolxd/xapi';

const client = createXapiClient({
  endpoint: 'https://lrs.example.com/xapi',
  auth: { username: 'key', password: 'secret' },
});

const result = await client.about();
if (result.ok) console.log('LRS supports', result.value.version);`}</pre>
        </details>
      </div>
    </div>
  );
}
