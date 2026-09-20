# Angular smoke test

A minimal Angular 17 standalone app that imports `@studiolxd/xapi/angular`
(`provideXapi` + `inject(XAPI)`) and compiles in **AOT/production**. It proves the
decorator-free adapter is consumable from a plain-ESM (tsup) build — no ng-packagr /
Angular Package Format required. See `PLAN.md` §8/§13.

This project is **outside** the pnpm workspace on purpose, and is installed with
**npm**, not pnpm: it stands in for a real downstream consumer, and
`@angular-devkit/build-angular` expects a flat `node_modules`.

## Run locally

```bash
# from the repo root
pnpm --filter @studiolxd/xapi run build

# `npm pack`, not `pnpm pack`: the smoke test must validate the exact artefact
# that `npm publish` will produce.
rm -f tests/angular-smoke/*.tgz   # a leftover tarball would match the glob below
cd packages/xapi
npm pack --pack-destination ../../tests/angular-smoke

cd ../../tests/angular-smoke
npm install
npm install ./studiolxd-xapi-*.tgz
npx ng build --configuration production
```

A successful `ng build` is the pass condition. CI runs the same steps
(`.github/workflows/angular-smoke.yml`) against Angular 17 (the documented floor).
