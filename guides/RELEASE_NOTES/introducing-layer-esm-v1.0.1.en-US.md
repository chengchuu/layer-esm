# layer-esm v1.0.1: Layer-style dialogs for modern web projects

`layer-esm` brings the familiar Layer-style imperative API to npm-based browser projects. Version
1.0.1 provides ESM, CommonJS, and TypeScript declaration outputs, so applications can import the
APIs they need instead of relying on a global `window.layer` object.

Special thanks to [Xianxin](https://github.com/sentsin), the original author of
[Layer](https://github.com/layui/layer), for creating the library and API that inspired this
project.

## Install

Install the package from npm:

```bash
npm install layer-esm
```

## Import the API

Named imports make each dependency explicit:

```ts
import { close, confirm, load, msg } from "layer-esm";
```

The default export is also available when a namespace-style API makes migration easier:

```ts
import layer from "layer-esm";

layer.msg("Saved.");
```

## Show a message with `msg`

Use `msg` for brief notifications and lightweight feedback:

```ts
import { msg } from "layer-esm";

msg("Saved successfully.");
```

Pass options to customize the icon, duration, or position:

```ts
msg("Upload complete.", {
  icon: 1,
  time: 3,
  offset: "t",
});
```

## Request confirmation with `confirm`

Use `confirm` when the user must choose whether to continue:

```ts
import { confirm, msg } from "layer-esm";

confirm(
  "Delete this record?",
  {
    btn: ["Delete", "Cancel"],
  },
  () => {
    msg("Deleted.", { icon: 1 });
  },
  () => {
    msg("Cancelled.");
  }
);
```

The first callback handles the primary button. The second callback handles the second button.

## Track loading work with `load`

`load` returns a layer index. Store the index and pass it to `close` when the work finishes:

```ts
import { close, load } from "layer-esm";

const loadingIndex = load(1, {
  content: "Loading...",
  shade: [0.1, "#fff"],
});

setTimeout(() => {
  close(loadingIndex);
}, 1500);
```

The first argument selects one of the available loading styles:

```ts
load(0);
load(1);
load(2);
```

In application code, close the loading layer in every completion path so failed operations do not
leave it open.

## Migrate from legacy Layer

The main migration step is replacing the global script dependency with package imports.

Legacy usage:

```html
<script src="layer.js"></script>
<script>
  layer.msg("Saved.");
</script>
```

Package usage:

```ts
import { msg } from "layer-esm";

msg("Saved.");
```

Use the following mapping for common calls:

| Legacy call              | Named import                 |
|:-------------------------|:-----------------------------|
| `layer.msg(content)`     | `msg(content)`               |
| `layer.confirm(content)` | `confirm(content)`           |
| `layer.load(style)`      | `load(style)`                |
| `layer.close(index)`     | `close(index)`               |
| `layer.closeAll()`       | `closeAll()`                 |

Migrate incrementally:

1. Install `layer-esm` and remove the global script only where the replacement is ready.
2. Replace high-frequency calls such as `msg`, `confirm`, and `load` with named imports.
3. Store returned layer indexes when later code must close or modify a layer.
4. Verify option and callback behavior before removing the legacy dependency from the application.

## Content security

String `content` values are treated as trusted HTML for Layer compatibility. Do not pass untrusted
user input directly. Sanitize untrusted markup first, or use an `HTMLElement` when structured DOM
content is appropriate.

## Next steps

- Try the [live playground](https://chengchuu.github.io/layer-esm/playground/).
- Review the [API documentation](https://chengchuu.github.io/layer-esm/api/).
- Read the current [project documentation](https://github.com/chengchuu/layer-esm).
