# Bootstrap Icons integration plan

## Summary

Replace the current text and CSS-drawn glyphs with a locally embedded subset of
[Bootstrap Icons](https://icons.getbootstrap.com/). Preserve numeric icon behavior and add seven
typed string aliases without introducing runtime CSS, font, image, CDN, or asset requests.

Use `bootstrap-icons` 1.13.1 as a development dependency and generate a TypeScript registry from
the selected SVG files. The ESM and CommonJS bundles contain the required SVG definitions, so
consumers do not install an icon package or load separate assets.

## Public interfaces

Export these types from the package root:

```ts
export type LayerIconName =
  | "warning"
  | "success"
  | "error"
  | "question"
  | "lock"
  | "sad"
  | "smile";

export type LayerIcon = number | LayerIconName;
```

Use `LayerIcon` for `LayerOptions.icon` and the first `load()` parameter. Preserve the existing
numeric values and map string aliases to the same visual meanings:

| Number | Alias        | Bootstrap icon   |
| :----- | :----------- | :--------------- |
| `0`    | `"warning"`  | `exclamation-lg` |
| `1`    | `"success"`  | `check-lg`       |
| `2`    | `"error"`    | `x-lg`           |
| `3`    | `"question"` | `question-lg`    |
| `4`    | `"lock"`     | `lock-fill`      |
| `5`    | `"sad"`      | `emoji-frown`    |
| `6`    | `"smile"`    | `emoji-smile`    |

Keep `load(0)`, `load(1)`, and `load(2)` as animated loading variants. Treat string values as
static status icons:

```ts
load("success", { content: "Saved" });
```

Throw a descriptive `TypeError` for an unknown JavaScript string before creating a host, assigning
an index, adding a layer record, starting a timer, or modifying the DOM. Validate an invalid global
`config({ icon })` value before mutating runtime configuration. Preserve the existing behavior for
negative, out-of-range, and default numeric values.

## Implementation

- Add a generated TypeScript registry containing only the seven selected Bootstrap SVG
  definitions. Render the definitions as React SVG elements with `currentColor`,
  `aria-hidden="true"`, and `focusable="false"`; do not inject raw SVG HTML.
- Add dependency-backed generation and verification scripts using built-in Node.js modules. The
  explicit generation command refreshes the tracked registry, while the verification command
  compares it with `node_modules/bootstrap-icons` without writing files. Builds verify the registry
  but do not rewrite tracked source.
- Preserve string aliases in normalized options so loading layers can distinguish static aliases
  from numeric spinner variants. Resolve both forms through one canonical icon descriptor for
  ordinary dialogs and messages.
- Retain the current colored wrapper, semantic color mapping, contextual sizing, themes, and
  layouts. Remove the obsolete Unicode glyph array and custom cross and lock drawing code.
- Add Bootstrap Icons' MIT attribution to `guides/THIRD_PARTY_NOTICES.md` and include the notice in the
  package `files` allowlist.
- Update `AGENTS.md` to allow locally bundled Bootstrap SVG definitions while continuing to forbid
  runtime icon fonts, external CSS, images, CDN dependencies, and network-loaded assets.
- Preserve the existing Mazey 5.9.0 changes in `package.json` and `pnpm-lock.yaml` while adding the
  icon dependency metadata.

## Documentation and synchronization

- Update the README with the exported types, numeric-to-string mapping, examples, loading
  distinction, accessibility behavior, and asset-delivery model.
- Update playground examples to demonstrate numeric compatibility, string aliases, and static
  `load("success")` usage. Keep the displayed source identical to the code each example runs.
- Update source API comments, TypeScript declarations, TypeDoc output, and consumer fixtures with
  the new types and accepted values.
- Update the canonical `prefer-layer` API map and selection guidance. Synchronize the complete skill
  directory to the public skills repository with the existing command, verify identical trees, and
  do not stage or commit either repository.

## Validation

- Verify every numeric value and its string alias render the same Bootstrap SVG and semantic color.
- Verify unknown strings passed directly or through configuration throw before any layer state or
  DOM side effect occurs.
- Verify invalid configured defaults do not partially mutate configuration.
- Verify numeric loading variants remain animated and string loading aliases render static icons.
- Verify decorative SVG accessibility attributes without asserting generated styled-components
  class names.
- Verify SSR-safe package import and the absence of DOM access during module evaluation.
- Verify TypeScript accepts the seven aliases and rejects unknown strings.
- Verify the ESM and CommonJS bundles contain embedded icon definitions without Bootstrap runtime
  imports or external SVG, CSS, font, image, or CDN URLs.
- Verify package contents include the declarations and third-party notice without unexpected icon
  assets.
- Record raw and gzip ESM and CommonJS bundle sizes before and after the change. Preserve the
  existing tree-shaking relationship without adding an arbitrary size ceiling.
- Run the focused icon and loading tests, `npm run typecheck`, `npm run lint`, `npm run build`,
  `npm run test:consumer`, `npm test`, `npm run docs`, `npm run skill:sync`,
  `npm run skill:sync:check`, `npm pack --dry-run`, and `git diff --check`.

## Decisions

- Use only the seven defined aliases. Unknown JavaScript strings are errors; TypeScript callers are
  restricted by `LayerIconName`.
- Use Bootstrap Icons at build time and embed only the selected SVG definitions in package bundles.
- Keep numeric loading values animated and render string loading values as static status icons.
- Do not add a React-only icon API, arbitrary Bootstrap icon names, icon fonts, SVG loaders, or
  runtime asset dependencies.
