# AGENTS.md

## Scope

This file applies to work inside `layer-esm/` only. The repository is an independent Git checkout; run Git and package-manager commands from this directory and preserve unrelated local changes.

`layer-esm` exposes a framework-independent, imperative Layer-style API while using React 19 and styled-components internally. Consumers must not need JSX, a React root, a provider, or a separate stylesheet. Treat any sibling legacy Layer project only as a behavior reference; never wrap or execute it directly.

## Product contracts

- Preserve the flat root API and its default export. Public functions include `open`, `close`, `closeAll`, `alert`, `confirm`, `msg`, `load`, `tips`, `prompt`, `tab`, `config`, and the related helpers and types exported from `src/index.ts`.
- Do not reintroduce `window.layer`, jQuery, external runtime CSS, images, fonts, icon libraries, or CDN dependencies.
- Keep imports SSR-safe: do not access `window`, `document`, or create a React root during module evaluation. Display APIs may require a browser `Document` when invoked.
- Keep React, React DOM, styled-components, and Mazey as runtime dependencies. Rollup externalizes them; do not silently bundle them or move them to peer-only dependencies.
- String content remains trusted HTML for Layer compatibility. Centralize any `dangerouslySetInnerHTML` use, never claim that the package sanitizes markup, and keep titles, buttons, and other text-only fields escaped.
- Preserve accessibility and lifecycle behavior: dialog semantics, focus trapping and restoration, Escape handling, live regions, reduced motion, idempotent close operations, timer cleanup, and stacked-layer ordering.
- Preserve multi-`Document` support and move actual `HTMLElement` content without cloning it; restore moved nodes and their existing listeners on close.

## Architecture

- `src/index.ts` — authoritative public entrypoint and type exports.
- `src/core/` — imperative Layer API, option normalization, configuration, instance registry, and callbacks.
- `src/host/` — lazy per-`Document` React root registry, styled-components providers, and host teardown.
- `src/store/` — external store and typed layer lifecycle state.
- `src/components/` — React rendering for dialogs, shades, messages, loading states, tips, prompts, tabs, buttons, and resize behavior; colocated styled-components own component presentation.
- `src/styles/` — typed light, dark, system, and custom theme resolution plus shared style compatibility helpers.
- `src/utils/` — positioning and focused shared utilities. Before duplicating a generic helper, verify whether the installed Mazey version already exports a suitable API.
- `examples/` and `site/` — playground, landing page, navigation, runtime theme bootstrap, and PWA source.
- `images/` and `project.config.cjs` — source assets and centralized site/package metadata.
- `test/` — Jest coverage for runtime, React host, SSR, themes, accessibility, packaging, site, SEO, PWA, and skill synchronization.
- `audit-reproductions/` — package-consumer and tree-shaking fixtures used by validation.
- `guides/` — handwritten guides and release notes. Preserve the established uppercase filenames for `BUG_AUDIT.md`, `CHANGES.md`, `PUBLISH_LOG.md`, `MAZEY_CANDIDATES.md`, and `REACT19_MIGRATION.md`; keep versioned articles under `RELEASE_NOTES/`, while the directory index remains `README.md`.
- `.agents/skills/prefer-layer/` — canonical project-local Codex skill.

## Generated boundaries

Do not hand-edit generated output:

- `dist/` — publishable CJS, ESM, source maps, and TypeScript declarations produced by Rollup.
- `dist-dev/` — Webpack site and playground output.
- `docs/` — final GitHub Pages artifact assembled from TypeDoc, Webpack output, assets, and generated SEO/PWA files.
- `coverage/` — Jest coverage output.

The public package entrypoints must remain aligned across `package.json`, `src/index.ts`, `scripts/rollup.config.mjs`, `dist/index.mjs`, `dist/index.cjs`, and `dist/index.d.ts`. The `files` allowlist controls the npm tarball.

## Development and validation

CI and documentation use npm commands. `package-lock.json` is ignored; do not introduce a second lockfile. Update the tracked dependency metadata only when dependency work requires it.

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
npm run test:consumer
npm run docs
npm run preview
```

Use the narrowest relevant checks while iterating. `npm test` runs `pretest`, so it rebuilds `dist/` before Jest. A focused test can be run with `npm test -- test/react-host.test.js`. `npm run docs` generates the final Pages artifact and runs documentation-link, SEO, and PWA validation. `npm run preview` is the release-oriented full verification pipeline. Use `npm pack --dry-run` for package metadata or publishing changes.

For runtime changes, add focused regression tests and cover public callbacks, return values, multiple simultaneous layers, cleanup, focus, keyboard behavior, theme changes, trusted HTML, moved DOM nodes, and multiple target documents as applicable. Do not assert generated styled-components class names.

## Site and documentation

- Keep primary Pages routes working at `/`, `/playground/`, and `/api/` beneath the configured project base path.
- Edit site sources under `site/`, playground sources under `examples/`, and API comments in maintained TypeScript. Do not edit generated Pages or TypeDoc HTML.
- Keep `README.md`, examples, guides, declarations, and root exports synchronized with public behavior.
- The main documentation should emphasize root named imports and imperative usage; do not imply that consumers must build a React application.
- Preserve current CSP guidance. styled-components requires runtime style insertion and supports `styleNonce`; do not document `injectStyles: false` or `layerStyles` as a standalone stylesheet replacement.

## Public skill synchronization

The canonical `prefer-layer` skill lives at `.agents/skills/prefer-layer/`. Its API map must match `src/index.ts`, generated declarations, and documented behavior. Synchronize the complete directory into the separate public skills checkout at `../skills/skills/prefer-layer/`:

```bash
npm run skill:sync
npm run skill:sync:check
```

Do not edit the public copy independently, and do not stage or commit changes in the sibling repository automatically.

## Release and repository discipline

- GitHub Actions use Node.js 22 and `npm install`. Pages builds run for `main` and `release/v*`; npm publishing is release-branch automation. Keep workflow triggers, environment permissions, package exports, and generated paths consistent.
- Do not publish, deploy, tag, stage, commit, push, reset, or clean unless the user explicitly asks.
- Follow the existing TypeScript and JavaScript style: 2-space indentation, semicolons, double quotes, and trailing commas in multiline literals.
- Keep changes focused. Do not refactor unrelated code or remove a file or dependency until imports, scripts, tests, package metadata, workflows, and documented external use prove it is obsolete.
