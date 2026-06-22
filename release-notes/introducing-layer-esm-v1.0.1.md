# Introducing layer-esm

`layer-esm` is a modern dialog layer library for web applications. It keeps the familiar Layer-style API while moving the implementation to a module-based ESM package that is easier to bundle, test, and maintain.

If you already know the legacy `layer` library, the new package should feel familiar:

- message prompts still use `msg`
- confirmation dialogs still use `confirm`
- loading overlays still use `load`

The difference is how you consume it: instead of relying on a global `window.layer`, you import the APIs you need.

## Install

```bash
npm install layer-esm
```

## Basic usage

```ts
import layer, { confirm, load, msg } from "layer-esm";
```

## `msg`: quick message feedback

Use `msg` for short notifications and lightweight user feedback.

```ts
import { msg } from "layer-esm";

msg("Saved successfully.");
```

You can also customize the icon, display duration, and position:

```ts
msg("Upload complete.", {
  icon: 1,
  time: 3,
  offset: "t",
});
```

Typical use cases:

- save success messages
- validation reminders
- short progress updates

## `confirm`: user decisions with callbacks

Use `confirm` when the user must choose whether to continue.

```ts
import { confirm, msg } from "layer-esm";

confirm("Delete this record?", {
  btn: [ "Delete", "Cancel" ],
}, () => {
  msg("Deleted.", { icon: 1 });
}, () => {
  msg("Cancelled.");
});
```

This keeps the familiar Layer pattern:

- the first callback handles confirmation
- the second callback handles cancellation

It works well for:

- destructive actions
- publish/submit confirmations
- workflow checkpoints

## `load`: loading state and async work

Use `load` when you need to show that an action is in progress.

```ts
import layer, { load } from "layer-esm";

const loadingIndex = load(1, {
  content: "Loading...",
  shade: [0.1, "#fff"],
});

setTimeout(() => {
  layer.close(loadingIndex);
}, 1500);
```

`load` supports multiple visual styles:

```ts
load(0);
load(1);
load(2);
```

This is useful for:

- API requests
- startup or initialization tasks
- background processing feedback

## Migrating from legacy `layer`

The biggest migration change is moving from a global browser dependency to module imports.

### Legacy usage

```html
<script src="layer.js"></script>
<script>
  layer.msg("Saved");
</script>
```

### New usage

```ts
import { msg } from "layer-esm";

msg("Saved");
```

## Migration mapping

### Message

Legacy:

```js
layer.msg("一段提示信息");
```

New:

```ts
import { msg } from "layer-esm";

msg("一段提示信息");
```

### Confirm

Legacy:

```js
layer.confirm("您是如何看待前端开发？", {
  btn: ["重要", "奇葩"],
}, function () {
  layer.msg("的确很重要", { icon: 1 });
}, function () {
  layer.msg("也可以这样");
});
```

New:

```ts
import { confirm, msg } from "layer-esm";

confirm("您是如何看待前端开发？", {
  btn: [ "重要", "奇葩" ],
}, () => {
  msg("的确很重要", { icon: 1 });
}, () => {
  msg("也可以这样");
});
```

### Loading

Legacy:

```js
var index = layer.load(1, {
  shade: [0.1, "#fff"],
});

setTimeout(function () {
  layer.close(index);
}, 1500);
```

New:

```ts
import layer, { load } from "layer-esm";

const index = load(1, {
  shade: [0.1, "#fff"],
});

setTimeout(() => {
  layer.close(index);
}, 1500);
```

## What changes during migration

### 1. Import instead of global access

Old:

```js
layer.msg("Hi");
```

New:

```ts
import { msg } from "layer-esm";

msg("Hi");
```

### 2. Keep `layer` default import when you need instance control

For actions like closing a loading layer, keep the default import:

```ts
import layer, { load } from "layer-esm";

const index = load();
layer.close(index);
```

### 3. Remove script-tag dependency assumptions

The new package is designed for module-based usage in modern app builds:

- npm package installation
- ESM-friendly bundlers
- TypeScript projects

## Recommended migration strategy

1. Replace the global script include with an npm dependency.
2. Start by migrating `msg`, `confirm`, and `load` first because they are usually the most common calls.
3. Add `import layer, { ... } from "layer-esm"` where you still need `close`, `closeAll`, or other instance-level helpers.
4. Move page-by-page or feature-by-feature until the old global dependency is no longer needed.

## Summary

`layer-esm` keeps the Layer interaction style while fitting modern frontend projects much better. If your current code mainly depends on `msg`, `confirm`, and `load`, migration is straightforward:

- install the package
- replace global calls with imports
- keep the same Layer-style API patterns

That makes `layer-esm` a practical path forward for teams that want a familiar dialog layer API without staying on the legacy global implementation.
