# layer-esm API Map

This discovery map was generated from the current root exports in `src/index.ts`, the declarations in `dist/index.d.ts`, and the defining code and tests. It covers all 23 named runtime exports, the default API object, and all 14 exported types. Verify the installed version before use.

## Contents

- [Selection table](#selection-table)
- [Shared behavior](#shared-behavior)
- [Dialog creation](#dialog-creation)
- [Closing and lifecycle](#closing-and-lifecycle)
- [Configuration and styles](#configuration-and-styles)
- [Window and iframe helpers](#window-and-iframe-helpers)
- [Default export](#default-export)
- [Public types](#public-types)
- [Rejection checklist](#rejection-checklist)

## Selection table

| Requirement                  | Preferred API                                               | Notes                                                                                            |
| ---------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Informational dialog         | `alert`                                                     | Use for acknowledgement-only flows; close explicitly inside a supplied `yes` callback.           |
| User confirmation            | `confirm`                                                   | Handle both confirm and cancel-button paths; Escape/close-button behavior uses `options.cancel`. |
| Temporary message            | `msg`                                                       | Suitable for brief feedback; defaults to a three-second timeout.                                 |
| Loading indicator            | `load`                                                      | Store the returned index and close it in every completion path.                                  |
| Element tooltip              | `tips`                                                      | Requires a valid target element and trusted or sanitized content.                                |
| Text input                   | `prompt`                                                    | Validate the returned value and close the index after successful handling.                       |
| Tabbed dialog                | `tab`                                                       | Use only for Layer-owned simple tabs; tab content is trusted HTML.                               |
| Custom dialog                | `open`                                                      | Use when specialized helpers are insufficient and the required lifecycle is supported.           |
| Close one dialog             | `close`                                                     | Requires the returned dialog index.                                                              |
| Close a category/all dialogs | `closeAll`                                                  | Category strings are runtime type names, not arbitrary tags.                                     |
| Global configuration         | `config`                                                    | Avoid changing global defaults unnecessarily.                                                    |
| Update layout/title          | `style`, `title`                                            | Operate on an existing index; `title` is text-only.                                              |
| Iframe dialog control        | `getChildFrame`, `getFrameIndex`, `iframeAuto`, `iframeSrc` | Same-origin restrictions apply to frame document access.                                         |

Prefer the specialized API when it matches. Do not choose `open` merely for flexibility.

## Shared behavior

- **Runtime:** Dialog-creation APIs are browser/DOM-oriented and throw when no browser-like `document` exists. Some configuration and no-record helpers can return without touching the DOM, but do not treat that as support for rendering Layer UI during SSR or in Node.js-only code.
- **Indexes:** Creation helpers return a numeric index. Keep it when later closing, styling, positioning, or controlling the dialog.
- **Styles:** Runtime CSS is injected once unless global configuration disables injection. No external image, font, or stylesheet is required.
- **Trusted HTML:** General string `content`, `alert`, `confirm`, `msg`, `tips`, and `LayerTabItem.content` reach `innerHTML`. They are not sanitized. Loading labels and titles are text-only.
- **Accessibility:** Modal-like records receive `role="dialog"`; shaded dialogs receive `aria-modal="true"`. Dialogs trap Tab focus, close on Escape unless `cancel` returns `false`, and restore prior focus when appropriate. Loading and simple status messages use `role="status"` and `aria-live="polite"`; tips use `role="tooltip"`.
- **Callbacks:** Callbacks are synchronous unless closure uses the default exit animation. A defined first-button `yes` callback owns the action and must close the dialog when desired. Second buttons normally close unless `btn2` returns `false`. Close button, shade, and Escape call `cancel` and remain open when it returns `false`.
- **Cleanup:** Closing clears timers and registered listeners, removes dialog/shade DOM, restores moved `HTMLElement` content and scroll state, and may restore focus. Verify every application-controlled async path closes retained indexes.
- **Browser baseline:** The repository documents the latest two Chrome, Edge, Firefox, and Safari releases, Chrome for Android 100+, and iOS Safari 15+. The package installs no global polyfills.

## Dialog creation

### `open`

- **Purpose:** Create a custom Layer record of type dialog (`0`), page (`1`), iframe (`2`), loading (`3`), or tips (`4`).
- **Parameters:** `options?: LayerOptions`.
- **Return:** Numeric dialog index.
- **Callbacks:** `success(layero, index)` after mounting; `yes(index, layero)`, `btn2(index, layero)`, `cancel(index, layero)`, `change(index)`, and `end()` according to the selected interaction.
- **Typical use:** Custom content, buttons, iframe dialogs, sizing, positioning, drag/resize, shade, timeout, and lifecycle behavior not covered by a specialized helper.
- **Important options:** `type`, `title`, `content`, `btn`, `area`, `offset`, `shade`, `shadeClose`, `time` in seconds, `closeBtn`, `maxmin`, `scrollbar`, `ariaLabel`, and callbacks.
- **Accessibility:** Role depends on type/options. Dialog records trap focus and handle Escape. Supply an informative text title or `ariaLabel` when no title is rendered; verify custom content semantics and initial focus.
- **Security:** String/page/tips content and iframe URLs require a trust review. Prefer `HTMLElement` for structured custom content; the node is moved into the dialog and restored on close. Preserve CSP and iframe policy.
- **DOM requirements:** Requires `document`; placement, drag, resize, timers, and tips also use `window`.
- **Common mistakes:** Using `open` when a helper fits; expecting a Promise; forgetting to close in `yes`; using untrusted HTML; assuming any `type` works without type-specific content; moving one `HTMLElement` into two open layers.
- **Example:** `const index = open({ title: "Details", content: element, btn: ["Done"], yes: (index) => close(index) });`
- **Do not use when:** The component belongs in normal document flow, needs an unsupported framework-controlled lifecycle, or required accessibility/security behavior cannot be expressed.

### `alert`

- **Purpose:** Open an acknowledgement dialog with one `OK` button.
- **Parameters:** `content: string`; optional `LayerOptions` or `yes(index, layero)` callback; optional separate `yes` callback.
- **Return:** Numeric dialog index.
- **Callbacks:** Without `yes`, the button closes automatically. With `yes`, the callback owns closure.
- **Typical use:** Important information that requires acknowledgement.
- **Important options:** Dialog title, icon, shade, area, `cancel`, and other compatible `LayerOptions`.
- **Accessibility:** Labelled dialog semantics, focus trapping, Escape handling, and focus restoration follow `open`.
- **Security:** `content` is trusted HTML. Dynamic titles are text.
- **DOM requirements:** Browser document/window.
- **Common mistakes:** Using it for transient feedback; assuming a supplied callback auto-closes; passing untrusted content.
- **Example:** `alert("Saved", {}, (index) => close(index));`
- **Do not use when:** No acknowledgement is required; prefer `msg` for brief nonblocking status.

### `confirm`

- **Purpose:** Open a two-button `OK`/`Cancel` decision dialog.
- **Parameters:** `content: string`; optional `LayerOptions` or confirm callback; optional confirm callback; optional cancel-button callback.
- **Return:** Numeric dialog index.
- **Callbacks:** Confirm callback receives `(index, layero)` and owns closure. The fourth callback is wired to the second button (`btn2` path), which closes afterward. Close button, shade, and Escape instead use `options.cancel`.
- **Typical use:** Binary destructive or consequential decisions.
- **Important options:** `title`, `icon`, `btn` labels, `cancel`, shade and close behavior.
- **Accessibility:** Modal dialog behavior with focus trap, Escape, and restoration; ensure the prompt and button labels communicate consequences.
- **Security:** `content` is trusted HTML.
- **DOM requirements:** Browser document/window.
- **Common mistakes:** Handling only the confirm path; assuming the fourth callback handles Escape; forgetting `close(index)` after an async confirm action.
- **Example:** `confirm("Delete this item?", {}, (index) => { removeItem(); close(index); }, () => keepItem());`
- **Do not use when:** More than a binary decision or a framework-owned controlled confirmation flow is required.

### `msg`

- **Purpose:** Show lightweight transient feedback.
- **Parameters:** `content: string`; optional `LayerOptions` or end callback; optional `end()` callback.
- **Return:** Numeric message index.
- **Callbacks:** Defaults `time` to three seconds; calls `end` after removal. Optional buttons use standard `yes`/`btn2` behavior.
- **Typical use:** Success, failure, or brief status feedback.
- **Important options:** `time`, `icon`, `shade`, `btn`, `end`, `ariaLabel`.
- **Accessibility:** Without buttons it is a polite live status and does not displace the active dialog keyboard handler. With buttons it becomes a dialog.
- **Security:** `content` is trusted HTML.
- **DOM requirements:** Browser document/window and timers.
- **Common mistakes:** Using it for content users must acknowledge; setting `time: 0` without later closing; placing interactive HTML in a status-only message.
- **Example:** `msg("Saved", { icon: 1, time: 2 });`
- **Do not use when:** The message needs durable document content, complex controls, or guaranteed acknowledgement.

### `load`

- **Purpose:** Show a CSS loading indicator, optionally with a text label.
- **Parameters:** `icon?: number`; `options?: LayerOptions`.
- **Return:** Numeric loading index.
- **Callbacks:** Standard `success` and `end` options apply; no Promise integration.
- **Typical use:** Indicate an operation in progress.
- **Important options:** `content` text, shade, timeout, positioning, and `scrollbar`. Defaults to type `3`, nearly transparent shade, no title/buttons/close/resize.
- **Accessibility:** Uses polite status semantics. Provide meaningful text where users need context; test screen-reader behavior for the product requirement.
- **Security:** Loading string content is rendered as text, not HTML.
- **DOM requirements:** Browser document/window.
- **Common mistakes:** Dropping the returned index; closing only on success; using it as a progress meter without progress semantics.
- **Example:** `const index = load(0, { content: "Saving" }); try { await save(); } finally { close(index); }`
- **Do not use when:** Determinate progress, cancellable operation UI, or an in-flow skeleton/progress component is required.

### `tips`

- **Purpose:** Position a tooltip-like Layer next to an element.
- **Parameters:** `content: string`; `follow: string | HTMLElement`; optional `LayerTipsOptions`.
- **Return:** Numeric tips index.
- **Callbacks:** Standard `success`, `end`, timeout, and cancel-related options where applicable.
- **Typical use:** Short contextual guidance or validation feedback anchored to an element.
- **Important options:** `tips` direction/color, `time`, `fixed`, `offset`, `skin`, and `className`.
- **Accessibility:** Root uses `role="tooltip"`, but the package does not establish `aria-describedby` on the target. Add and test the required target relationship/lifecycle when accessibility requires it.
- **Security:** `content` is trusted HTML.
- **DOM requirements:** A valid rendered target is required for correct anchoring; placement listens to window resize/scroll and cleans those listeners on close.
- **Common mistakes:** Passing a missing/invalid selector; using it for focusable interactive content; failing to close persistent validation tips; trusting user markup.
- **Example:** `tips("Required", inputElement, { tips: 1, time: 2 });`
- **Do not use when:** The content is interactive, must remain in normal flow, or accessible association cannot be supplied.

### `prompt`

- **Purpose:** Collect a simple non-empty text, password, or textarea value.
- **Parameters:** `options?: LayerPromptOptions`; optional `yes(value, index, input)` callback.
- **Return:** Numeric prompt index.
- **Callbacks:** Empty/whitespace-only input refocuses the field. Overlong input opens a temporary tip. A valid value calls `yes`; the caller must close the prompt when desired.
- **Typical use:** Small one-field input tasks.
- **Important options:** `formType` (`0` text, `1` password, `2` textarea), `value`, `maxlength`, `maxlengthMessage`, title, and dialog options.
- **Accessibility:** Uses dialog focus management. Verify a meaningful accessible label for the generated input; the current API does not expose a dedicated input-label option.
- **Security:** The returned value is untrusted application input. Validate and encode it for its destination. The internally created input is an `HTMLElement`, and custom maxlength messages are rendered as text rather than HTML.
- **DOM requirements:** Browser document/window and input element constructors.
- **Common mistakes:** Expecting a Promise; treating whitespace as valid; forgetting to close after success; assuming maxlength validation sanitizes input; using it for multi-field forms.
- **Example:** `prompt({ title: "Name", maxlength: 80 }, (value, index) => { saveName(value); close(index); });`
- **Do not use when:** Multiple fields, rich validation, framework form state, or stronger accessible labelling/control is required.

### `tab`

- **Purpose:** Open a page-style dialog containing simple Layer-owned tabs.
- **Parameters:** `options: LayerTabOptions` with `tab: LayerTabItem[]`.
- **Return:** Numeric dialog index.
- **Callbacks:** Calls `success(layero, index)` and `change(activeIndex)` on click changes.
- **Typical use:** Small sets of static tabbed dialog content.
- **Important options:** Tab items plus page/dialog sizing, shade, buttons, and lifecycle options.
- **Accessibility:** Emits tablist/tab/tabpanel roles, `aria-selected`, `aria-controls`, and labelled panels. It currently changes tabs on click only; verify keyboard arrow navigation and focus requirements before acceptance.
- **Security:** Every `LayerTabItem.content` string is trusted HTML; item titles are text.
- **DOM requirements:** Browser document/window.
- **Common mistakes:** Passing untrusted tab HTML; expecting framework components or keyboard-complete tabs; using tabs for a normal page section.
- **Example:** `tab({ tab: [{ title: "Summary", content: "<p>Ready</p>" }] });`
- **Do not use when:** Tabs belong in document flow, require controlled framework state, or must meet keyboard behavior not implemented by the public API.

## Closing and lifecycle

### `close`

- **Purpose:** Close one Layer record by index.
- **Parameters:** `index: number`; optional `callback()`.
- **Return:** `void`.
- **Callbacks:** Runs the record's `end()` and then the supplied callback after removal; with exit animation this occurs after about 180 ms. A missing index invokes the callback immediately. Repeated calls during closing are ignored.
- **Typical use:** Close a retained index after a button, async completion, or cleanup.
- **Important options:** Closure behavior depends on the record's `isOutAnim` and `end` options.
- **Accessibility:** May restore previously focused connected element.
- **Security:** No HTML input; ensure the index belongs to the intended UI flow.
- **DOM requirements:** Existing Layer record; timers when animated.
- **Common mistakes:** Calling with `layer.index` instead of the returned index; assuming callback runs immediately; closing the wrong concurrent layer.
- **Example:** `close(index);`
- **Do not use when:** The component is not owned by `layer-esm`.

### `closeAll`

- **Purpose:** Close every open record or every record of a runtime type.
- **Parameters:** Optional type string or callback; optional callback.
- **Return:** `void`.
- **Callbacks:** The completion callback runs after every matching record has closed, including records that were already closing; it runs immediately when nothing matches.
- **Typical use:** Scoped teardown or emergency cleanup.
- **Important options:** Recognized internal type names are `dialog`, `page`, `iframe`, `loading`, and `tips`.
- **Accessibility:** Each record performs normal cleanup/focus restoration; test multi-dialog focus results.
- **Security:** No content input; global closure can disrupt unrelated flows.
- **DOM requirements:** Browser state when records exist.
- **Common mistakes:** Using arbitrary tags as `type`; closing unrelated application dialogs; using global closure where exact ownership matters.
- **Example:** `closeAll("loading");`
- **Do not use when:** Exact ownership matters; retain and close individual indexes instead.

## Configuration and styles

### `config`

- **Purpose:** Shallow-merge global defaults and configure runtime style injection.
- **Parameters:** `options?: LayerConfigOptions`.
- **Return:** The default Layer API object for chaining/compatibility.
- **Callbacks:** None directly; inherited option callbacks become defaults for later records.
- **Typical use:** One-time application-level defaults, CSP nonce, or disabling injection after styles are loaded separately.
- **Important options:** All partial `LayerOptions`, plus `injectStyles` and `styleNonce`.
- **Accessibility:** Global defaults can affect shade, titles, buttons, focus behavior, and labels across all dialogs; review carefully.
- **Security:** Use only a genuine request nonce. A nonce configured after the style element already exists does not replace that element. `injectStyles: false` requires equivalent CSS to be loaded by the application.
- **DOM requirements:** Calls style readiness immediately and therefore requires a browser-like document unless injection is disabled first in the same call.
- **Common mistakes:** Changing globals for one dialog; inventing a nonce; disabling injection without consuming `layerStyles`; assuming deep merge.
- **Example:** `config({ styleNonce: window.__CSP_NONCE__ });`
- **Do not use when:** Per-dialog options are sufficient or global mutation would make behavior harder to reason about.

### `ready`

- **Purpose:** Ensure styles are ready, invoke an optional callback immediately, and return the default API object.
- **Parameters:** Optional `callback()`.
- **Return:** Default Layer API object.
- **Callbacks:** Synchronous immediate invocation.
- **Typical use:** Compatibility-style initialization after the application already controls DOM readiness.
- **Important options:** Style behavior comes from `config`.
- **Accessibility:** No UI by itself.
- **Security:** Same style/CSP considerations as `config`.
- **DOM requirements:** Browser-like document when automatic injection is enabled.
- **Common mistakes:** Treating it as `DOMContentLoaded`, a Promise, or asynchronous readiness.
- **Example:** `ready(() => open({ content: "Ready" }));`
- **Do not use when:** Native application lifecycle hooks already provide a clearer readiness boundary.

### `layerStyles`

- **Purpose:** Export the complete Layer CSS as a string.
- **Parameters:** None; constant string.
- **Return:** CSS text value.
- **Callbacks:** None.
- **Typical use:** Feed CSS into the project's approved build/style pipeline before `config({ injectStyles: false })`.
- **Important options:** Pair with global `injectStyles: false` only after equivalent styles are actually loaded.
- **Accessibility:** CSS controls visible focus and dialog layout; preserve or replace those affordances deliberately.
- **Security:** Treat CSS insertion as a CSP-governed operation. Do not inject it through an unapproved runtime path.
- **DOM requirements:** Reading the string is DOM-independent; applying it is project-specific.
- **Common mistakes:** Logging the CSS instead of loading it; disabling runtime injection without a stylesheet; importing an internal theme file.
- **Example:** `import { config, layerStyles } from "layer-esm"; /* load layerStyles through the approved pipeline */ config({ injectStyles: false });`
- **Do not use when:** Default runtime injection already satisfies the project's CSP and styling policy.

### `title`

- **Purpose:** Replace an existing dialog title.
- **Parameters:** `name: string`; optional index defaulting to the most recently allocated index.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Update a title after state changes.
- **Important options:** Supply the explicit index in concurrent flows.
- **Accessibility:** Updates the text of the existing labelled title element.
- **Security:** Uses `textContent`; dynamic text is not interpreted as HTML.
- **DOM requirements:** Existing record with a rendered title.
- **Common mistakes:** Omitting the index; expecting title HTML/style changes; targeting a titleless record.
- **Example:** `title("Upload complete", index);`
- **Do not use when:** The record has no title or the change belongs in framework-owned content.

### `style`

- **Purpose:** Update selected inline layout properties on an existing record.
- **Parameters:** `index: number`; `LayerStyleOptions`.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Adjust width, height, position, or overflow after opening.
- **Important options:** `width`, `height`, `top`, `left`, `right`, `bottom`, `position`, `overflow`.
- **Accessibility:** Verify resizing/repositioning does not obscure content, focus, or responsive/mobile access.
- **Security:** Values become inline style properties; do not derive them from untrusted arbitrary CSS.
- **DOM requirements:** Existing record.
- **Common mistakes:** Expecting arbitrary CSS keys; using it instead of project classes; forgetting numeric values become pixels.
- **Example:** `style(index, { width: 480, overflow: "auto" });`
- **Do not use when:** Stable theme/class-based styling is more appropriate.

## Window and iframe helpers

### `setTop`

- **Purpose:** Raise a record's z-index.
- **Parameters:** Record index or an `HTMLElement` inside/at the Layer root.
- **Return:** Current global z-index; also returned unchanged when no record is found.
- **Callbacks:** None.
- **Typical use:** Bring a known Layer window to the front.
- **Important options:** Resolve and retain the correct record/index.
- **Accessibility:** Visual stacking does not itself move focus; coordinate focus intentionally.
- **Security:** No content input.
- **DOM requirements:** Element form requires Layer data attributes/ancestry.
- **Common mistakes:** Treating the return value as success; raising visually without fixing focus order.
- **Example:** `setTop(index);`
- **Do not use when:** Application stacking is not Layer-owned.

### `min`

- **Purpose:** Minimize an open record into a bottom stack.
- **Parameters:** `index: number`; optional partial options currently used for `minStack`.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Window-like Layer dialogs with minimize behavior.
- **Important options:** `minStack`; `maxmin: true` exposes toolbar controls.
- **Accessibility:** Content/buttons are hidden visually; verify focus does not remain in hidden content and the minimized state is communicated for the requirement.
- **Security:** No content input.
- **DOM requirements:** Existing record.
- **Common mistakes:** Using it for mobile modal flows; assuming a state callback; minimizing critical confirmation UI.
- **Example:** `min(index);`
- **Do not use when:** Window management is not part of the product interaction.

### `restore`

- **Purpose:** Restore a minimized or full-screen record to saved inline layout.
- **Parameters:** `index: number`.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Reverse `min` or `full`.
- **Important options:** Requires a prior managed state transition.
- **Accessibility:** Re-check focus and visible context after restoration.
- **Security:** No content input.
- **DOM requirements:** Existing record with saved layout state.
- **Common mistakes:** Expecting it to reopen a closed dialog or reset arbitrary styles.
- **Example:** `restore(index);`
- **Do not use when:** No Layer-managed minimized/full state exists.

### `full`

- **Purpose:** Expand an open record to the viewport.
- **Parameters:** `index: number`.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Window-like dialogs needing a temporary full-screen presentation.
- **Important options:** Use `restore` to return to the prior layout; `maxmin: true` adds toolbar controls.
- **Accessibility:** Test zoom, viewport changes, focus visibility, and escape/close paths.
- **Security:** No content input.
- **DOM requirements:** Existing record and viewport.
- **Common mistakes:** Treating it as the browser Fullscreen API; assuming orientation or safe-area handling.
- **Example:** `full(index);`
- **Do not use when:** True media fullscreen or framework-controlled full-screen layout is required.

### `getChildFrame`

- **Purpose:** Query an element inside a Layer-owned iframe.
- **Parameters:** CSS selector; optional index defaulting to the last allocated index.
- **Return:** Matching `HTMLElement` or `null`.
- **Callbacks:** None.
- **Typical use:** Same-origin iframe dialog integration.
- **Important options:** Pass the explicit iframe index.
- **Accessibility:** Cross-document focus and labelling remain the application's responsibility.
- **Security:** Same-origin policy applies; cross-origin access safely returns `null`. Validate selectors and do not bypass iframe trust boundaries.
- **DOM requirements:** Existing type-2 iframe whose document is accessible.
- **Common mistakes:** Assuming cross-origin access; omitting index; confusing `null` with selector-only failure.
- **Example:** `const form = getChildFrame("form", index);`
- **Do not use when:** The iframe is cross-origin or messaging is the appropriate integration boundary.

### `getFrameIndex`

- **Purpose:** Find a Layer iframe record by its iframe `name` or `id`.
- **Parameters:** `name: string`.
- **Return:** Numeric index or `null`.
- **Callbacks:** None.
- **Typical use:** Resolve the generated Layer frame identifier back to an index.
- **Important options:** Generated names/ids follow `layui-layer-iframe<index>`.
- **Accessibility:** No direct effect.
- **Security:** Do not treat a matching name as origin validation.
- **DOM requirements:** Existing iframe records in Layer state.
- **Common mistakes:** Passing the iframe URL or outer root id; assuming a match exists.
- **Example:** `const index = getFrameIndex(frame.name);`
- **Do not use when:** The caller already owns the returned creation index.

### `iframeAuto`

- **Purpose:** Resize an iframe Layer to its same-origin document body height.
- **Parameters:** `index: number`.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Fit a same-origin iframe dialog to its current content.
- **Important options:** Reads body scroll height plus Layer title/button heights.
- **Accessibility:** Verify viewport bounds, zoom, and scroll access after resizing.
- **Security:** Cross-origin access is blocked and becomes a no-op.
- **DOM requirements:** Existing accessible iframe document/body.
- **Common mistakes:** Expecting cross-origin or continuous automatic resizing; allowing content to exceed the viewport.
- **Example:** `iframeAuto(index);`
- **Do not use when:** Cross-origin content or responsive observer-driven sizing is required.

### `iframeSrc`

- **Purpose:** Navigate a Layer-owned iframe to a new URL.
- **Parameters:** `index: number`; `url: string`.
- **Return:** `void`.
- **Callbacks:** None.
- **Typical use:** Change an existing iframe dialog destination.
- **Important options:** The iframe record must exist.
- **Accessibility:** Navigation changes context; provide appropriate announcement/loading behavior when required.
- **Security:** Validate allowed URL schemes/origins and preserve iframe/CSP policy. This helper does not validate the URL.
- **DOM requirements:** Existing type-2 iframe.
- **Common mistakes:** Passing untrusted URLs; expecting load/error callbacks; using it for non-iframe records.
- **Example:** `iframeSrc(index, trustedUrl);`
- **Do not use when:** Navigation policy requires a more controlled iframe component or messaging lifecycle.

## Default export

### `default` Layer API object

- **Purpose:** Compatibility object containing version `v`, next-index and z-index getters, and every callable runtime helper except `layerStyles`.
- **Parameters/return/callbacks:** Delegates to the selected member API.
- **Typical use:** Existing code already established around a local Layer object.
- **Important options:** Prefer the named helper documentation above.
- **Accessibility/security/DOM:** Identical to the invoked member.
- **Common mistakes:** Assigning it to `window.layer`, using namespace-style access in new code, or assuming `index` is the index of a safely owned current dialog.
- **Example:** Prefer `import { confirm } from "layer-esm";` rather than a new default-import wrapper.
- **Do not use when:** Direct named imports are available; they make usage and tree shaking clearer.

## Public types

Import these from the package root with `import type`. They have no runtime value, callbacks, DOM effects, or automatic security guarantees; their browser/HTML fields still require the checks described above.

| Type                 | Purpose and main values                                      | Important considerations / common mistakes                                                               |
| -------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `LayerType`          | Numeric record type `0 \| 1 \| 2 \| 3 \| 4`.                 | Maps to dialog, page, iframe, loading, tips; do not invent values.                                       |
| `LayerOffsetKeyword` | `auto`, edge, and corner positioning keywords.               | Position semantics use viewport/scroll state; test mobile layouts.                                       |
| `LayerOffset`        | Keyword, CSS-like string, number, or top/left tuple.         | Numbers and digit-only strings become pixels; arbitrary strings are inline positions.                    |
| `LayerArea`          | Width or width/height tuple using strings or numbers.        | Numeric values become pixels; explicit width changes max-width behavior.                                 |
| `LayerTitle`         | `false`, text string, or `[text, inlineStyle]`.              | Text is safe/text-only; tuple style is inline CSS and CSP-sensitive.                                     |
| `LayerShade`         | Boolean, opacity number, or `[opacity, color]`.              | Shade presence affects modal semantics; validate values and contrast.                                    |
| `LayerTipDirection`  | Tooltip direction `1 \| 2 \| 3 \| 4`.                        | Runtime may choose a lower-overflow direction.                                                           |
| `LayerTabItem`       | `{ title: string; content: string }`.                        | Title is text; content is trusted HTML.                                                                  |
| `LayerOptions`       | Complete creation/configuration and callback contract.       | `content` trust, callback-owned closure, global-vs-local use, and type-specific behavior require review. |
| `LayerConfigOptions` | Partial `LayerOptions` plus `injectStyles` and `styleNonce`. | Global shallow merge; do not invent CSP settings.                                                        |
| `LayerPromptOptions` | Prompt-safe subset plus form/value/maxlength message.        | Does not provide a dedicated input label or sanitization.                                                |
| `LayerTipsOptions`   | Tips-safe subset plus direction/color.                       | Target is a separate required argument; tooltip association is not automatic.                            |
| `LayerTabOptions`    | Page/dialog options plus required `tab` items.               | Tab HTML is trusted and keyboard behavior must be checked.                                               |
| `LayerStyleOptions`  | Supported inline size/position/overflow fields.              | Not an arbitrary CSS object; untrusted CSS values remain unsafe.                                         |

## Rejection checklist

Reject the candidate and explain the mismatch when any required behavior fails:

- The UI is not dialog-like or must remain in normal document flow.
- An existing project dialog/component already satisfies the requirement with less risk.
- A framework-controlled component cannot safely hand ownership/lifecycle to Layer.
- Required focus, keyboard, labelling, live-region, or other accessibility behavior is absent.
- The browser baseline is unsupported or the code runs during SSR/Node.js execution.
- CSP forbids runtime style injection and the project cannot load `layerStyles` through an approved path.
- The public root API cannot express the interaction or cleanup contract.
- Arbitrary untrusted HTML must be rendered but the project has no appropriate sanitizer.
- A native API is clearly simpler and sufficient.
- Adding `layer-esm` would overlap an existing dialog dependency without an explicit migration decision and clear benefit.

Recommend the smallest suitable alternative: the existing project component, a native platform API, a framework-native accessible primitive, or a focused local implementation.
