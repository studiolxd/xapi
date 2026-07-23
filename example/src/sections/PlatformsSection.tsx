/**
 * PlatformsSection — @studiolxd/xapi outside React.
 *
 * Covers:
 *   createXapiClient()  — the framework-agnostic core, usable from any JS environment
 *   CDN / IIFE build    — <script> tag usage with no bundler, via window.Xapi
 *
 * Both are independent of the React <XapiProvider> wrapping the rest of the demo — the
 * vanilla client below creates its own connection to the same mock LRS.
 */
import { useState } from 'react';
import { createXapiClient, createMemoryLrs } from '@studiolxd/xapi';

export function PlatformsSection() {
  const [log, setLog] = useState<string[]>([]);

  const runVanilla = async () => {
    const lines: string[] = [];
    const lrs = createMemoryLrs();
    const client = createXapiClient({ endpoint: 'https://mock.lrs/xapi', fetch: lrs.fetch });
    lines.push(`createXapiClient(...) → endpoint ${client.status.endpoint}`);

    const statement = client.buildStatement({
      actor: { mbox: 'mailto:ada@example.com' },
      verb: 'http://adlnet.gov/expapi/verbs/completed',
      object: 'https://example.com/course/1',
      result: { success: true, score: { raw: 88, min: 0, max: 100 } },
    });
    lines.push(`buildStatement(...) → id ${statement.id}`);

    const sent = await client.sendStatement(statement);
    lines.push(sent.ok ? `sendStatement(...) → stored as ${sent.value}` : `sendStatement(...) → ✗ ${sent.error.message}`);

    const page = await client.getStatements({ limit: 10 });
    lines.push(page.ok ? `getStatements(...) → ${page.value.statements.length} statement(s)` : `✗ ${page.error.message}`);

    client.destroy();
    setLog(lines);
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">Vanilla &amp; CDN</h2>
        <p className="section-description">
          The same engine without React. <code>createXapiClient()</code> is the
          framework-agnostic core used by every adapter (<code>/react</code>,{' '}
          <code>/vue</code>, <code>/angular</code>, <code>/svelte</code>) — usable directly from
          any JavaScript, including a plain <code>&lt;script&gt;</code> tag with no build step.
        </p>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">
          createXapiClient() <span className="badge badge-both">vanilla</span>
        </div>
        <div className="controls">
          <button className="btn btn-primary" onClick={runVanilla}>
            Run a full vanilla exchange
          </button>
        </div>
        {log.length > 0 && <pre className="result ok">{log.join('\n')}</pre>}
        <details className="code-details">
          <summary>Code</summary>
          <pre>{`import { createXapiClient } from '@studiolxd/xapi';

const client = createXapiClient({ endpoint: 'https://lrs.example.com/xapi', auth: { username, password } });
const statement = client.buildStatement({ actor, verb: 'http://adlnet.gov/expapi/verbs/completed', object });
await client.sendStatement(statement);`}</pre>
        </details>
      </div>

      <div className="feature-block">
        <div className="feature-block-title">
          CDN / IIFE <span className="badge badge-both">no bundler</span>
        </div>
        <p className="section-description">
          For plain HTML content with no build step, the package also ships an IIFE build that
          exposes everything under <code>window.Xapi</code>.
        </p>
        <details className="code-details" open>
          <summary>Code</summary>
          <pre>{`<script src="https://unpkg.com/@studiolxd/xapi"></script>
<script>
  const client = Xapi.createXapiClient({
    endpoint: 'https://lrs.example.com/xapi',
    auth: { username: 'key', password: 'secret' },
  });

  const statement = Xapi.buildStatement({
    actor: { mbox: 'mailto:learner@example.com' },
    verb: Xapi.VERBS.completed,
    object: 'https://example.com/course/1',
  });

  client.sendStatement(statement).then((result) => {
    if (result.ok) console.log('stored with id', result.value);
  });
</script>`}</pre>
        </details>
      </div>
    </div>
  );
}
