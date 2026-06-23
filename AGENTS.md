# AGENTS.md

## Scope

This file applies to work inside `layer-esm/` only.

`layer-esm` is the modern package for the Layer dialog library. Treat the sibling `../layer/` directory as a compatibility reference, not as code to wrap directly.

## Core rules

- Do **not** reintroduce `window.layer`, jQuery coupling, or external runtime CSS/image/font dependencies.
- Preserve the familiar Layer API surface where practical: `open`, `close`, `alert`, `confirm`, `msg`, `load`, `tips`, `prompt`, `tab`, and related helpers.
- Prefer direct named imports in documentation and examples when they make the ESM usage clearer.
- Keep package metadata, runtime exports, and generated declaration outputs aligned whenever you change public APIs.

## Important directories

- `src/index.ts` — public package entrypoint
- `src/core/` — runtime logic, state, and exported APIs
- `src/components/` — DOM rendering helpers
- `src/styles/` — runtime-injected theme/style code
- `src/utils/` — DOM, positioning, and shared helpers
- `examples/` — dev/demo entry used by webpack dev server
- `test/` — Jest coverage for the public API
- `release-notes/` — change records, publish logs, and longer-form docs
- `scripts/` — Rollup, webpack, release, and packaging scripts

## Build, test, and dev commands

Run these from `layer-esm/`:

```bash
npm install
npm run dev
npm run build
npm test
npm test -- test/layer.test.js
npm run lint:fix
npm run docs
```

## Packaging expectations

- Publishable files are generated into `dist/`.
- Current package outputs are:
  - `dist/index.mjs`
  - `dist/index.cjs`
  - `dist/index.d.ts`
- `scripts/rollup.config.mjs` controls publishable bundles.
- `scripts/webpack.config.dev.cjs` controls the local examples/dev-server flow.
- `package.json` and `.github/workflows/publish-npm.yml` must stay consistent with any output filename or export changes.

## Documentation expectations

- Main package docs live in `README.md`.
- Versioned or release-focused articles belong under `release-notes/`.
- When updating examples, keep `examples/index.ts` aligned with the APIs that are actually implemented.

## Conventions

- Runtime styles belong in `src/styles/theme.ts` and should be injected once.
- Prefer CSS primitives for icons and loading states over legacy sprite/gif assets.
- Follow the existing project formatting: 2-space indentation, semicolons, double quotes, and trailing commas for multiline literals.
- Keep example and article wording in English unless a task explicitly asks for another language.
