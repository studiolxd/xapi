# Angular smoke test

A minimal Angular 17 standalone app that imports `@studiolxd/xapi/angular`
(`provideXapi` + `inject(XAPI)`) and compiles in **AOT/production**. It proves the
decorator-free adapter is consumable from a plain-ESM (tsup) build — no ng-packagr /
Angular Package Format required. See `PLAN.md` §8/§13.

This project is **outside** the npm workspaces on purpose, so its Angular toolchain
doesn't interfere with the library install.

## Run locally

```bash
# from the repo root
npm run build --workspace=packages/xapi
npm pack --workspace=packages/xapi --pack-destination tests/angular-smoke

cd tests/angular-smoke
npm install
npm install ./studiolxd-xapi-*.tgz
npx ng build --configuration production
```

A successful `ng build` is the pass condition. CI runs the same steps
(`.github/workflows/angular-smoke.yml`) against Angular 17 (the documented floor).
