# layer-esm

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/layer-esm
[npm-url]: https://npmjs.org/package/layer-esm
[l-image]: https://img.shields.io/npm/l/layer-esm
[l-url]: https://github.com/chengchuu/layer-esm

Special thanks to Xianxin, the original author of Layer, for creating a popup library that has been widely used across the web community for many years. layer-esm is a modern TypeScript implementation inspired by the original Layer API.

- [Project website](https://chengchuu.github.io/layer-esm/)
- [Live playground](https://chengchuu.github.io/layer-esm/playground/)
- [API documentation](https://chengchuu.github.io/layer-esm/api/)

## Install

```bash
npm install layer-esm
```

## Usage

```javascript
import { close, confirm, load, msg } from "layer-esm";

const loadingIndex = load();

confirm("Continue?", {}, () => {
  msg("Confirmed", { icon: "success" });
  close(loadingIndex);
});
```

## Icons

Use a typed name for new code or the equivalent numeric value for compatibility. The selected
Bootstrap Icons SVG paths are embedded in the JavaScript bundle, inherit `currentColor`, and require
no consumer stylesheet, font, image, or network request.

| Name       | Numeric value | Bootstrap Icon   |
| ---------- | ------------- | ---------------- |
| `warning`  | `0`           | `exclamation-lg` |
| `success`  | `1`           | `check-lg`       |
| `error`    | `2`           | `x-lg`           |
| `question` | `3`           | `question-lg`    |
| `lock`     | `4`           | `lock-fill`      |
| `sad`      | `5`           | `emoji-frown`    |
| `smile`    | `6`           | `emoji-smile`    |

```javascript
msg("Saved", { icon: "success" });
alert("Delete this item?", { icon: "warning" });
```

`load(0)`, `load(1)`, and `load(2)` retain the animated CSS spinner variants. A named value such as
`load("success")` renders the corresponding static status icon instead. Unknown string names throw
a `TypeError` before a layer is created.

Dialogs provide labelled dialog semantics, keyboard focus trapping, Escape handling, and focus
restoration. Messages use a polite live region, tabs support arrow-key navigation, prompt controls
are labelled, decorative SVG icons are hidden from assistive technology, and animations honor reduced
motion. String `content` values are treated as trusted HTML for Layer compatibility; use an
`HTMLElement` or sanitize untrusted markup before passing it. Dynamic titles are always rendered as
text.

## Themes

When no theme is configured, the initial theme is read once from the operating-system preference
and cached for the runtime lifecycle. Light is used when the system preference cannot be determined.
An explicit `config({ theme })` value overrides this automatic initial theme. The `system` setting
continues to respond to runtime `prefers-color-scheme` changes, and a partial custom theme is merged
with safe light defaults.

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
an unstyled dialog. See the [React 19 migration guide](./guides/REACT19_MIGRATION.md).

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

- [layer-esm v1.0.1: Layer-style dialogs for modern web projects](./guides/RELEASE_NOTES/introducing-layer-esm-v1.0.1.md)
- [React 19 migration](./guides/REACT19_MIGRATION.md)
- [Release notes index](./guides/README.md)

## Contributing

### Development Environment

| Dependency | Version  |
| ---------- | -------- |
| Node.js    | v22.21.1 |
| TypeScript | v5.3.2   |

### Scripts

```bash
pnpm install
npm run dev
npm run build
npm test
npm test -- test/layer.test.js
npm run docs
```

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/layer-esm/blob/main/LICENSE).
