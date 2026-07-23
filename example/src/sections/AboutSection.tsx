/**
 * AboutSection — xAPI 1.0.3 vs 2.0, and what the LRS actually reports.
 *
 * Covers:
 *   client.about()  — GET /about, the versions/extensions an LRS declares support for
 */
import { useState } from 'react';
import { useXapiClient, useXapiStatus } from '@studiolxd/xapi/react';
import type { Result, XapiError, AboutResource } from '@studiolxd/xapi/react';
import { ResultView } from '../ResultView';

const ROWS: Array<[string, string, string]> = [
  [
    'X-Experience-API-Version header',
    '1.0, 1.0.0, 1.0.1, 1.0.2 and 1.0.3 all accepted, normalized to 1.0.3',
    'Only 2.0 accepted',
  ],
  [
    'context.contextAgents / contextGroups',
    'Not part of the spec — stripped before sending',
    'Supported as declared',
  ],
  [
    'ETags on documents (State / Profile)',
    'Recommended',
    'Required by conformant implementations',
  ],
  [
    'timestamp / stored format',
    'ISO 8601, generally permissive',
    'Stricter ISO 8601 subset in some test suites',
  ],
];

export function AboutSection() {
  const client = useXapiClient();
  const status = useXapiStatus();
  const [about, setAbout] = useState<Result<AboutResource, XapiError> | null>(null);

  const checkAbout = async () => setAbout(await client.about());

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">About &amp; Version Differences</h2>
        <p className="section-description">
          This client speaks both xAPI 1.0.3 and 2.0 (IEEE 9274.1.1) through the same{' '}
          <code>createXapiClient({'{ version }'})</code> option — currently connected as{' '}
          <strong>{status.version}</strong>. Version-specific behavior is concentrated in one
          internal adapter; the rest of the library works with a single shape.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">What the library abstracts</div>
        <table className="status-grid" style={{ display: 'table', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Behavior</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>1.0.3</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>2.0</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([behavior, v103, v20]) => (
              <tr key={behavior}>
                <td style={{ padding: '6px 8px' }}>{behavior}</td>
                <td style={{ padding: '6px 8px' }}>{v103}</td>
                <td style={{ padding: '6px 8px' }}>{v20}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">client.about()</div>
        <div className="controls">
          <button className="btn btn-primary" onClick={checkAbout}>
            Check what this LRS supports
          </button>
        </div>
        <ResultView result={about} />
      </div>
    </div>
  );
}
