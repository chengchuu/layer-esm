# layer-esm Bug Audit

## Remediation Update — 2026-07-15

All 26 findings below have been addressed in the current working tree. The original evidence and
baseline remain in this report as a historical record of the defects that drove the patch. New
regression coverage exercises lifecycle idempotency, focus and keyboard behavior, scroll and DOM
restoration, responsive sizing, CSP style modes, iframe safety, window controls, PWA install-event
behavior, package-consumer types, and tree-shaking.

Post-fix verification includes the full `npm run preview` pipeline, source-based Jest coverage,
`npm pack --dry-run`, `npm audit` with zero known vulnerabilities, the focused runtime reproduction,
and real-browser checks at a 320 px viewport in both light and dark themes.

## Executive Summary

This audit confirmed 26 issues: 7 high-severity, 14 medium-severity, and 5 low-severity. No critical package-entrypoint or arbitrary-code-execution defect was confirmed.

The ESM, CommonJS, and declaration entrypoints build and resolve correctly. Repeated production builds were byte-for-byte deterministic, `npm pack --dry-run` contained the expected eight publishable files, all 31 existing Jest tests passed, and the generated Home, Playground, and deep TypeDoc routes loaded with correct project-relative assets and canonical URLs.

Passing checks conceal substantial runtime gaps. Confirmed high-risk defects include non-idempotent close operations, broken fullscreen restoration and scroll locking, document-level gesture listeners surviving layer removal, destructive handling of reused DOM content, inaccessible dialogs, mobile dialog overflow, and a publish workflow that attempts an npm release on every push to `main`. The focused reproduction at `audit-reproductions/runtime-audit.cjs` records the current failures without changing production code.

## Audit Scope

Reviewed tracked source, hidden configuration, package metadata, generated outputs, release notes, examples, tests, Rollup/Webpack configuration, TypeDoc Pages assembly, SEO/PWA generation, Docker files, and GitHub Actions. The audit treated `src/index.ts` as the authoritative public surface and did not modify production implementation.

The following were exercised directly:

- All named runtime exports and the default export in ESM and CommonJS.
- Node/SSR-safe import behavior and browser-only invocation failure behavior.
- TypeScript NodeNext package self-resolution.
- Build determinism, publish contents, source maps, output size, and Rollup tree shaking.
- Dialog creation, close races, scroll state, fullscreen/minimize, DOM movement, drag teardown, iframe access, responsive layout, keyboard behavior, and accessible metadata.
- Home, Playground, API overview, and a deep API page under `/layer-esm/`.
- SEO, manifest, worker scope, cache tests, and update validators.

## Commands Run

```text
npm install
npm run typecheck
npm run lint
npm run format:check
npm test
npm test -- --runInBand --detectOpenHandles
npm test -- test/layer.test.js
npm run build (twice, with SHA-256 comparison)
npm run docs
npm run seo:validate
npm run pwa:validate
npm run preview
npm pack --dry-run --json
npx jest --coverage --runInBand test/layer.test.js
npx tsc --showConfig
npx tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --lib DOM,ES2022 audit-reproductions/package-consumer.ts
npx rollup audit-reproductions/tree-shake-entry.mjs --format esm --file /tmp/layer-esm-msg-bundle.mjs
node audit-reproductions/runtime-audit.cjs
node --check (all CJS scripts, project.config.cjs, commitlint config, and service worker)
node ESM and CommonJS package-import probes
npm ls --depth=0
```

The local production preview was served at `http://127.0.0.1:4173/layer-esm/` and inspected in the in-app browser at 320×568 and 1366×768.

## Verification Baseline

| Command                                       | Result                   | Notes                                                                                                                                                                         |
| --------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm install`                                 | Pass                     | Completed in 589 ms. The repository intentionally ignores its local lockfile; see BUG-017.                                                                                    |
| `npm run typecheck`                           | Pass                     | TypeScript 5.3.2, strict mode, `skipLibCheck: true`.                                                                                                                          |
| `npm run lint`                                | Pass with warnings       | Exit 0 with 177 warnings; see BUG-022.                                                                                                                                        |
| `npm run format:check`                        | Pass                     | The configured file list passed; it omits core runtime files and `test/layer.test.js`.                                                                                        |
| `npm test`                                    | Pass                     | 5 suites, 31 tests. Node printed `[DEP0040]` for `punycode`.                                                                                                                  |
| `npm test -- --runInBand --detectOpenHandles` | Pass                     | No open handle was reported; this does not exercise an in-progress drag.                                                                                                      |
| `npm test -- test/layer.test.js`              | Pass                     | 7 runtime tests.                                                                                                                                                              |
| `npm run build`                               | Pass                     | CJS, ESM, declarations, and source maps generated. Two builds had identical hashes.                                                                                           |
| `npm run docs`                                | Pass                     | Webpack production build, Pages assembly, SEO, and PWA validators passed.                                                                                                     |
| `npm run seo:validate`                        | Pass                     | 3 primary pages and 38 API pages.                                                                                                                                             |
| `npm run pwa:validate`                        | Pass                     | 3 entry pages and 3 manifest icons.                                                                                                                                           |
| `npm run preview`                             | Pass with lint warnings  | Complete pipeline exited 0 despite 177 lint warnings.                                                                                                                         |
| `npm pack --dry-run --json`                   | Pass                     | 8 files, 119,826-byte tarball, 427,868 bytes unpacked.                                                                                                                        |
| Node ESM import                               | Pass                     | 22 named functions plus default export; importing does not touch `document`.                                                                                                  |
| Node CJS require                              | Pass                     | Same surface as ESM; invoking `open()` clearly reports that a browser document is required.                                                                                   |
| NodeNext type consumer                        | Pass with `skipLibCheck` | Valid import and invalid `LayerType` expectation passed. Without `skipLibCheck`, local stale `@types/glob`/`minimatch` declarations fail before the consumer file is checked. |
| Focused runtime reproduction                  | Confirmed failures       | Recorded 16 independently observable failures.                                                                                                                                |
| Rollup `msg`-only consumer                    | Pass, poor reduction     | 39,550 bytes versus 46,770-byte full ESM output.                                                                                                                              |
| Manual browser routes                         | Partial pass             | Page shells and deep assets worked; the opened alert overflowed a 320 px viewport and lacked modal semantics.                                                                 |

## Project Architecture

| Responsibility                                                | Owner                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Public exports and public types                               | `src/index.ts`                                                     |
| Defaults, singleton state, lifecycle, events, all public APIs | `src/core/layer.ts`                                                |
| Public/internal option and record types                       | `src/core/types.ts`                                                |
| Icons, spinners, and tip DOM                                  | `src/components/render.ts`                                         |
| DOM primitives and HTML insertion                             | `src/utils/dom.ts`                                                 |
| Offset, size, shade, and tip positioning                      | `src/utils/position.ts`                                            |
| Runtime CSS injection                                         | `src/styles/inject.ts`                                             |
| Runtime component CSS                                         | `src/styles/theme.ts`                                              |
| Runtime tests                                                 | `test/layer.test.js` against built CJS                             |
| Playground                                                    | `examples/index.ts`, `examples/index.html`                         |
| Package build                                                 | `scripts/rollup.config.mjs`                                        |
| Site/playground build                                         | `scripts/webpack.config.dev.cjs`                                   |
| Pages/TypeDoc transformation                                  | `scripts/build-pages.cjs`                                          |
| SEO/PWA validators                                            | `scripts/validate-seo.cjs`, `scripts/validate-pwa.cjs`             |
| PWA runtime and worker                                        | `site/pwa.ts`, `site/service-worker.js`                            |
| CI and publishing                                             | `.github/workflows/pages.yml`, `.github/workflows/publish-npm.yml` |

There is no duplicated dialog implementation. The dominant maintainability risk is the opposite: nearly every runtime concern is coupled into the 1,023-line `src/core/layer.ts` singleton.

## Public API Coverage

“Tests” means direct behavioral coverage in `test/layer.test.js`, not incidental use in the playground. “Docs” means generated TypeDoc presence; the README documents only the basic `close`/`confirm`/`load`/`msg` flow.

| API             | Runtime | Types |       Tests | Docs | Findings                                                               |
| --------------- | ------: | ----: | ----------: | ---: | ---------------------------------------------------------------------- |
| default `layer` |     Yes |   Yes | Import only |  Yes | BUG-024                                                                |
| `config`        |     Yes |   Yes |          No |  Yes | BUG-011, BUG-024                                                       |
| `ready`         |     Yes |   Yes |          No |  Yes | BUG-021                                                                |
| `open`          |     Yes |   Yes |         Yes |  Yes | BUG-001, BUG-005, BUG-006, BUG-010, BUG-011, BUG-015, BUG-018, BUG-021 |
| `close`         |     Yes |   Yes |         Yes |  Yes | BUG-002, BUG-004, BUG-005                                              |
| `closeAll`      |     Yes |   Yes |          No |  Yes | BUG-002                                                                |
| `alert`         |     Yes |   Yes |          No |  Yes | BUG-013                                                                |
| `confirm`       |     Yes |   Yes |         Yes |  Yes | BUG-001                                                                |
| `msg`           |     Yes |   Yes |         Yes |  Yes | BUG-002                                                                |
| `load`          |     Yes |   Yes |         Yes |  Yes | BUG-001, BUG-018                                                       |
| `tips`          |     Yes |   Yes |          No |  Yes | BUG-020                                                                |
| `prompt`        |     Yes |   Yes |         Yes |  Yes | BUG-001                                                                |
| `tab`           |     Yes |   Yes |          No |  Yes | BUG-001                                                                |
| `title`         |     Yes |   Yes |          No |  Yes | BUG-019                                                                |
| `style`         |     Yes |   Yes |          No |  Yes | None confirmed                                                         |
| `setTop`        |     Yes |   Yes |          No |  Yes | BUG-011                                                                |
| `getChildFrame` |     Yes |   Yes |          No |  Yes | BUG-012                                                                |
| `getFrameIndex` |     Yes |   Yes |          No |  Yes | Test gap                                                               |
| `iframeAuto`    |     Yes |   Yes |          No |  Yes | BUG-012                                                                |
| `iframeSrc`     |     Yes |   Yes |          No |  Yes | Security documentation gap                                             |
| `min`           |     Yes |   Yes |          No |  Yes | BUG-009                                                                |
| `restore`       |     Yes |   Yes |          No |  Yes | BUG-003, BUG-009                                                       |
| `full`          |     Yes |   Yes |          No |  Yes | BUG-003                                                                |

## Findings Summary

| ID      | Severity | Confidence      | Area                     | Title                                                                        |
| ------- | -------- | --------------- | ------------------------ | ---------------------------------------------------------------------------- |
| BUG-001 | High     | Confirmed       | Accessibility            | Dialogs have no modal semantics, focus management, or Escape handling        |
| BUG-002 | High     | Confirmed       | Lifecycle                | Repeated close requests execute teardown and callbacks more than once        |
| BUG-003 | High     | Confirmed       | Window state             | Fullscreen cannot be restored and leaks the scroll lock                      |
| BUG-004 | High     | Confirmed       | Events                   | Active drag/resize document listeners survive layer removal                  |
| BUG-005 | High     | Confirmed       | DOM lifecycle            | Reused or externally disturbed DOM content is lost and can abort teardown    |
| BUG-006 | High     | Confirmed       | Responsive runtime       | Ordinary alerts overflow a 320 px viewport                                   |
| BUG-007 | High     | High confidence | Release automation       | Every main push attempts an npm release and version tag                      |
| BUG-008 | Medium   | Confirmed       | Scroll restoration       | Closing overwrites a page's pre-existing overflow style                      |
| BUG-009 | Medium   | Confirmed       | Window controls          | Max/min toolbar controls are inert and minimized windows overlap             |
| BUG-010 | Medium   | Confirmed       | Sizing                   | Default `maxWidth` overrides explicit wider `area` values                    |
| BUG-011 | Medium   | Confirmed       | Stacking                 | Per-layer and global `zIndex` options are ignored                            |
| BUG-012 | Medium   | Confirmed       | Iframes                  | Cross-origin frame helpers throw `SecurityError`                             |
| BUG-013 | Medium   | Confirmed       | API compatibility        | `alert()` has no default acknowledgement button                              |
| BUG-014 | Medium   | Confirmed       | Drag API                 | Common selector strings such as `#handle` throw during open                  |
| BUG-015 | Medium   | Confirmed       | TypeScript/DOM           | A declared content tuple renders as `[object HTMLElement]`                   |
| BUG-016 | Medium   | High confidence | PWA                      | Native install prompting is suppressed when no install UI exists             |
| BUG-017 | Medium   | Confirmed       | Reproducibility          | The dependency lockfile is ignored and absent from Git                       |
| BUG-018 | Medium   | High confidence | Browser compatibility    | Declared Babel targets are not backed by required polyfills or CSS fallbacks |
| BUG-019 | Medium   | Confirmed       | Security/API consistency | `title()` converts caller data to HTML without documentation                 |
| BUG-020 | Medium   | High confidence | Positioning              | Tips are never clamped or flipped into the viewport                          |
| BUG-021 | Medium   | High confidence | CSP/style injection      | Runtime styles cannot receive a CSP nonce                                    |
| BUG-022 | Low      | Confirmed       | Quality gates            | Lint, formatting, and Husky gates do not enforce the stated conventions      |
| BUG-023 | Low      | Confirmed       | Dependencies             | Build tooling contains unused and obsolete duplicate packages                |
| BUG-024 | Low      | Confirmed       | Performance              | A `msg`-only consumer retains about 85% of the ESM bundle                    |
| BUG-025 | Low      | Confirmed       | Tests                    | Runtime coverage is narrow and source coverage reporting is misleading       |
| BUG-026 | Low      | Confirmed       | Documentation/tooling    | Version, Windows, and Docker guidance conflict with the actual project       |

## Critical Findings

No critical issue was confirmed within the tested scope. Package entrypoints were usable, the tarball contained its required files, and no unintentional code execution path beyond documented HTML rendering was demonstrated.

## High-Severity Findings

### BUG-001: Dialogs have no modal semantics, focus management, or Escape handling

**Severity:** High  
**Confidence:** Confirmed  
**Area:** Accessibility and keyboard behavior  
**Affected files:** `src/core/layer.ts:473-628`, `src/styles/theme.ts:77-204`  
**Affected API/subsystem:** `open`, `alert`, `confirm`, `prompt`, `tab`, `load`

#### Evidence

`createRecord` creates an unannotated `<div>` and title, but never assigns `role`, `aria-modal`, `aria-labelledby`, or `aria-describedby`. `mountRecord` binds mouse actions only and does not focus a dialog control, trap focus, handle Escape, or restore the previously focused element. The 320 px browser check left focus on the Playground trigger after opening; pressing Escape left the dialog mounted. The reproduction reports null role/ARIA attributes and `BODY` as the active element in isolation.

#### Trigger

Open any dialog, especially over interactive page content, and navigate with a keyboard or screen reader.

#### Reproduction

Run `node audit-reproductions/runtime-audit.cjs`, or open the Playground alert and inspect the active element and dialog accessibility tree.

#### Expected behavior

The foreground layer has an appropriate dialog/status role and accessible name, receives initial focus, contains keyboard navigation while modal, closes on Escape when allowed, and restores focus after close.

#### Actual behavior

Assistive technology receives a generic container. Focus remains behind the overlay and Escape has no effect.

#### Impact

Core interactions are inaccessible to keyboard and screen-reader users, and background controls remain operable while a visually modal layer is open.

#### Suggested correction

Introduce explicit modality metadata, stable title/description IDs, initial focus selection, a top-layer focus trap, Escape handling through the existing cancel contract, and focus restoration. Give loading/message/tip variants appropriate live-region or tooltip semantics rather than forcing every type into `dialog`.

#### Regression test

Test initial focus, Tab/Shift+Tab cycling, Escape cancellation, nested-layer focus restoration, `aria-modal`, accessible naming, and a loading status announcement in a real browser plus jsdom unit tests.

### BUG-002: Repeated close requests execute teardown and callbacks more than once

**Severity:** High  
**Confidence:** Confirmed  
**Area:** Dialog lifecycle and timers  
**Affected files:** `src/core/layer.ts:622-647`, `src/core/layer.ts:797-838`  
**Affected API/subsystem:** `close`, `closeAll`, timed `msg`/`tips`

#### Evidence

Animated close leaves the record in `state.instances` for 180 ms and has no `closing` flag. Every call schedules a new untracked `finish` timer. Two immediate closes produced `endCalls: 2` and `closeCallbacks: 2`. A layer's auto-close timer can create the same race with a manual close.

#### Trigger

Call `close(index)` twice during the exit animation, or manually close a timed layer shortly before its timer fires.

#### Reproduction

The `doubleClose` result in `audit-reproductions/runtime-audit.cjs` opens one layer, calls close twice, and waits 230 ms.

#### Expected behavior

Removal and the `end` lifecycle callback happen once. Additional close calls are ignored or attach a completion callback to the same close operation.

#### Actual behavior

Two teardown timers run and `end` executes twice.

#### Impact

Application cleanup, state transitions, network actions, or new dialog creation placed in `end` can happen repeatedly. Scroll and moved-content cleanup also run against an already removed record.

#### Suggested correction

Mark a record as closing before scheduling animation teardown, clear its auto-close timer immediately, store the close timer, and make finalization idempotent with `try/finally` cleanup.

#### Regression test

Cover double close, manual-plus-timeout close, close from `cancel`, close from `end`, and `closeAll` while one record is already closing.

### BUG-003: Fullscreen cannot be restored and leaks the scroll lock

**Severity:** High  
**Confidence:** Confirmed  
**Area:** Fullscreen, restoration, and page scroll  
**Affected files:** `src/core/layer.ts:730-795`  
**Affected API/subsystem:** `full`, `restore`, `close`

#### Evidence

`full` saves `restoreCssText` but never sets `minimized`; `restore` returns unless `record.minimized` is true. A `full()` then `restore()` sequence remained `100vw × 100vh`. For a `scrollbar: false` layer, mount locks once, `full` locks a second time, and close unlocks once, leaving `documentElement.style.overflow === "hidden"`.

#### Trigger

Call `full(index)` and then `restore(index)`, or fullscreen a layer opened with `scrollbar: false` and close it.

#### Reproduction

See `restoreAfterFull` and `overflowAfterFullscreenClose` in `audit-reproductions/runtime-audit.cjs`.

#### Expected behavior

Fullscreen is idempotent, retains one restoration snapshot, restores the prior geometry, and does not alter scroll-lock reference counts more than once.

#### Actual behavior

Restore is a no-op and closing can leave the whole page permanently locked.

#### Impact

The documented window-control flow is not reversible, and users can be unable to scroll after a fullscreen layer closes.

#### Suggested correction

Track minimized and fullscreen states separately, use a single display-state transition helper, retain the original CSS exactly once, and make scroll locking record-owned and idempotent.

#### Regression test

Test normal→full→restore, min→restore, repeated full, full while minimized, and close from every state with one and multiple scroll-locking layers.

### BUG-004: Active drag/resize document listeners survive layer removal

**Severity:** High  
**Confidence:** Confirmed  
**Area:** DOM events and cleanup  
**Affected files:** `src/core/layer.ts:288-372`, `src/core/layer.ts:631-647`  
**Affected API/subsystem:** Dragging, resizing, `close`

#### Evidence

The `mousemove` and `mouseup` cleanup functions created inside each `mousedown` handler are local variables and are never added to `record.cleanup`. Closing during a drag removed the layer, but a subsequent document `mousemove` changed the retained detached root's left position from `10px` to `110px`. The resize path has the same structure.

#### Trigger

Begin dragging or resizing, then close the dialog from code, a timer, or another layer before mouseup.

#### Reproduction

See `dragAfterClose` in the focused runtime reproduction.

#### Expected behavior

Layer teardown terminates any active gesture and removes every document-level listener immediately.

#### Actual behavior

Global listeners remain until a later mouseup, retaining and mutating the detached layer.

#### Impact

This creates a lifecycle leak and can cause stale UI state or repeated global work. If mouseup never reaches the document, the handlers remain indefinitely.

#### Suggested correction

Store active gesture cleanup on the record, cancel it from `removeRecord`, use pointer events with pointer capture, and handle pointer cancellation and window blur.

#### Regression test

Instrument document listeners and close during drag/resize, on pointer cancel, outside the viewport, and after multiple rapid gestures.

### BUG-005: Reused or externally disturbed DOM content is lost and can abort teardown

**Severity:** High  
**Confidence:** Confirmed  
**Area:** DOM content lifecycle  
**Affected files:** `src/core/layer.ts:182-216`, `src/core/layer.ts:381-444`, `src/core/layer.ts:631-647`  
**Affected API/subsystem:** `open({ content: HTMLElement })`, `close`

#### Evidence

The record stores `originalNextSibling` but never uses it. If the placeholder is removed, `insertBefore(node, placeholder)` throws `NotFoundError`; teardown stops before shade/root removal and registry deletion. If the same node is opened in two layers, closing both restores it into the first layer's detached content container. The reproduction ends with `connected: false` and `restoredToOriginalParent: false`.

#### Trigger

Remove or replace the placeholder externally, or open the same existing element in two layers before closing either.

#### Reproduction

See `removedPlaceholder` and `reusedElement` in `audit-reproductions/runtime-audit.cjs`.

#### Expected behavior

Content is leased by at most one layer, restored to the original location when possible, and teardown completes even if external DOM changes occur.

#### Actual behavior

The element can be lost in a detached tree, or a thrown restoration error leaves the layer mounted and registered.

#### Impact

Forms, custom elements, event-bound application nodes, and their state can disappear from the live document. A failed close also leaks the layer and scroll lock.

#### Suggested correction

Track node ownership in a `WeakMap`, reject or transfer duplicate leases explicitly, validate that the placeholder still belongs to its parent, fall back to the saved next sibling/parent, and put remaining teardown in `finally`.

#### Regression test

Cover duplicate use, removed/reparented placeholders, disconnected nodes, custom elements, form state, and closing parent/child layers in both orders.

### BUG-006: Ordinary alerts overflow a 320 px viewport

**Severity:** High  
**Confidence:** Confirmed  
**Area:** Responsive dialog layout  
**Affected files:** `src/styles/theme.ts:9-36`, `src/styles/theme.ts:202-204`, `src/core/layer.ts:259-272`  
**Affected API/subsystem:** Dialog and page rendering

#### Evidence

The root is viewport-limited, but `.layer-esm__dialog` has `min-width: 300px` inside content with 40 px horizontal padding and borders. In a real 320×568 viewport, the Playground alert measured 342 px wide with `left: -11` and `right: 331`.

#### Trigger

Open a default alert on a 320 px viewport or at sufficiently high browser zoom.

#### Reproduction

Serve `docs` with `scripts/preview-pages.cjs`, open `/layer-esm/playground/` at 320×568, and activate “Alert: Content.”

#### Expected behavior

The full dialog, including close control and content, remains inside the visual viewport without horizontal scrolling.

#### Actual behavior

The layer extends 11 px beyond both sides.

#### Impact

Controls/content can be clipped on small phones and at 200–400% zoom.

#### Suggested correction

Make inner dialog min-width responsive (`min(300px, 100%)` or `min-width: 0`), give the root a viewport-safe computed width, and test padding as part of the box model.

#### Regression test

Measure every layer type at 320×568 and 360×800, with long text and 200%/400% zoom.

### BUG-007: Every main push attempts an npm release and version tag

**Severity:** High  
**Confidence:** High confidence  
**Area:** Release automation  
**Affected files:** `.github/workflows/publish-npm.yml:11-20`, `.github/workflows/publish-npm.yml:43-92`  
**Affected API/subsystem:** npm/GitHub Packages publication and tagging

#### Evidence

The workflow runs on every push to `main`; the publish job is guarded only by `github.event_name == 'push'` and calls `npm publish`. The current repository already has `v1.0.13` on `origin/main`, while the audited branch still declares version `1.0.13`. A future merge without a version bump will attempt to republish an existing npm version and then recreate an existing tag.

#### Trigger

Merge any documentation, site, test, or code-only change to `main` without changing the package version.

#### Reproduction

Inspect the workflow conditions and compare `package.json` version with `git tag --sort=-version:refname`.

#### Expected behavior

Ordinary main pushes run verification only. Publication requires an explicit release event/version change and verifies that npm and Git tags do not already contain the target version.

#### Actual behavior

Every main push enters the publication path; duplicate versions fail after doing redundant install/build work.

#### Impact

Routine merges can produce failed release workflows. A version bump merged for preparatory reasons publishes immediately, increasing accidental-release risk.

#### Suggested correction

Separate CI from release, trigger publishing from a version tag or protected manual workflow, use an environment approval, check registry/tag availability before publish, and run `npm pack --dry-run` before external writes.

#### Regression test

Add a workflow policy test that asserts main pushes cannot reach `npm publish` and validate duplicate-version behavior in a dry-run release script.

## Medium-Severity Findings

### BUG-008: Closing overwrites a page's pre-existing overflow style

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Scroll restoration  
**Affected files:** `src/core/layer.ts:169-180`, `src/core/layer.ts:577-579`, `src/core/layer.ts:644-646`  
**Affected API/subsystem:** `open({ scrollbar: false })`, `close`

#### Evidence

The first lock writes `documentElement.style.overflow = "hidden"`; the final unlock always writes an empty string. Starting with `overflow: clip` ended with `""` in the reproduction.

#### Trigger

Use a scroll-locking layer on a page that already has an inline overflow value.

#### Reproduction

See `preexistingOverflow` in the focused runtime reproduction.

#### Expected behavior

The exact original inline value is restored after the final lock closes.

#### Actual behavior

The library destroys the caller's value.

#### Impact

Host-page layout and scrolling can change after a dialog closes.

#### Suggested correction

Capture the original style when the lock count changes from 0 to 1 and restore that captured value when it returns to 0; scope lock state to the owning document.

#### Regression test

Cover empty, `hidden`, `clip`, and custom overflow values with nested locks closed out of order.

### BUG-009: Max/min toolbar controls are inert and minimized windows overlap

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Window controls  
**Affected files:** `src/core/layer.ts:473-529`, `src/core/layer.ts:590-620`, `src/core/layer.ts:730-775`  
**Affected API/subsystem:** `maxmin`, `min`, `restore`

#### Evidence

`maxmin: true` creates min and max buttons but stores neither on the record and binds no click listeners. Clicking both changed no layout. Separately, `min` derives every stack position from `state.instances.size - 1`; minimizing two live layers placed both at `left: 188px`. It also reads the call-time `options.minStack` instead of `record.options.minStack`.

#### Trigger

Enable `maxmin`, or minimize more than one live layer.

#### Reproduction

See `maxminToolbar` and `minimizedPositions` in `audit-reproductions/runtime-audit.cjs`.

#### Expected behavior

Toolbar controls invoke predictable min/full/restore transitions, and minimized layers occupy distinct slots while honoring the configured `minStack`.

#### Actual behavior

Toolbar buttons do nothing and minimized windows overlap exactly.

#### Impact

Visible controls are misleading and multi-window workflows become unusable.

#### Suggested correction

Store and bind toolbar controls, model window state explicitly, allocate slots from the set of minimized records, and reflow slots after close/restore.

#### Regression test

Click each toolbar control and minimize/restore/close three layers in different orders.

### BUG-010: Default `maxWidth` overrides explicit wider `area` values

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Sizing options  
**Affected files:** `src/core/layer.ts:32-71`, `src/core/layer.ts:259-272`  
**Affected API/subsystem:** `open({ area, maxWidth })`, `tab`, iframe examples

#### Evidence

Every root receives inline `maxWidth: 360px` from the default, even when `area` sets a larger explicit width. The reproduction produced `width: 640px` plus `maxWidth: 360px`, so layout is clamped to 360 px.

#### Trigger

Set `area: ["640px", ...]` without also overriding `maxWidth`.

#### Reproduction

See `explicitArea` in the focused runtime reproduction. The Playground tab example requests 640 px and is affected.

#### Expected behavior

An explicit area width is honored, or documentation clearly states that callers must raise `maxWidth` too.

#### Actual behavior

The default cap silently wins.

#### Impact

Tabs, forms, and iframe layers appear substantially narrower than configured.

#### Suggested correction

Apply the default max width only to auto-width content, or normalize an explicit area and max width with documented precedence.

#### Regression test

Assert computed width for numeric, pixel, percentage, viewport, and auto areas with and without explicit max width.

### BUG-011: Per-layer and global `zIndex` options are ignored

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Stacking state  
**Affected files:** `src/core/layer.ts:24-30`, `src/core/layer.ts:110-148`, `src/core/layer.ts:218-224`  
**Affected API/subsystem:** `config`, `open({ zIndex })`, `setTop`

#### Evidence

Normalization retains `options.zIndex`, but `updateZIndex` increments only `state.zIndex`, initialized once to 19891014. Requesting 50,000,000 yielded root z-index 19,891,017.

#### Trigger

Configure a z-index needed to sit above an application's existing stacking layer.

#### Reproduction

See `requestedZIndex` in `audit-reproductions/runtime-audit.cjs`.

#### Expected behavior

The configured base/per-layer z-index affects the shade and root while preserving ordering.

#### Actual behavior

The option has no effect.

#### Impact

Dialogs can render behind host application overlays with no working configuration escape hatch.

#### Suggested correction

Define whether `zIndex` is a base or exact value, seed/update the counter accordingly, and account for multiple package copies.

#### Regression test

Test global config, per-open override, two dialogs, shade ordering, and `setTop` after a custom value.

### BUG-012: Cross-origin frame helpers throw `SecurityError`

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Iframe compatibility and error handling  
**Affected files:** `src/core/layer.ts:701-721`  
**Affected API/subsystem:** `getChildFrame`, `iframeAuto`

#### Evidence

Both helpers read `iframe.contentDocument` without a try/catch. A frame whose getter throws a browser-equivalent `SecurityError` caused `getChildFrame` to throw. Optional chaining cannot catch access-control exceptions.

#### Trigger

Call either helper for a cross-origin or navigated-away iframe.

#### Reproduction

See `crossOriginFrame` in the focused runtime reproduction, which installs a throwing `contentDocument` getter.

#### Expected behavior

Same-origin access works; inaccessible frames return `null`/no-op or a documented controlled error.

#### Actual behavior

A DOM security exception escapes unexpectedly.

#### Impact

Normal cross-origin iframe usage can crash application callbacks.

#### Suggested correction

Wrap same-origin document access, distinguish missing/loading/cross-origin states, and document the limitation. Add an iframe `title` option for accessibility.

#### Regression test

Cover same-origin, cross-origin, about:blank, removed, slow-loading, and navigated iframe cases.

### BUG-013: `alert()` has no default acknowledgement button

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Legacy-compatible public API behavior  
**Affected files:** `src/core/layer.ts:32-71`, `src/core/layer.ts:840-847`  
**Affected API/subsystem:** `alert`

#### Evidence

Base options set `btn: false`; unlike `confirm`, `alert` does not supply an `OK` button. `alert("Alert body")` rendered zero `.layer-esm__button` elements, so its `yes` callback cannot be invoked from an acknowledgement action.

#### Trigger

Call `alert(content)` with defaults or pass a `yes` callback without also specifying `btn`.

#### Reproduction

See `alertDefaultButtons` in the focused runtime reproduction.

#### Expected behavior

A familiar Layer alert exposes one acknowledgement button that invokes `yes`.

#### Actual behavior

Only the toolbar close control is available.

#### Impact

Alert callback behavior and migration compatibility are broken.

#### Suggested correction

Give `alert` a default `btn: ["OK"]` while preserving explicit caller overrides and document callback/auto-close semantics.

#### Regression test

Test default alert, callback-only overload, explicit button labels, close button cancellation, and callback order.

### BUG-014: Common selector strings such as `#handle` throw during open

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Drag handle resolution  
**Affected files:** `src/core/layer.ts:288-303`  
**Affected API/subsystem:** `open({ move })`

#### Evidence

Every string is first prefixed with `.`. `move: "#drag-handle"` therefore calls `querySelector(".#drag-handle")`, which throws before the fallback query runs.

#### Trigger

Use an ID, attribute, compound, or other CSS selector rather than a bare class name.

#### Reproduction

See `idDragSelector` in the focused runtime reproduction.

#### Expected behavior

The documented string accepts a selector, or the type/docs restrict it to a class token and invalid input degrades safely.

#### Actual behavior

Opening throws `SyntaxError` and may leave partially created state in other failure locations.

#### Impact

Valid CSS selectors break dialog creation.

#### Suggested correction

Try the caller's selector directly with controlled error handling; optionally retain a clearly documented bare-class compatibility path.

#### Regression test

Cover `.class`, bare class, `#id`, attribute, descendant, invalid, and missing selectors.

### BUG-015: A declared content tuple renders as `[object HTMLElement]`

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** TypeScript/runtime contract  
**Affected files:** `src/core/types.ts:33-37`, `src/core/layer.ts:381-444`  
**Affected API/subsystem:** `LayerOptions.content`, `open`

#### Evidence

The public type permits `[string, HTMLElement | string]`. Outside the iframe/tips branches, an array is stringified. Opening a page layer with `["ignored", button]` rendered `ignored,[object HTMLButtonElement]`; the element was not moved.

#### Trigger

Use the tuple form accepted by TypeScript with a page/dialog layer.

#### Reproduction

See `typedContentTuple` in `audit-reproductions/runtime-audit.cjs`.

#### Expected behavior

Every accepted public type has defined runtime semantics, preferably as a discriminated union tied to `type`.

#### Actual behavior

Valid typed input produces unintended text.

#### Impact

Consumers receive false type safety and broken DOM rendering.

#### Suggested correction

Replace the broad interface with discriminated content types or implement/document the tuple. Keep iframe `[url, scrolling]` separate from element content.

#### Regression test

Add compile-time and runtime tests for every declared content variant and layer type.

### BUG-016: Native install prompting is suppressed when no install UI exists

**Severity:** Medium  
**Confidence:** High confidence  
**Area:** PWA install lifecycle  
**Affected files:** `site/pwa.ts:66-107`, `site/index.html`, `examples/index.html`, `test/pwa.test.js:30-105`  
**Affected API/subsystem:** `beforeinstallprompt`

#### Evidence

The Home and Playground no longer contain `[data-pwa-install]`, but initialization still registers `beforeinstallprompt` and unconditionally calls `preventDefault()`. With an empty `installButtons` array, no UI can invoke the retained prompt. Existing tests fabricate install buttons that no production entry page contains.

#### Trigger

Visit the production PWA in a Chromium browser that dispatches `beforeinstallprompt`.

#### Reproduction

Build Pages, confirm the generated entry pages contain no install button, and dispatch a cancelable `beforeinstallprompt` against `initializeInstallExperience`; it is prevented with zero available buttons.

#### Expected behavior

Without custom install UI, the code does not intercept the browser's install event.

#### Actual behavior

The native prompt is suppressed and the deferred event is unreachable except through the browser's separate menu.

#### Impact

PWA discoverability regresses after intentionally removing the custom buttons.

#### Suggested correction

Return early or avoid `preventDefault` when no install controls exist, and update PWA tests to render actual production markup.

#### Regression test

Test zero-button pages and assert `defaultPrevented === false`; retain separate custom-control tests only if that UI returns.

### BUG-017: The dependency lockfile is ignored and absent from Git

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Build reproducibility and CI  
**Affected files:** `.gitignore:41-43`, `.github/workflows/pages.yml:36-37`, `.github/workflows/publish-npm.yml:34-35`, `.github/workflows/publish-npm.yml:57-58`  
**Affected API/subsystem:** Dependency installation

#### Evidence

`package-lock.json` exists locally but `git ls-files package-lock.json` returns nothing and `git check-ignore` points to `.gitignore:42`. CI therefore cannot use `npm ci`; every run resolves caret ranges afresh. The local install already resolves versions newer than many package minima (for example Rollup 3.30.0 from `^3.29.4`).

#### Trigger

Run CI or install from a fresh clone after any transitive/range-compatible release.

#### Reproduction

Run the Git checks above, remove local installation in a disposable clone, and compare `npm ls --depth=0` over time.

#### Expected behavior

CI and release builds use a tracked lockfile and `npm ci`.

#### Actual behavior

Dependency graphs drift independently of source revisions.

#### Impact

Tests, bundles, and published artifacts can change or fail without a repository change, including during a release.

#### Suggested correction

Track `package-lock.json`, use `npm ci`, and update dependencies intentionally through reviewed lockfile changes.

#### Regression test

Require a clean `npm ci` in CI and verify the lockfile is unchanged after installation.

### BUG-018: Declared Babel targets are not backed by required polyfills or CSS fallbacks

**Severity:** Medium  
**Confidence:** High confidence  
**Area:** Browser compatibility  
**Affected files:** `.babelrc:2-10`, `src/core/layer.ts`, `src/styles/theme.ts:291-331`  
**Affected API/subsystem:** Published runtime and loading indicators

#### Evidence

Babel targets `> 1%`, the last two versions, and `android>4.0`, with `useBuiltIns: "entry"`, but no core-js entry is imported. The output still relies on `Map`, `Object.assign`, `Array.from`, `Element.closest`, and `Element.remove`. Spinner style 1 relies on `conic-gradient` and CSS masking. Core animation CSS has no `prefers-reduced-motion` or forced-colors handling.

#### Trigger

Run in an older Android WebView or other browser matching the stated build target but lacking those APIs/CSS features.

#### Reproduction

Inspect the production output for the listed APIs and compare support to the Babel target. Real-device verification remains outstanding.

#### Expected behavior

The configured target matches the actual required browser baseline, or feature detection/fallbacks cover unsupported features.

#### Actual behavior

Syntax is transpiled, but runtime and CSS capabilities are assumed.

#### Impact

Nominally targeted browsers may fail at module execution or lose core UI/animation affordances.

#### Suggested correction

Choose and document a modern baseline or add narrowly justified feature detection/fallbacks. Add reduced-motion and forced-colors CSS independent of legacy browser support.

#### Regression test

Run BrowserStack/real-device smoke tests for the documented baseline and static checks for required fallbacks.

### BUG-019: `title()` converts caller data to HTML without documentation

**Severity:** Medium  
**Confidence:** Confirmed  
**Area:** Security and API consistency  
**Affected files:** `src/core/layer.ts:683-690`, `src/utils/dom.ts:70-72`  
**Affected API/subsystem:** `title`

#### Evidence

Initial `options.title` is inserted with `textContent`, but the public `title(name, index)` helper calls `appendHTML`, which assigns `innerHTML`. No README or TypeDoc warning marks `name` as trusted HTML.

#### Trigger

Pass user-controlled text to `title()`—for example a filename, message, or server-provided label containing markup.

#### Reproduction

Call `title('<img src=x onerror="...">', index)` and inspect the created element. Event execution depends on browser/CSP, but HTML interpretation is deterministic.

#### Expected behavior

A method named `title` treats its string as text, or an explicitly named/documented trusted-HTML API is used.

#### Actual behavior

The same title concept is text-safe at creation and HTML-interpreted during update.

#### Impact

Applications can introduce DOM XSS when they reasonably treat the parameter as plain text.

#### Suggested correction

Use `textContent` by default and, if compatibility requires HTML, add a separate explicit API or opt-in plus a security warning.

#### Regression test

Assert markup is rendered as text by default and add CSP/browser security tests for any trusted-HTML escape hatch.

### BUG-020: Tips are never clamped or flipped into the viewport

**Severity:** Medium  
**Confidence:** High confidence  
**Area:** Positioning  
**Affected files:** `src/utils/position.ts:113-148`, `src/core/layer.ts:279-285`  
**Affected API/subsystem:** `tips`

#### Evidence

Placement is a direct arithmetic assignment for one requested side. There is no viewport intersection check, safe-area allowance, alternate direction, or post-layout clamp.

#### Trigger

Attach a tip near any viewport edge, use long content, zoom, or enlarge fonts.

#### Reproduction

Place a direction-1 tip on an element at the top edge or a direction-4 tip at the left edge and inspect its negative coordinates. This exact visual case was not rerun in the manual browser pass.

#### Expected behavior

The tip flips or clamps to remain visible while keeping its arrow aligned when possible.

#### Actual behavior

The formula can produce negative or beyond-viewport positions.

#### Impact

Help content can be entirely inaccessible, especially on mobile and zoomed layouts.

#### Suggested correction

Evaluate candidate placements against the visual viewport, flip by available space, clamp final coordinates, and update arrow placement.

#### Regression test

Test all directions at every edge under 320 px width, zoom, RTL, scroll, and long unbroken content.

### BUG-021: Runtime styles cannot receive a CSP nonce

**Severity:** Medium  
**Confidence:** High confidence  
**Area:** CSP and style injection  
**Affected files:** `src/styles/inject.ts:1-14`, `src/core/layer.ts:161-163`  
**Affected API/subsystem:** First invocation of every visual API

#### Evidence

The library injects an inline style through `mazey.addStyle` with only an ID. No public config accepts a nonce, stylesheet factory, adopted stylesheet, or preloaded-style mode. Package metadata lists CSS files as side effects even though no runtime CSS file is published.

#### Trigger

Use the package under a strict `style-src` policy that disallows un-nonced inline styles.

#### Reproduction

Serve a consumer with `Content-Security-Policy: style-src 'nonce-test'` and call `open`; the injected style lacks the nonce and is blocked.

#### Expected behavior

Consumers can pass a CSP nonce or load an equivalent packaged stylesheet explicitly.

#### Actual behavior

There is no supported path to make required component styles CSP-compliant.

#### Impact

Dialogs render unstyled or unusably in security-hardened applications.

#### Suggested correction

Add an injection configuration with nonce/document support or publish an explicit CSS entrypoint while keeping zero external asset requirements.

#### Regression test

Verify nonce propagation and a no-injection/preloaded-style mode in a browser with enforced CSP.

## Low-Severity Findings

### BUG-022: Lint, formatting, and Husky gates do not enforce the stated conventions

**Severity:** Low  
**Confidence:** Confirmed  
**Area:** Local and CI quality gates  
**Affected files:** `.eslintrc`, `package.json:38-46`, `package.json:126-131`, `.lintstagedrc`  
**Affected API/subsystem:** Development workflow

#### Evidence

Style rules are warnings, so 177 reported problems still produce exit 0 in CI and `preview`. `format:check` omits `src`, `test/layer.test.js`, and several scripts/configs. Husky 8 is installed, but there is no tracked `.husky/` directory or `prepare` script; the legacy `package.json.husky` block is not the Husky 8 installation mechanism.

#### Trigger

Introduce a convention violation or clone the repository fresh and commit without manually configuring hooks.

#### Reproduction

Run `npm run lint`, inspect the format command, and run `git ls-files .husky`.

#### Expected behavior

Declared gates cover production source and fail on violations; hooks install reproducibly if they are part of project policy.

#### Actual behavior

The checks report but do not enforce many issues, and hooks are inactive.

#### Impact

Style drift and avoidable review noise accumulate; “preview passed” overstates lint health.

#### Suggested correction

Resolve the existing baseline, promote selected rules to errors, format all owned source, and either configure modern Husky or remove the inactive hook claim.

#### Regression test

Add a CI fixture that intentionally violates one enforced rule and confirm the command fails.

### BUG-023: Build tooling contains unused and obsolete duplicate packages

**Severity:** Low  
**Confidence:** Confirmed  
**Area:** Dependency maintenance  
**Affected files:** `package.json:72-124`, `scripts/rollup.config.mjs:2-9`  
**Affected API/subsystem:** Build dependency graph

#### Evidence

The build imports deprecated `rollup-plugin-commonjs` and `rollup-plugin-node-resolve` while the maintained `@rollup/plugin-commonjs` is also installed but unused. `rollup-plugin-typescript2`, `rollup-plugin-copy`, `clean-webpack-plugin`, `date-fns`, `execa`, `@babel/runtime-corejs3`, and direct `core-js`/`tslib` have no project references. Babel runtime helpers and `mazey` are bundled, so the published JS has no external imports.

#### Trigger

Install, audit, or upgrade dependencies.

#### Reproduction

Run the repository-wide fixed-string dependency search recorded in this audit.

#### Expected behavior

Every direct dependency owns an active build/runtime role, and maintained official Rollup plugins are preferred.

#### Actual behavior

Overlapping generations inflate installation and increase compatibility/audit surface.

#### Impact

Maintenance cost and supply-chain exposure are higher than necessary.

#### Suggested correction

After runtime fixes, remove demonstrably unused packages in a dedicated change and migrate the two legacy Rollup plugins with output-equivalence tests.

#### Regression test

Compare build hashes/API exports and run package-consumer tests before and after dependency cleanup.

### BUG-024: A `msg`-only consumer retains about 85% of the ESM bundle

**Severity:** Low  
**Confidence:** Confirmed  
**Area:** Tree shaking and bundle size  
**Affected files:** `src/core/layer.ts:649-1023`, `src/index.ts`  
**Affected API/subsystem:** Named imports

#### Evidence

`dist/index.mjs` is 46,770 bytes (12,733 gzip). Rollup bundling only `msg` produced 39,550 bytes (10,877 gzip), about 84.6% uncompressed. Mutual references to the monolithic default `layer` object and shared core prevent most elimination.

#### Trigger

Import one convenience helper into a production application.

#### Reproduction

Run the `tree-shake-entry.mjs` command in the baseline table and compare `wc -c`/gzip sizes.

#### Expected behavior

Named imports omit unrelated iframe, tab, tip, minimize, and prompt paths where architecture permits.

#### Actual behavior

Most runtime code remains.

#### Impact

Consumers pay nearly full package cost for narrow use. The absolute gzip cost is still modest, so severity is low.

#### Suggested correction

Separate independent helpers/state carefully and avoid having named paths return/reference the complete default object. Do not remove required style behavior.

#### Regression test

Track representative Rollup/Webpack/esbuild bundle sizes with an explicit budget.

### BUG-025: Runtime coverage is narrow and source coverage reporting is misleading

**Severity:** Low  
**Confidence:** Confirmed  
**Area:** Tests and coverage  
**Affected files:** `test/layer.test.js:1-125`, `package.json:36-37`  
**Affected API/subsystem:** Runtime verification

#### Evidence

Only 7 runtime tests cover basic open/close, default title, confirm callbacks, msg timeout, icons, loading styles, and prompt maxlength. Fourteen named runtime APIs have no direct test. Tests import minified `dist/index.cjs`; ad hoc coverage reported 56.62% statements, 34.91% branches, 49.29% functions, but 100% lines on one minified line, which is not actionable source coverage.

#### Trigger

Regress lifecycle, window controls, iframe helpers, positioning, DOM restoration, focus, or custom options.

#### Reproduction

Run `npx jest --coverage --runInBand test/layer.test.js` and inspect the report.

#### Expected behavior

Coverage maps to TypeScript source and behavior matrices cover public APIs, failure paths, concurrency, and cleanup.

#### Actual behavior

Major defects pass all tests and the line metric is misleading.

#### Impact

Regression confidence is much lower than the green suite suggests.

#### Suggested correction

Test source with source maps or instrument TypeScript directly, add lifecycle/browser tests, and use behavior coverage rather than a single percentage target.

#### Regression test

Promote the audit reproduction cases into focused passing tests as fixes land.

### BUG-026: Version, Windows, and Docker guidance conflict with the actual project

**Severity:** Low  
**Confidence:** Confirmed  
**Area:** Documentation and development tooling  
**Affected files:** `README.md:47-52`, `package.json:47-48`, `scripts/env-win.sh:1-3`, `Dockerfile`, `docker-compose.yml:14-19`  
**Affected API/subsystem:** Contributor setup

#### Evidence

README claims TypeScript 5.1.6 while the package pins 5.3.2. `release:win` runs `bash scripts/env-win.sh`; its `nvm use 16.19.0` occurs in a child shell and cannot change Node for the subsequent npm commands, and it conflicts with CI/README Node 22. Docker Compose mounts obsolete `./lib` although package output is `dist`, and does not mount site/config/image sources for live site work.

#### Trigger

Follow the documented contributor, Windows release, or Docker workflows.

#### Reproduction

Compare the files above. The Windows and Docker workflows were not executed during this audit.

#### Expected behavior

Documented versions and mounted paths match package scripts and outputs.

#### Actual behavior

The guidance is stale or ineffective.

#### Impact

Contributors can use the wrong compiler/runtime or fail to see changes in the container.

#### Suggested correction

Derive/document versions from active config, run environment setup in the same shell or use a version file, and update Docker mounts to current source/output ownership.

#### Regression test

Add a documentation consistency check and a Docker smoke build; test Windows scripts in CI if retained.

## Runtime Lifecycle

Creation and normal teardown are straightforward, but there is no explicit lifecycle state beyond `minimized`. Records enter the registry before mount and remain there through close animation. The audit confirmed non-idempotent close, gesture cleanup gaps, DOM restoration exceptions, and fullscreen state corruption. `success` executes synchronously before `open` returns; an exception can leave a mounted record without returning its index, a fragile path that needs a dedicated test even though it is not separately ranked above.

## State and Concurrency

All instances share one module-level counter, z-index, config object, registry, and scroll count. Options are shallow-copied and normalized without mutating the caller's top-level object; arrays such as `btn` and `tab` remain shared references but are read rather than modified. Confirmed concurrency failures are duplicate close finalization, overlapping minimized slots, duplicate DOM-node ownership, and scroll-count imbalance in fullscreen.

Index values increase without reuse, which avoids accidental normal reuse but grows for the lifetime of the module. Z-index also grows without bounds and is not coordinated across multiple installed copies.

## DOM and Events

String content for dialogs/pages/tips/tabs is intentionally interpreted as HTML through `innerHTML`; existing HTMLElements are moved and normally restored with a placeholder. There is no NodeList/function content support despite the audit prompt listing those as cases to assess. Cross-document HTMLElements can fail `instanceof HTMLElement` because the check uses the global realm.

Persistent record listeners have cleanup functions. Active gesture listeners and tab listeners created in a success callback do not join that cleanup list. The tab listener cycle is generally garbage-collectable after record removal, but retained external references to the detached layer preserve those callbacks.

## Accessibility

The project website has good skip links, heading structure, navigation labels, theme controls, focus-visible styling, and reduced-motion handling. The package runtime does not: no modal roles, accessible title linkage, focus trap/restoration, Escape handling, loading live region, tooltip role, tab roles/arrow-key behavior, reduced-motion handling, forced-colors fallback, or keyboard/touch resizing. Toolbar buttons use terse labels (`min`, `max`, `close`), and the invisible-until-hover resize handle is a non-focusable span.

## Browser Compatibility

Published ESM/CJS imports are safe in Node; DOM globals are accessed on API invocation. The effective runtime baseline is newer than `.babelrc` suggests because required built-ins and DOM methods are not polyfilled. Drag and resize are mouse-only. Real-browser checks were performed in the in-app Chromium surface only; Firefox, Safari, iOS Safari, Android WebView, orientation/virtual keyboard, RTL, and high zoom remain unverified.

## TypeScript and Declarations

Runtime and declaration export names match. `dist/index.d.ts` is self-contained and NodeNext consumption passed with `skipLibCheck`. The major confirmed contract error is the content tuple in BUG-015. Other type-quality concerns include broad string unions for `btnAlign`, `move`, `offset`, and `position`; a stringly typed `closeAll(type)`; only `btn2` for arbitrary button arrays; and inferred recursive return shapes for `config`/`ready` that bloat the declaration file. `skipLibCheck` masks a local `@types/glob`/`minimatch` incompatibility in a strict standalone invocation.

## ESM and CommonJS Packaging

Both entrypoints expose the same 22 named functions and default object. Node ESM import, CommonJS require, default access, named access, and SSR import all passed. Production outputs contain bundled Babel helpers and `mazey`; no undeclared runtime helper import remains. The dry-run tarball includes both JS formats, maps, declarations, README, LICENSE, and package metadata. Export maps do not expose deep internal files, which is appropriate.

## Tree Shaking and Side Effects

The `sideEffects: ["**/*.css"]` declaration does not currently remove required injection because style insertion happens inside retained API calls, not at module evaluation. It is nonetheless misleading because the package publishes no CSS file. A named `msg` import retains most of the monolithic runtime (BUG-024). Multiple package versions also share the hard-coded `layer-esm-style` ID; the second copy silently accepts the first copy's CSS, which can create version-skew styling.

## Build System

Two unchanged production builds had identical SHA-256 hashes for both JS files, declarations, and maps. Maps use relative paths and embed 21 sources, including Babel helpers and `mazey`, with no absolute workstation path. The banner's dynamic current year means builds across a year boundary intentionally differ. Rollup cleans `dist` and creates all required outputs. Webpack produces a 258 KiB shared entry and stays under its configured 300 KiB budget.

## Dependencies

`npm ls --depth=0` reported a valid installed graph. `mazey` is the only declared runtime dependency, but its used helpers are bundled, so consumers do not load it externally; retaining it as a runtime dependency is unnecessary from the generated bundle's perspective unless project policy requires it for other published paths. The untracked lockfile and duplicate/unused build packages are the larger risks (BUG-017 and BUG-023).

## Tests and Coverage

All current suites passed and `--detectOpenHandles` found none. That check begins no active gesture and therefore cannot detect BUG-004. Site/PWA/service-worker tests cover useful configuration invariants but PWA install tests no longer mirror actual page markup. Runtime tests should be expanded around the public API matrix and use non-minified source-aware coverage.

## Website and Playground

At 320×568, Home and Playground page shells had no horizontal overflow; the Playground gallery measured 296 px inside a 320 px viewport and exposed 30 demo controls. At 1366×768, the gallery measured 1,116 px inside a 1,140 px container with no page overflow. The opened runtime alert itself overflowed mobile (BUG-006). Only the alert interaction was manually exercised during this audit; the other demos were source-reviewed but not all clicked.

## SEO and GitHub Pages

Generated Home, Playground, API overview, and `api/functions/open.html` had correct self-referencing canonical URLs, one H1, and project-relative assets. The deep page loaded TypeDoc assets under `/layer-esm/api/assets/` plus shared API enhancements under `/layer-esm/assets/`. SEO validation passed 3 primary and 38 API pages. The TypeDoc transformation relies on regular expressions over generated HTML; current tests cover idempotence, but TypeDoc markup changes remain a maintenance risk rather than a confirmed defect.

## PWA

Manifest identifiers, start URL, scope, icons, cache prefix, service-worker routing, non-GET/cross-origin exclusion, cache-write failure behavior, and user-controlled update flow passed tests/validators. Normal Webpack development disables the worker. The manual preview linked the correct `/layer-esm/manifest.webmanifest`. Real installability, offline reload, and worker upgrade were not exercised in a browser. BUG-016 is the confirmed source/markup regression in install-event handling.

## CI and Release

Pages CI uses Node 22 and current Pages actions with correct permissions and artifact path. It installs without a lock, and lint warnings do not fail it. Publishing uses two fresh installs and duplicate builds/tests but omits typecheck, lint, docs, and pack inspection. Publication and tagging are insufficiently gated (BUG-007). Repository permissions are workflow-wide rather than job-minimal.

## Performance

Published sizes:

| Output                   |      Raw |     Gzip |
| ------------------------ | -------: | -------: |
| `dist/index.mjs`         | 46,770 B | 12,733 B |
| `dist/index.cjs`         | 46,945 B | 12,756 B |
| `msg`-only Rollup bundle | 39,550 B | 10,877 B |

Runtime positioning repeatedly reads and writes layout during mousemove without throttling. Tips attach one resize and one scroll listener per tip; the scroll listener is passive and cleaned in normal close. Counters and registry entries are bounded by successful teardown, but confirmed teardown failures can retain records.

## Security

Dialog/page/tip/tab content strings are intentionally trusted HTML for Layer compatibility. The project should explicitly state that these APIs must not receive untrusted data. `title()` is inconsistent and therefore ranked separately as BUG-019. Iframe URLs and CSS strings (`title[1]`, `shadeStyle`, `style.position`) are caller-trusted with no URL/scheme or CSS policy; document these trust boundaries. No prototype-polluting deep merge exists—the project uses shallow object spread/`Object.assign`.

## Fragile Patterns

- Close animation synchronizes lifecycle with an untracked magic 180 ms timer.
- Timed layers combine an auto-close timer with independently scheduled close timers.
- All dialog concerns share global mutable singleton state.
- Generated TypeDoc HTML is transformed by regular expressions.
- Required CSS is a large string injected by a third-party helper and a hard-coded ID.
- DOM content ownership depends on a removable comment placeholder.
- Class and selector handling guesses caller intent by string prefixing.
- Window-state restoration stores raw `cssText` without a state machine.
- Site inline boot scripts swallow all theme/bootstrap errors.
- Build output changes annually because the banner reads the wall clock.

## Missing Tests

Priority gaps:

1. Double/manual/timed close interleavings and callback order.
2. Scroll preservation with nested and out-of-order locks.
3. Full/min/restore/toolbar transitions and minimized slot reflow.
4. DOM element ownership, placeholder disruption, forms, custom elements, and duplicate use.
5. Close during drag/resize and pointer cancellation.
6. Modal roles, accessible names, focus trap/restoration, Escape, reduced motion, and high contrast.
7. Every `area`, `offset`, `tips`, and `zIndex` form at mobile/zoom/RTL sizes.
8. Same-origin/cross-origin/removed/navigated iframe helpers.
9. `config`, `ready`, `setTop`, `style`, `title`, `getFrameIndex`, and `iframeSrc` behavior.
10. Package-consumer projects for NodeNext, bundler resolution, Webpack, Rollup, Vite, and esbuild.
11. PWA behavior when no install controls exist.
12. Source-aware branch/function coverage rather than minified line coverage.

## Documentation Mismatches

- README TypeScript version is 5.1.6; installed/pinned TypeScript is 5.3.2.
- README says supported browsers may offer an install prompt, while current PWA code suppresses Chromium's event without a button.
- README documents only four helpers; TypeDoc exposes all 22 but most have no behavioral prose/defaults/error semantics.
- No documentation describes trusted HTML/CSS/iframe URL boundaries.
- No supported browser baseline, focus/accessibility limitations, Shadow DOM limitation, cross-origin iframe limitation, or CSP nonce limitation is stated.
- Docker mounts `lib`, although published output is `dist`.

## Manual Browser Verification

Completed:

- `/layer-esm/` at 320×568: no page overflow, one H1, correct canonical and manifest.
- `/layer-esm/playground/` at 320×568 and 1366×768: no page overflow; gallery widths aligned with containers.
- `/layer-esm/api/functions/open.html` at 320×568: no page overflow, one H1, correct deep canonical, TypeDoc/shared assets resolved.
- Playground alert at 320×568: opened, overflowed to 342 px, retained trigger focus, lacked role/ARIA metadata, and ignored Escape.

Not completed:

- Firefox, Safari, iOS Safari, Android Chrome/WebView, embedded WebViews.
- 360×800, 768×1024, and 1920×1080 in the fresh audit pass.
- 200%/400% zoom, RTL, forced-colors, screen-reader output, touch/pointer drag.
- Every Playground control, real cross-origin iframe navigation, real PWA install/offline/update, Vite/esbuild consumers.

## Recommended Fix Order

1. Make close/finalization idempotent and exception-safe (BUG-002), then promote the lifecycle reproduction cases to tests.
2. Introduce a real window-state/scroll-lock model for full/min/restore (BUG-003, BUG-008, BUG-009).
3. Add DOM-node ownership and robust restoration (BUG-005).
4. Ensure active gestures are record-owned and cancellable (BUG-004).
5. Implement modal accessibility/focus/keyboard behavior and responsive mobile sizing (BUG-001, BUG-006).
6. Honor public options and contracts (`area`, `zIndex`, alert buttons, selectors, typed content) (BUG-010 through BUG-015).
7. Harden iframe/tip/CSP/browser compatibility paths (BUG-012, BUG-018, BUG-020, BUG-021).
8. Stop suppressing install events without UI and align PWA tests (BUG-016).
9. Separate verification from publishing and track the lockfile (BUG-007, BUG-017).
10. Clean tooling, coverage, documentation, and tree-shaking in isolated follow-up changes.

## Remaining Uncertainties

- Whether maintainers intentionally want HTML semantics for `title()` and the tuple form of `content`.
- Whether `restore` is intended only for minimized layers despite `full` storing restoration CSS.
- Exact compatibility target; the Babel configuration and documentation do not establish one consistently.
- Whether automatic publishing on every main push is policy or an inherited template behavior.
- Real-browser behavior for cross-origin frame access, PWA install/update/offline, tips at every edge, Shadow DOM, and multi-document calls.
- Actual bundle contributions require a source-aware visualizer; this audit measured output and tree-shaken size only.
