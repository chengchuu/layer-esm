import type { CSSProperties } from "react";
import type { NormalizedLayerOptions } from "../core/types";

export type LayerLifecycle = "opening" | "open" | "closing" | "removed";
export type LayerTypeName =
  | "dialog"
  | "page"
  | "iframe"
  | "loading"
  | "tips"
  | "message";
export type LayerWindowState = "normal" | "minimized" | "full";

export interface MovedContentState {
  node: HTMLElement;
  parent: Node | null;
  nextSibling: Node | null;
  placeholder: Comment | null;
}

export interface LayerInstance {
  index: number;
  typeName: LayerTypeName;
  options: NormalizedLayerOptions;
  lifecycle: LayerLifecycle;
  openedAt: number;
  zIndex: number;
  root: HTMLElement | null;
  content: HTMLElement | null;
  title: HTMLElement | null;
  buttons: HTMLElement | null;
  iframe: HTMLIFrameElement | null;
  input: HTMLInputElement | HTMLTextAreaElement | null;
  followTarget: HTMLElement | null;
  previousFocus: HTMLElement | null;
  movedContent: MovedContentState | null;
  windowState: LayerWindowState;
  style: CSSProperties;
  restoreStyle: CSSProperties | null;
  closeCallbacks: Array<() => void>;
  timer: number | null;
  closeTimer: number | null;
  endCalled: boolean;
  successCalled: boolean;
  activeTab: number;
}

export interface LayerSnapshot {
  instances: LayerInstance[];
  version: number;
}
