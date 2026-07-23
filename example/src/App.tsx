import { useMemo, useState } from 'react';
import { XapiProvider, createMemoryLrs } from '@studiolxd/xapi/react';
import type { XapiVersion, XapiClientOptions } from '@studiolxd/xapi/react';
import { XapiConnectionContext } from './XapiConnectionContext';
import { DEFAULT_CONNECTION, MOCK_ENDPOINT, type ConnectionConfig } from './connection';
import { ConnectionSection } from './sections/ConnectionSection';
import { StatementBuilderSection } from './sections/StatementBuilderSection';
import { QuerySection } from './sections/QuerySection';
import { VoidingSection } from './sections/VoidingSection';
import { StateSection } from './sections/StateSection';
import { ActivityProfileSection } from './sections/ActivityProfileSection';
import { AgentProfileSection } from './sections/AgentProfileSection';
import { LaunchSection } from './sections/LaunchSection';
import { PlatformsSection } from './sections/PlatformsSection';
import { AboutSection } from './sections/AboutSection';
import './App.css';

// Module-level singleton: the in-memory mock LRS keeps its statements/documents across
// version toggles and provider remounts, so switching 1.0.3 ↔ 2.0 doesn't lose demo data.
const memoryLrs = createMemoryLrs();

export const TABS = [
  { id: 'connection', label: 'Connection', icon: '⏻' },
  { id: 'statement', label: 'Statement Builder', icon: '✎' },
  { id: 'query', label: 'Query', icon: '◈' },
  { id: 'voiding', label: 'Voiding', icon: '⊘' },
  { id: 'state', label: 'State', icon: '◆' },
  { id: 'activityProfile', label: 'Activity Profile', icon: '◇' },
  { id: 'agentProfile', label: 'Agent Profile', icon: '◫' },
  { id: 'launch', label: 'Launch', icon: '⇥' },
  { id: 'platforms', label: 'Vanilla / CDN', icon: '◐' },
  { id: 'about', label: 'About & Versions', icon: 'ℹ' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

function resolveOptions(version: XapiVersion, connection: ConnectionConfig): XapiClientOptions {
  if (connection.mode === 'mock') {
    return { endpoint: MOCK_ENDPOINT, version, fetch: memoryLrs.fetch, debug: import.meta.env.DEV };
  }
  return {
    endpoint: connection.endpoint,
    version,
    auth: connection.username ? { username: connection.username, password: connection.password } : undefined,
    debug: import.meta.env.DEV,
  };
}

interface XapiDemoShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function XapiDemoShell({ activeTab, onTabChange }: XapiDemoShellProps) {
  return (
    <div className="app-body">
      <nav className="tab-nav" aria-label="Demo sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="tab-content" id="tab-panel" aria-label="Active section content">
        {activeTab === 'connection' && <ConnectionSection />}
        {activeTab === 'statement' && <StatementBuilderSection />}
        {activeTab === 'query' && <QuerySection />}
        {activeTab === 'voiding' && <VoidingSection />}
        {activeTab === 'state' && <StateSection />}
        {activeTab === 'activityProfile' && <ActivityProfileSection />}
        {activeTab === 'agentProfile' && <AgentProfileSection />}
        {activeTab === 'launch' && <LaunchSection />}
        {activeTab === 'platforms' && <PlatformsSection />}
        {activeTab === 'about' && <AboutSection />}
      </main>
    </div>
  );
}

export default function App() {
  const [version, setVersion] = useState<XapiVersion>('1.0.3');
  const [activeTab, setActiveTab] = useState<TabId>('connection');
  const [connection, setConnection] = useState<ConnectionConfig>(DEFAULT_CONNECTION);

  const options = useMemo(() => resolveOptions(version, connection), [version, connection]);

  const handleVersionChange = (v: XapiVersion) => {
    setVersion(v);
    setActiveTab('connection');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">xAPI Explorer</div>
        </div>

        <div className="app-header-right">
          <span className="version-label">xAPI version</span>
          <div className="version-toggle" role="group" aria-label="xAPI version selector">
            <button
              className={`version-btn${version === '1.0.3' ? ' active' : ''}`}
              onClick={() => handleVersionChange('1.0.3')}
              aria-pressed={version === '1.0.3'}
            >
              1.0.3
            </button>
            <button
              className={`version-btn${version === '2.0' ? ' active' : ''}`}
              onClick={() => handleVersionChange('2.0')}
              aria-pressed={version === '2.0'}
            >
              2.0
            </button>
          </div>

          <div className="mock-badge">
            <span className="mock-dot" />
            {connection.mode === 'mock' ? 'mock LRS' : 'real LRS'}
          </div>
        </div>
      </header>

      {/*
        key forces a fresh XapiProvider (and a fresh XapiClient) whenever the version or
        the connection target changes — createXapiClient has no reconfigure method, so
        remounting is the clean way to point the demo at a different LRS/version.
      */}
      <XapiProvider key={`${version}-${connection.mode}-${connection.endpoint}`} options={options}>
        <XapiConnectionContext.Provider value={{ config: connection, setConfig: setConnection }}>
          <XapiDemoShell activeTab={activeTab} onTabChange={setActiveTab} />
        </XapiConnectionContext.Provider>
      </XapiProvider>

      <footer className="app-footer">
        <a href="https://studiolxd.com" target="_blank" rel="noopener noreferrer">
          <img src="/logo.svg" alt="StudioLXD" className="footer-logo" />
        </a>
        <a
          href="https://github.com/studiolxd/xapi"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github-link"
          aria-label="GitHub repository"
        >
          <svg className="footer-github-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </footer>
    </div>
  );
}
