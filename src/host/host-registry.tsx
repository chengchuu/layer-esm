import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { LayerHost, type HostActions } from "../components/LayerHost/LayerHost";
import { LayerStore } from "../store/layer-store";
import type { LayerInstance } from "../store/types";
import {
  lightTheme,
  resolveTheme,
  type LayerTheme,
  type LayerThemeSelection,
} from "../styles/theme";

export interface HostCallbacks {
  close(index: number): void;
  minimize(index: number): void;
  restore(index: number): void;
  full(index: number): void;
  setTop(index: number): void;
  selectTab(index: number, tabIndex: number): void;
}

export interface HostConfig {
  theme?: LayerThemeSelection;
  styleNonce?: string;
}

export class LayerDocumentHost {
  readonly document: Document;
  readonly store = new LayerStore();
  readonly container: HTMLDivElement;
  private root: Root;
  private actions: HostActions;
  private config: HostConfig;
  private media: MediaQueryList | null = null;
  private theme: LayerTheme = lightTheme;
  private destroyed = false;
  private ownedStyleElements = new Set<HTMLStyleElement>();

  constructor(
    document: Document,
    config: HostConfig,
    callbacks: HostCallbacks
  ) {
    this.document = document;
    this.config = config;
    this.actions = {
      ...callbacks,
      setRefs: (index: number, refs: Partial<LayerInstance>) => {
        const record = this.store.get(index);
        if (record) Object.assign(record, refs);
      },
    };
    this.container = document.createElement("div");
    this.container.className = "layer-esm-host";
    this.container.dataset.layerEsmHost = "";
    document.body.appendChild(this.container);
    this.root = createRoot(this.container);
    this.configureTheme();
    this.render();
  }

  updateConfig(config: HostConfig): void {
    this.config = config;
    this.configureTheme();
    this.render();
  }

  flush(action: () => void): void {
    const existingStyles = this.styleElements();
    flushSync(action);
    this.collectNewStyles(existingStyles);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.media?.removeEventListener("change", this.onThemeChange);
    this.media = null;
    flushSync(() => this.root.unmount());
    this.container.remove();
    this.ownedStyleElements.forEach((element) => element.remove());
    this.ownedStyleElements.clear();
  }

  private readonly onThemeChange = (): void => {
    this.theme = resolveTheme(this.config.theme, this.media?.matches ?? false);
    this.render();
  };

  private configureTheme(): void {
    this.media?.removeEventListener("change", this.onThemeChange);
    this.media = null;
    if (this.config.theme === "system") {
      const view = this.document.defaultView;
      this.media = view?.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
      this.media?.addEventListener("change", this.onThemeChange);
    }
    this.theme = resolveTheme(this.config.theme, this.media?.matches ?? false);
  }

  private render(): void {
    const existingStyles = this.styleElements();
    flushSync(() => {
      this.root.render(
        <LayerHost
          store={this.store}
          theme={this.theme}
          actions={this.actions}
          styleTarget={this.document.head}
          styleNonce={this.config.styleNonce}
        />
      );
    });
    this.collectNewStyles(existingStyles);
  }

  private styleElements(): Set<HTMLStyleElement> {
    return new Set(
      this.document.head.querySelectorAll<HTMLStyleElement>(
        "style[data-styled]"
      )
    );
  }

  private collectNewStyles(existingStyles: Set<HTMLStyleElement>): void {
    this.styleElements().forEach((element) => {
      if (!existingStyles.has(element)) this.ownedStyleElements.add(element);
    });
  }
}
