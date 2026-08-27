# Playground code copy plan

## Summary

Add an accessible **Copy code** button to every dynamically generated code panel on `/playground/`. The control copies the TypeScript source currently displayed in its panel and briefly changes to **Copied** after a successful write.

Mazey 5.6.4 does not provide a suitable clipboard helper. Use the native Clipboard API already used by the project homepage.

## Implementation

- Extend each code-panel header created in `examples/index.ts` with a keyboard-operable **Copy code** button and a visually hidden polite live region.
- Read the current code element's `textContent` when the user activates the button, then pass that value unchanged to `navigator.clipboard.writeText()`.
- Change the button text to **Copied** after a successful write and restore **Copy code** after two seconds. Cancel the previous reset timer when the user activates the control again.
- If the Clipboard API is unavailable or rejects the write, temporarily show **Copy unavailable** and announce that the user can select the code manually.
- Reset stale copy feedback when another demo replaces the panel's displayed source.
- Add narrowly scoped responsive styles so the example label and copy button remain usable at small viewport widths.

## Public interfaces

Do not change package exports, runtime APIs, types, declarations, or dependencies. Add only internal playground data attributes for the copy button and live status.

## Validation

- Add regression checks that confirm generated playground panels include the copy control, copy the current code text, and expose accessible feedback.
- Run `npm run typecheck`, `npm run lint`, the focused site tests, `npm run build:site`, formatting checks for changed files, and `git diff --check`.
- Verify `/playground/` manually in light and dark themes and at a narrow viewport width.
- Confirm that the initial example and subsequently selected examples copy the correct source, repeated activation resets predictably, and keyboard activation works.

## Decisions

- Apply the copy control to every dynamic playground example panel, not the homepage installation command.
- Keep feedback local to the copy control instead of opening a `layer-esm` message.
- Do not add a fallback based on the deprecated `document.execCommand("copy")` API.
