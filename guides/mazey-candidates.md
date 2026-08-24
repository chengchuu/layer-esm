# Mazey Extraction Candidates

This audit compares `layer-esm` runtime, site, and maintenance helpers with the
installed Mazey 5.6.0 API and the sibling `mazey` and `mazey-npm-template`
implementations. The candidates below either have demonstrated duplication or a
clean, project-independent contract. They are ordered by extraction value.

## 1. `computeFloatingPlacement`

- **Purpose:** Select and clamp a tooltip or popover position by comparing the
  preferred side and fallbacks against viewport overflow.
- **Why reusable:** `applyTipsPlacement` contains generally useful floating-UI
  geometry, but currently mixes calculation with Layer direction numbers, DOM
  reads, scrolling, and style mutation. A pure geometry helper would also serve
  menus, coach marks, popovers, and validation hints and would be straightforward
  to test without a browser.
- **Proposed API:**

  ```ts
  type FloatingPlacement = "top" | "right" | "bottom" | "left";
  type Rect = {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };

  function computeFloatingPlacement(options: {
    anchor: Rect;
    floating: Pick<Rect, "width" | "height">;
    viewport: Rect;
    preferred: FloatingPlacement;
    fallback?: FloatingPlacement[];
    gap?: number;
    margin?: number;
  }): {
    placement: FloatingPlacement;
    left: number;
    top: number;
    overflow: number;
  };
  ```

## 2. `syncDirectoryTree`

- **Purpose:** Compare two directory trees byte-for-byte and optionally replace
  the destination transactionally, with dry-run/check modes, symlink rejection,
  containment checks, validation, and rollback.
- **Why reusable:** The `prefer-layer` and `prefer-mazey` synchronization scripts
  independently implement tree collection, diffing, safe staging, cleanup, and
  recovery. This is useful for generated mirrors and canonical-source copies,
  but belongs in a Node-only tooling entry point rather than Mazey's browser
  bundle.
- **Proposed API:**

  ```ts
  async function syncDirectoryTree(options: {
    source: string;
    destination: string;
    allowedDestinationRoot: string;
    mode?: "check" | "dry-run" | "write";
    rejectSymlinks?: boolean;
    validate?: (stagedDirectory: string) => void | Promise<void>;
  }): Promise<{
    changed: boolean;
    added: string[];
    updated: string[];
    removed: string[];
  }>;
  ```

## 3. `createObservableMapStore`

- **Purpose:** Maintain keyed records with cached snapshots, versioned updates,
  subscriptions, and unsubscribe cleanup.
- **Why reusable:** `LayerStore` is a small framework-independent external store
  whose contract is useful for imperative APIs consumed through React's
  `useSyncExternalStore` or ordinary event subscribers. Generalization should
  remove Layer instance types and make key selection explicit.
- **Proposed API:**

  ```ts
  function createObservableMapStore<K, V>(
    keyOf: (value: V) => K
  ): {
    get(key: K): V | undefined;
    values(): readonly V[];
    set(value: V): void;
    update(key: K, update: Partial<V> | ((value: V) => V)): boolean;
    delete(key: K): V | undefined;
    subscribe(listener: () => void): () => void;
    getSnapshot(): { values: readonly V[]; version: number };
  };
  ```

## Existing overlap to reuse, not extract again

| Local functionality                      | Existing Mazey API                             | Assessment                                                                                     |
| ---------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Package manifest metadata                | `derivePackageMetadata`                        | Reuse directly; retain only Layer's `bundleBaseName` compatibility alias.                      |
| Media-query listener compatibility       | `listenMediaQueryChanges`                      | Reuse for host themes, site themes, and PWA display-mode listeners.                            |
| Service-worker update state              | `watchServiceWorkerUpdates`                    | Reuse the state machine; keep Layer's selectors, messages, and reload policy in its site code. |
| `javaScriptGlobal`                       | `toJavaScriptGlobalName`                       | Direct overlap; compose the existing API.                                                      |
| `repositoryDetails`                      | `parseGitHubRepository`                        | Parsing already exists; only manifest-field adaptation belongs at the caller.                  |
| Theme preference reading and persistence | `resolveThemePreference`, `setThemePreference` | Reuse the established validation and fallback behavior; keep DOM application site-specific.    |
| `isStandaloneMode`                       | `isStandalonePWA`                              | Behavioral overlap; retain dependency injection only if tests or alternate globals require it. |
| Secure service-worker environment checks | `isSafePWAEnv`                                 | Reuse for protocol, manifest, and scope safety; keep project enablement policy local.          |

Layer-specific shade defaults, numeric direction codes, dialog offset policy,
theme merging, and DOM style mutation are intentionally excluded. The local
Markdown link validator is also not proposed yet: its regular-expression parser
supports only a constrained Markdown subset and should not become a shared API
without an explicit syntax contract or parser-backed tests.
