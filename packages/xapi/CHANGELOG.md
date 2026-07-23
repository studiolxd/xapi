# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Unreleased

### Added

- Initial release: framework-agnostic xAPI client (`createXapiClient`) with
  support for xAPI 1.0.3 and xAPI 2.0 (IEEE 9274.1.1).
- Statements resource: `sendStatement`, `sendStatements`, `getStatement`,
  `getVoidedStatement`, `getStatements`, `getMoreStatements`, `voidStatement`.
- State, Activity Profile and Agent Profile document resources, with
  automatic ETag concurrency management (`concurrency: 'auto' | 'off'`).
- Activities & Agents resources: `getActivity`, `getPerson`, and `about()`.
- `buildStatement` / `client.buildStatement` helpers, `VERBS` and
  `ACTIVITY_TYPES` constants, and `validateStatement` structural validation.
- `Result<T, XapiError>` pattern across the public API — no throws.
- In-memory mock LRS (`createMemoryLrs`) for tests and demos.
- Launch helpers (`parseXapiLaunch`, `createXapiClientFromLaunch`) for
  TinCan/Rustici-style content deep-linking.
- `./server` subpath with protocol helpers for implementing an LRS:
  `validateStatement`, `statementsEquivalent`, `applyFormat`,
  `buildMultipartBody`/`parseMultipartBody`, `etagFor`/`checkConditionalHeaders`,
  `negotiateVersion`, `isVoidingStatement`/`voidingTarget`, and
  `verifySignedStatement` (JWS, RS256/ES256, `crypto.subtle`).
- Thin adapters: `./react` (`XapiProvider`, `useXapiClient`, `useXapiStatus`),
  `./vue` (`useXapiClient`), `./angular` (`provideXapi`, `XAPI`), `./svelte`
  (`createXapiStore`).
- IIFE build (`window.Xapi`) for CDN usage.
