# Playground and PWA cleanup plan

Status: Proposed. This document is a plan only; no implementation changes are included.

## Goals

1. Show the Dialog demo gallery shortcuts in this order: Alert → Message → Confirm → Loading.
2. Remove the entire "Continue exploring" section from the playground. Its API, project home, GitHub, and npm destinations already appear in the page navigation or footer.
3. Remove website-update notices and controls from the homepage, playground, and generated API pages. Keep service-worker registration and caching, and let the browser activate updates through its normal lifecycle.

## Planned changes

1. In `examples/index.ts`, exchange only the Message and Confirm shortcut buttons. Keep every `data-demo` value, action, and displayed source example unchanged. Leave the separate demo cards in their current order.
2. In `examples/index.html`, remove the complete "Continue exploring" section. Retain the existing navigation and footer links, including the links required by SEO validation.
3. Remove the update-notice markup from `site/index.html` and `examples/index.html`, and stop injecting its API-page equivalent in `scripts/build-pages.cjs`. Keep unrelated PWA status and installation behavior that still has a purpose.
4. Remove update-button activation and notice handling from `site/pwa.ts`, along with styles used only by those notices in `site/site.css` and `site/api.css`. Keep safe-environment checks, registration, the worker's cache behavior, and its configured scope. Review whether the worker's `SKIP_WAITING` message handler is obsolete once no page sends that message.
5. Align `test/playground.test.js`, `test/pwa.test.js`, `test/seo.test.js`, and `scripts/validate-pwa.cjs` with the new behavior. Update the service-worker update policy in `AGENTS.md` when implementing this approved change; it currently requires user-controlled activation.

## Expected update behavior and risks

- The browser can discover and install a changed service worker in the background while the site is used. The new worker normally waits until the old worker no longer controls open pages; the site will not force activation or reload an open page.
- Users will not receive a visible update notification or an in-page update action. Refreshing an open tab alone might not activate a waiting worker. Closing or leaving all pages controlled by the old worker, then visiting the site again, allows normal activation.
- The existing network-first page and script requests can fetch newer files while an older worker still controls a page. Verify the published site's behavior across an actual update, including offline access, before treating the change as complete.
- Removing the playground section must not remove the crawlable links required by SEO validation. Removing the update UI also requires updating the PWA validator's current button and explicit-message expectations; deleting only the HTML would leave the build checks inconsistent.

## Verification after implementation

1. Confirm the shortcut order and that each button still runs its original demo and shows its original source.
2. Confirm the "Continue exploring" section is absent and all four destinations remain available through navigation or footer links.
3. Confirm no update notice or update button appears in the generated `/`, `/playground/`, or `/api/` pages, while service-worker registration, caching, and offline fallback still work.
4. Test an update with an old page open and after all old controlled pages close. Confirm there is no forced activation or automatic reload.
5. Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run docs`. The documentation command builds the final site and runs link, SEO, and PWA validation. Review the final diff and run `git diff --check`.

Do not edit generated `docs/` or `dist-dev/` files directly.
