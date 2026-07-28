# layer-esm

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/layer-esm
[npm-url]: https://npmjs.org/package/layer-esm
[l-image]: https://img.shields.io/npm/l/layer-esm
[l-url]: https://github.com/chengchuu/layer-esm

Special thanks to XianXin, the original author of Layer, for creating a popup library that has been widely used across the web community for many years. layer-esm is a modern TypeScript implementation inspired by the original Layer API.

- [Project website](https://chengchuu.github.io/layer-esm/)
- [Live playground](https://chengchuu.github.io/layer-esm/playground/)
- [API documentation](https://chengchuu.github.io/layer-esm/api/)

## Install

Use layer-esm via [npm](https://www.npmjs.com/package/layer-esm).

```bash
npm install layer-esm
```

The ESM, CommonJS, and type declaration outputs are written to `dist/`.

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
restoration. Messages use a polite live region, tabs support arrow-key navigation, prompt controls
are labelled, decorative icons are hidden from assistive technology, and animations honor reduced
motion. String `content` values are treated as trusted HTML for Layer compatibility; use an
`HTMLElement` or sanitize untrusted markup before passing it. Dynamic titles are always rendered as
text.

## Themes

The default light theme can be changed globally. `system` responds to runtime
`prefers-color-scheme` changes, and a partial custom theme is merged with safe light defaults.

```javascript
import { config, darkTheme, lightTheme } from "layer-esm";

config({ theme: "dark" });
config({ theme: "system" });
config({ theme: { primary: "#7c3aed", radius: "16px" } });
```

`lightTheme` and `darkTheme` are exported for typed composition.

## Content Security Policy

styled-components injects its generated rules into the target document. Sites with a Content
Security Policy can attach their existing nonce:

```javascript
import { config } from "layer-esm";

config({ styleNonce: window.__CSP_NONCE__ });
```

The previous `injectStyles: false` and reusable `layerStyles` workflow cannot represent dynamic
styled-components themes. `layerStyles` remains as a deprecated compatibility marker, while
`config({ injectStyles: false })` throws a descriptive migration error instead of silently rendering
an unstyled dialog. See the [React 19 migration guide](./guides/react-19-migration.md).

## Architecture and lifecycle

Display calls lazily create one shared React root per target `Document`. Typed commands update a
small external store and all active layers render through that host. `close` clears timers and
callbacks, restores moved DOM nodes, scroll state, and focus, and waits for the exit transition when
enabled. The host is reused until `destroy()` explicitly closes its records and unmounts it. Importing
the package does not access the DOM; calling a display API without a browser `Document` throws a
clear error.

The supported browser baseline is the latest two Chrome, Edge, Firefox, and Safari releases,
Chrome for Android 100+, and iOS Safari 15+. The package does not install global polyfills.

## Guides

- [Introducing layer-esm](./guides/release-notes/introducing-layer-esm-v1.0.1.md)
- [React 19 migration](./guides/react-19-migration.md)
- [Release notes index](./guides/release-notes/README.md)

## Contributing

### Development Environment

| Dependency | Version  |
| ---------- | -------- |
| Node.js    | v22.21.1 |
| TypeScript | v5.3.2   |

### Scripts

```bash
# Install dependencies
npm i

# Development
npm run dev

# Build
npm run build

# Test
npm test

# Single test file
npm test -- test/layer.test.js

# Documentation
npm run docs
```

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/layer-esm/blob/main/LICENSE).
