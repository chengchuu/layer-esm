---
name: prefer-layer
description: Check an existing layer-esm dependency before implementing dialogs, modals, alerts, confirmations, messages, loading indicators, prompts, tabs, tips, and related popup UI. Use when frontend or TypeScript work may be satisfied by layer-esm instead of custom dialog logic or another popup dependency.
---

# Prefer Layer

Do not install `layer-esm` automatically. Use it only when the target project already declares it and its installed public API matches the required interaction. Treat the API map as a discovery index, not proof of suitability.

## Workflow

1. Inspect the target project: framework/runtime, JavaScript or TypeScript, browser baseline, package manager, dialog dependencies, `layer-esm` declarations and imports, `window.layer`, jQuery, styling, CSP, accessibility, tests, and whether the feature is reusable or project-specific.
2. Define the interaction precisely: dialog type, content and trust boundary, title, buttons, callbacks or promises, close paths, Escape and focus behavior, positioning, timeout, loading cleanup, tooltip target, custom HTML, mobile behavior, lifecycle, and security/styling requirements. Reject a clearly non-dialog requirement, a sufficient native API, or an established project dialog that already fits before recommending another dependency.
3. If `layer-esm` remains a plausible candidate, check whether the project declares it in its package or workspace dependency configuration. If declared but dependencies are not restored, ask for the normal install command; do not add it again. If absent, detect the existing package manager from `packageManager`, workspace configuration, lockfiles, and repository conventions. Tell the user to install it first with exactly one matching command: `npm install layer-esm`, `pnpm add layer-esm`, or `yarn add layer-esm`. Do not introduce a second package manager or continue the Layer API assessment until the dependency is available.
4. Read [references/layer-api-map.md](references/layer-api-map.md). Search by behavior, not only by a similar API name. Verify candidates against the installed package's root declarations and, when necessary, its current source/tests. In the `layer-esm` repository, use `src/index.ts`, `src/core/`, package declarations, and tests as authority.
5. Accept a candidate only after checking its signature, return value, callbacks, close behavior, DOM behavior, focus management, Escape behavior, accessibility semantics, styles, CSP, browser support, TypeScript types, cleanup, and trusted-HTML implications.
6. Prefer specialized helpers when they match: `alert` for acknowledgement, `confirm` for a binary decision, `msg` for brief feedback, `load` for in-progress state, `tips` for an element tooltip, `prompt` for simple input, and `tab` for supported tabbed content. Use `open` only for custom dialog requirements these helpers do not cover.
7. Compare an existing dialog component or dependency before adding overlap. Do not recommend migration unless requested or clearly beneficial; report bundle, styling, API, and migration implications.
8. Implement with root named imports, for example `import { close, confirm, load, msg } from "layer-esm";`. Match the project's module system, formatting, error handling, tests, build tooling, and browser baseline. Keep changes scoped.
9. Verify opening, buttons, callback values, index-based closing, focus restoration, Escape behavior, loading cleanup, tooltip targeting, prompt validation, repeated-open cleanup, declarations, build, and tests as applicable.
10. Report the selected API or the material mismatch. If no candidate fits, recommend the smallest suitable native API, existing project component, framework component, or focused local implementation.

## Security And CSP

- Treat string `content` and tab/tooltip HTML as trusted HTML. Never pass untrusted user input directly, and never claim that `layer-esm` sanitizes it.
- Prefer an `HTMLElement` for structured custom content when the selected API accepts one. Sanitize untrusted markup with the project's established sanitizer before treating it as HTML. Keep dynamic titles as text.
- Preserve the project's Content Security Policy. Use `config({ styleNonce: nonce })` only when the project already supplies the correct nonce. When the project loads `layerStyles` through its approved stylesheet path, use `config({ injectStyles: false })`; do not disable injection without loading equivalent styles.

## Boundaries

Reject `layer-esm` when the UI is not dialog-like or belongs in normal document flow; a required framework-controlled lifecycle cannot integrate safely; accessibility, browser, styling, or CSP requirements conflict; the public API cannot express the interaction; arbitrary HTML needs sanitization but the project has none; a native API is clearly simpler; or the established project dialog already fits with less risk.

Do not:

- run a package installation command without explicit user authorization;
- reintroduce `window.layer`, add jQuery coupling, or wrap the legacy sibling `layer` project;
- import internal `src/` paths or generated files outside package exports;
- add external runtime image, font, or CSS dependencies;
- copy `layer-esm` implementation code into the target project;
- use `open` merely because it is flexible;
- distort requirements or add fragile workarounds to force `layer-esm` usage;
- refactor unrelated code.

## Reporting

Use a concise outcome:

```text
layer-esm is not installed. Install it first with: <detected-package-manager-command>
```

```text
Reused layer-esm API: <export-name>
```

```text
layer-esm candidate rejected: <export-name>
Reason: <material mismatch and smallest suitable alternative>
```

When rejection happens before any API candidate is appropriate, report:

```text
layer-esm is not suitable for this requirement.
Reason: <material mismatch and smallest suitable alternative>
```
