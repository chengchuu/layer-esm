# layer-esm

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/layer-esm
[npm-url]: https://npmjs.org/package/layer-esm
[l-image]: https://img.shields.io/npm/l/layer-esm
[l-url]: https://github.com/chengchuu/layer-esm

Special thanks to 贤心, the original author of Layer, for creating a popup library that has been widely used across the web community for many years. layer-esm is a modern ESM adaptation and refactoring effort inspired by the original Layer project.

- [Project website](https://chengchuu.github.io/layer-esm/)
- [Live playground](https://chengchuu.github.io/layer-esm/playground/)
- [API documentation](https://chengchuu.github.io/layer-esm/api/)

## Install

Use layer-esm via [npm](https://www.npmjs.com/package/layer-esm).

```bash
npm install layer-esm --save
```

Of course, you can also serve the built package files yourself. The ESM, CommonJS, and type declaration outputs are written to `dist/`.

## Usage

```javascript
import { close, confirm, load, msg } from "layer-esm";

const loadingIndex = load();

confirm("Continue?", {}, () => {
  msg("Confirmed");
  close(loadingIndex);
});
```

Dialogs provide labelled dialog semantics, keyboard focus trapping, Escape handling, and focus
restoration. String `content` values are treated as trusted HTML for Layer compatibility; use an
`HTMLElement` or sanitize untrusted markup before passing it. Dynamic titles are always rendered as
text.

Runtime styles are injected once by default. Sites with a Content Security Policy can provide a
nonce, or load the exported CSS text themselves and disable automatic injection:

```javascript
import { config, layerStyles } from "layer-esm";

config({ styleNonce: window.__CSP_NONCE__ });

// For a preloaded stylesheet instead:
config({ injectStyles: false });
console.log(layerStyles);
```

The supported browser baseline is the latest two Chrome, Edge, Firefox, and Safari releases,
Chrome for Android 100+, and iOS Safari 15+. The package does not install global polyfills.

## Guides

- [Introducing layer-esm](./guides/release-notes/introducing-layer-esm-v1.0.1.md)
- [Release notes index](./guides/release-notes/README.md)

## Contributing

### Development Environment

| Dependency | Version  |
| ---------- | -------- |
| Node.js    | v22.21.1 |
| TypeScript | v5.3.2   |

### Scripts

Install Dependencies:

```bash
npm i
```

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Test:

```bash
npm test
```

Single test file:

```bash
npm test -- test/layer.test.js
```

Documentation:

```bash
npm run docs
```

`npm run docs` creates the complete GitHub Pages artifact in `docs`, including the landing page,
playground, TypeDoc API documentation, manifest, service worker, `robots.txt`, and `sitemap.xml`.
Handwritten documentation belongs in `guides`; `docs` is generated output only. Validate the final
SEO and PWA output independently with `npm run seo:validate` and `npm run pwa:validate`.

Validate handwritten Markdown links without rebuilding the Pages artifact:

```bash
npm run docs:links
```

Synchronize the canonical `prefer-layer` Codex skill from `.agents/skills/prefer-layer/` to the sibling public skills repository:

```bash
npm run skill:sync
npm run skill:sync:check
```

Use `npm run skill:sync:dry-run` to preview changes. The synchronization replaces the complete public skill directory, removes obsolete destination files, validates the public copy, and never stages or commits changes.

Build and serve a production-like project-path preview at
<http://127.0.0.1:4173/layer-esm/>:

```bash
npm run pwa:preview
```

Normal `npm run dev` serves the website at <http://localhost:8080/> and the playground at
<http://localhost:8080/playground/> without registering the production service worker. When testing
worker updates, unregister old workers or clear site data first. Installation remains available
through each browser's native install or Add to Home Screen menu.

Docker:

```bash
docker compose up -d --build
```

Visit: <http://localhost:8080>

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/layer-esm/blob/main/LICENSE).
