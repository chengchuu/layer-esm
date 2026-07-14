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

## Guides

- [Introducing layer-esm](./release-notes/introducing-layer-esm-v1.0.1.md)
- [Release notes index](./release-notes/README.md)

## Contributing

### Development Environment

| Dependency | Version  |
| ---------- | -------- |
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

This command creates the complete GitHub Pages artifact in `docs`, including the landing page,
playground, TypeDoc API documentation, manifest, service worker, `robots.txt`, and `sitemap.xml`.
Validate the final SEO and PWA output independently with `npm run seo:validate` and
`npm run pwa:validate`.

Build and serve a production-like project-path preview at
<http://127.0.0.1:4173/layer-esm/>:

```bash
npm run pwa:preview
```

Normal `npm run dev` serves the website at <http://localhost:8080/> and the playground at
<http://localhost:8080/playground/> without registering the production service worker. When testing
worker updates, unregister old workers or clear site data first. Supported browsers may offer an
install prompt; Safari on iPhone and iPad provides Add to Home Screen through the Share menu.

Docker:

```bash
docker compose up -d --build
```

Visit: <http://localhost:8080>

## License

This software is released under the terms of the [MIT license](https://github.com/chengchuu/layer-esm/blob/main/LICENSE).
