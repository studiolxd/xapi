/** Renders a `Result<T, XapiError>` as an ok/error block with the raw JSON underneath. */
import type { Result, XapiError } from '@studiolxd/xapi/react';

export function ResultView<T>({ result }: { result: Result<T, XapiError> | null }) {
  if (!result) return null;

  if (result.ok) {
    return (
      <div className="result ok">
        <pre>{JSON.stringify(result.value, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="result error">
      <div>
        ✗ {result.error.kind} — {result.error.message}
      </div>
      {result.error.status !== null && <div>status: {result.error.status}</div>}
      {result.error.issues.length > 0 && (
        <ul>
          {result.error.issues.map((issue, i) => (
            <li key={i}>
              {issue.path}: {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
