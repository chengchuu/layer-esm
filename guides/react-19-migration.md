# React 19 implementation migration

layer-esm now renders its imperative Layer-style API through a lazy shared React 19 root and
styled-components 6. Consumers continue to call `msg`, `confirm`, `open`, and the other root exports
from any browser framework; no provider, JSX, component mounting, stylesheet, image, font, or CDN is
required.

## Runtime dependencies

`react`, `react-dom`, and `styled-components` are normal package dependencies. Rollup keeps them
external in `dist/index.mjs` and `dist/index.cjs`, so a package manager resolves one normal dependency
graph instead of embedding duplicate runtimes in the layer-esm bundles.

## Themes

Use `config({ theme: "light" })`, `config({ theme: "dark" })`, or
`config({ theme: "system" })`. System mode listens for color-scheme changes. A partial typed custom
theme may override the exported `lightTheme` defaults.

## CSP and generated styles

Use the nonce already supplied by the application:

```ts
config({ styleNonce: window.__CSP_NONCE__ });
```

The former static `layerStyles` plus `injectStyles: false` path cannot reproduce dynamic
styled-components output. `layerStyles` remains a deprecated marker so imports fail gracefully;
`injectStyles: false` now throws a clear error. Applications that prohibit all runtime style
injection should use a different dialog implementation.

## Security and compatibility

String content remains trusted HTML for Layer compatibility and is centralized in the React content
bridge. Sanitize untrusted markup first. Titles, button labels, prompt labels, and loading text remain
text. An `HTMLElement` is moved rather than cloned and is restored on close with listeners and state
intact.

The public imperative functions retain numeric indexes, Layer-style options, synchronous success
callbacks, timer behavior, and close ownership. `destroy()` and typed theme exports are additive.
