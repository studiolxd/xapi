import { type Result, ok, err } from '../result/result';
import { XapiError } from '../errors/xapi-error';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const CRLF = '\r\n';

/** One attachment to embed when building a `multipart/mixed` body. */
export interface MultipartAttachmentInput {
  /** SHA-2 hash of `data`, matching the statement's `attachments[].sha2`. */
  sha2: string;
  contentType: string;
  data: Uint8Array;
}

/** One attachment part recovered by {@link parseMultipartBody}. */
export interface ParsedMultipartAttachment {
  /** Value of the part's `X-Experience-API-Hash` header. */
  hash: string;
  contentType: string;
  data: Uint8Array;
}

/** The result of parsing a `multipart/mixed` xAPI body. */
export interface ParsedMultipartBody {
  /** Raw JSON text of the first part (a single statement, or `{statements, more}`). */
  statementsJson: string;
  attachments: ParsedMultipartAttachment[];
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Build a `multipart/mixed` body for a statements POST/PUT that carries attachments.
 * This is **not** `multipart/form-data` — a different wire format xAPI does not use, so
 * standard form-data libraries don't target this shape. Part 1 is always the statement(s)
 * JSON; each attachment follows as its own part, tagged with the `X-Experience-API-Hash`
 * header the spec uses to re-match parts to a statement's declared `attachments[].sha2`.
 *
 * @example
 * ```ts
 * const { body, contentType } = buildMultipartBody(JSON.stringify(statement), [
 *   { sha2: attachmentHash, contentType: 'image/png', data: pngBytes },
 * ]);
 * await fetch(endpoint + '/statements', { method: 'POST', headers: { 'Content-Type': contentType }, body });
 * ```
 */
export function buildMultipartBody(
  statementsJson: string,
  attachments: MultipartAttachmentInput[],
): { body: Uint8Array; contentType: string } {
  const boundary = `xapi-${crypto.randomUUID()}`;
  const chunks: Uint8Array[] = [
    encoder.encode(`--${boundary}${CRLF}Content-Type: application/json${CRLF}${CRLF}`),
    encoder.encode(statementsJson),
    encoder.encode(CRLF),
  ];

  for (const attachment of attachments) {
    chunks.push(
      encoder.encode(
        `--${boundary}${CRLF}Content-Type: ${attachment.contentType}${CRLF}Content-Transfer-Encoding: binary${CRLF}X-Experience-API-Hash: ${attachment.sha2}${CRLF}${CRLF}`,
      ),
      attachment.data,
      encoder.encode(CRLF),
    );
  }

  chunks.push(encoder.encode(`--${boundary}--${CRLF}`));
  return { body: concat(chunks), contentType: `multipart/mixed; boundary=${boundary}` };
}

function indexOfBytes(haystack: Uint8Array, needle: Uint8Array, from = 0): number {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function validationErr(message: string): XapiError {
  return new XapiError({
    kind: 'validation',
    operation: 'parseMultipartBody',
    endpoint: null,
    status: null,
    responseBody: null,
    issues: [{ path: 'body', rule: 'multipart', message }],
  });
}

/**
 * Parse a `multipart/mixed` body back into the statement(s) JSON and any attachment parts.
 * Operates on raw bytes throughout — attachment content is never decoded as text — so
 * binary data round-trips unmodified through {@link buildMultipartBody}.
 */
export function parseMultipartBody(body: Uint8Array, contentType: string): Result<ParsedMultipartBody, XapiError> {
  const boundaryMatch = /boundary="?([^";]+)"?/i.exec(contentType);
  if (!boundaryMatch) return err(validationErr('Content-Type is missing a multipart boundary'));
  const boundary = boundaryMatch[1] as string;

  const marker = encoder.encode(`--${boundary}`);
  const headerSeparator = encoder.encode(`${CRLF}${CRLF}`);
  const CR = 0x0d;
  const LF = 0x0a;
  const DASH = 0x2d;

  let cursor = indexOfBytes(body, marker);
  if (cursor === -1) return err(validationErr('body has no boundary markers'));

  const parts: { headers: Map<string, string>; data: Uint8Array }[] = [];

  while (true) {
    const afterMarker = cursor + marker.length;
    if (body[afterMarker] === DASH && body[afterMarker + 1] === DASH) break; // terminal boundary

    let partStart = afterMarker;
    if (body[partStart] === CR && body[partStart + 1] === LF) partStart += 2;

    const nextMarker = indexOfBytes(body, marker, partStart);
    if (nextMarker === -1) return err(validationErr('body is missing its closing boundary'));

    let partEnd = nextMarker;
    if (body[partEnd - 2] === CR && body[partEnd - 1] === LF) partEnd -= 2;

    const partBytes = body.subarray(partStart, partEnd);
    const sep = indexOfBytes(partBytes, headerSeparator);
    if (sep === -1) return err(validationErr('a part is missing its header/body separator'));

    const headers = new Map<string, string>();
    for (const line of decoder.decode(partBytes.subarray(0, sep)).split(CRLF)) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      headers.set(line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim());
    }

    parts.push({ headers, data: partBytes.subarray(sep + headerSeparator.length) });
    cursor = nextMarker;
  }

  const first = parts[0];
  if (!first) return err(validationErr('body has no parts'));

  const attachments: ParsedMultipartAttachment[] = parts.slice(1).map((part) => ({
    hash: part.headers.get('x-experience-api-hash') ?? '',
    contentType: part.headers.get('content-type') ?? 'application/octet-stream',
    data: part.data,
  }));

  return ok({ statementsJson: decoder.decode(first.data), attachments });
}
