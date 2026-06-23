# layer-esm

[![npm version][npm-image]][npm-url]
[![l][l-image]][l-url]

[npm-image]: https://img.shields.io/npm/v/layer-esm
[npm-url]: https://npmjs.org/package/layer-esm
[l-image]: https://img.shields.io/npm/l/layer-esm
[l-url]: https://github.com/chengchuu/layer-esm

Special thanks to 贤心, the original author of Layer, for creating a popup library that has been widely used across the web community for many years. layer-esm is a modern ESM adaptation and refactoring effort inspired by the original Layer project.

## Install

Use layer-esm via [npm](https://www.npmjs.com/package/layer-esm).

```bash
npm install layer-esm --save
```

Of course, you can also serve the built package files yourself. The ESM, CommonJS, and type declaration outputs are written to `dist/`.

## Usage

```ts
import { alert, close, confirm, load, msg } from "layer-esm";

msg("Saved");

const loading = load(1, { content: "Loading..." });

confirm("Continue?", {}, () => {
  alert("Confirmed");
  close(loading);
});
```

## Guides

- [Introducing layer-esm](./release-notes/introducing-layer-esm-v1.0.1.md)
- [Release notes index](./release-notes/README.md)

## Contributing

### Development Environment

| Dependency | Version  |
|------------|----------|
| Node.js    | v22.21.1 |
| TypeScript | v5.1.6   |

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

Docker:

```bash
docker compose up -d --build
```

Visit: <http://localhost:8080>

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/layer-esm/blob/main/LICENSE).
