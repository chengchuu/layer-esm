You are a senior JavaScript library migration engineer.

Task: Convert the legacy global-script version of the Layer JS library into a modern ESM package.

- legacy global-script: "./layer/"
- modern ESM package: "./layer-esm/"

Migration goals:

1. Architecture

* Convert the old global `window.layer` style implementation into a pure ES Module architecture.
* Remove all global variable pollution.
* Export APIs using standard ESM syntax:

  ```js
  export default layer
  export { open, close, msg, load, alert, confirm }
  ```
* Preserve backward-compatible API behavior as much as possible.
* Keep the public API names unchanged unless necessary.

2. CSS → CSS-in-JS

* Fully migrate external CSS files into CSS-in-JS.
* Do not keep separate `.css` files.
* Inject styles dynamically when the library initializes.
* Prefer one of these patterns:

  * template literal style injection
  * constructable stylesheets
  * CSSStyleSheet
  * runtime style manager
* Avoid introducing large CSS-in-JS dependencies unless absolutely necessary.

Example:

```js
const styles = `
.layer-container {
    position: fixed;
}
`;

injectStyle(styles);
```

Requirements:

* Prevent duplicate style injection
* Scope styles with a unique prefix
* Avoid style leakage
* Preserve animation behavior

3. Images / Loading Icons
   Legacy loading assets currently use external image files.

Convert them using one of these approaches (priority order):

Priority 1:

* Replace loading images with pure CSS implementations
* Use:

  * border animation
  * transform rotation
  * keyframes
  * pseudo-elements
  * gradients

Example:

```css
.loading-spinner {
    width:24px;
    height:24px;
    border:3px solid transparent;
    border-top-color:currentColor;
    border-radius:50%;
    animation:spin .8s linear infinite;
}
```

Priority 2:

* Convert image assets into inline Base64
* Eliminate external image requests

Requirements:

* No external image files
* No runtime asset loading
* No CDN dependencies

4. Fonts
   If icon fonts exist:

Priority 1:

* Replace icon fonts with inline SVG
* Replace icon fonts with CSS implementations if possible

Priority 2:

* Convert font files into embedded Base64

Requirements:

* Remove external font requests
* Avoid network dependencies

5. Build Output
   Expected package structure:

```txt
src/
    core/
    components/
    styles/
    utils/
    index.js

dist/
    index.mjs
    index.cjs
    index.d.ts
```

Package requirements:

```json
{
  "type":"module",
  "exports":{
    ".":{
      "import":"./dist/index.mjs",
      "require":"./dist/index.cjs"
    }
  }
}
```

6. Code modernization

* Convert legacy var → const/let
* Replace old function syntax with modern syntax where appropriate
* Remove jQuery-style patterns if present
* Remove unnecessary DOM operations
* Reduce coupling
* Split monolithic files into reusable modules
* Add JSDoc or TypeScript type support where possible

7. Performance

* Support tree-shaking
* Avoid unnecessary side effects
* Lazy-create DOM elements
* Minimize runtime style generation cost
* Reduce bundle size

8. Constraints

* Do NOT create wrappers around the old global code
* Do NOT keep window.layer
* Do NOT use iframe-based hacks
* Do NOT keep legacy asset pipelines
* Refactor toward a native ESM implementation

Output:

* First provide migration plan
* Then provide folder structure
* Then refactor incrementally
* Explain major architectural decisions before changing them
