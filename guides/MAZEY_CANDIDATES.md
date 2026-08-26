# Mazey Extraction Candidates

This audit compares `layer-esm` runtime, site, and maintenance helpers with the
installed Mazey 5.9.0 API and the sibling `mazey` and `mazey-npm-template`
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

| Local functionality                      | Existing Mazey API                             | Adoption status  | Layer boundary                                                                                     |
| ---------------------------------------- | ---------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| Package manifest metadata                | `derivePackageMetadata`                        | Already adopted  | Retain only Layer's meaningful `bundleBaseName` alias.                                             |
| Recursive configuration freezing         | `deepFreeze`                                   | Newly adopted    | Freeze the project configuration directly without retaining a renaming wrapper.                    |
| HTML attribute and text serialization    | `escapeHtmlAttribute`                          | Newly adopted    | Reuse for quoted metadata attributes and encoded prompt text; it does not sanitize arbitrary HTML. |
| Media-query listener compatibility       | `listenMediaQueryChanges`                      | Already adopted  | Reuse for host themes, site themes, and PWA display-mode listeners.                                |
| Service-worker update state              | `watchServiceWorkerUpdates`                    | Already adopted  | Keep Layer's selectors, messages, update confirmation, and reload policy local.                    |
| `javaScriptGlobal`                       | `derivePackageMetadata().iifeGlobal`           | Already subsumed | Package metadata derives the browser global; no separate Layer helper is needed.                   |
| `repositoryDetails`                      | `parseGitHubRepository`                        | Adapter retained | Keep package-manifest string/object extraction, then delegate GitHub parsing to Mazey.             |
| Theme preference reading and persistence | `resolveThemePreference`, `setThemePreference` | Already adopted  | Keep DOM application and controls site-specific.                                                   |
| Standalone presentation detection        | `isStandalonePWA`                              | Newly adopted    | Inject Layer's current browser objects; keep install-control behavior local.                       |
| Secure service-worker environment checks | `isSafePWAEnv`                                 | Newly adopted    | Inject browser objects and scope; keep Layer's `config.enabled` policy and registration local.     |

Layer-specific shade defaults, numeric direction codes, dialog offset policy,
theme merging, and DOM style mutation are intentionally excluded. The local
Markdown link validator is also not proposed yet: its regular-expression parser
supports only a constrained Markdown subset and should not become a shared API
without an explicit syntax contract or parser-backed tests.
