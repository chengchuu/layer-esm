import type {
  LayerConfigOptions,
  LayerOptions,
  LayerPromptOptions,
  LayerStyleOptions,
  LayerTabOptions,
  LayerTipsOptions,
  LayerType,
  NormalizedLayerOptions,
} from "./types";
import type { CSSProperties } from "react";
import { LayerDocumentHost } from "../host/host-registry";
import type {
  LayerInstance,
  LayerTypeName,
  MovedContentState,
} from "../store/types";
import { normalizeArea, normalizeShade } from "../utils/position";

const TYPE_NAMES = ["dialog", "page", "iframe", "loading", "tips"] as const;
const CLOSE_ANIMATION_MS = 180;
const MINIMIZED_WIDTH = 180;

const captureWindowStyle = (record: LayerInstance): CSSProperties => {
  const root = record.root;
  if (!root) return { ...record.style };
  return {
    ...record.style,
    position: root.style.position as CSSProperties["position"],
    width: root.style.width,
    height: root.style.height,
    maxWidth: root.style.maxWidth,
    maxHeight: root.style.maxHeight,
    top: root.style.top,
    right: root.style.right,
    bottom: root.style.bottom,
    left: root.style.left,
    transform: root.style.transform,
    overflow: root.style.overflow,
  };
};

const baseOptions: LayerOptions = {
  type: 0,
  title: "Information",
  content: "",
  shade: 0.3,
  shadeClose: false,
  fixed: true,
  move: ".layer-esm__title",
  moveType: 1,
  resize: true,
  closeBtn: 1,
  zIndex: 19891014,
  maxWidth: 360,
  anim: 0,
  isOutAnim: true,
  icon: -1,
  area: "auto",
  offset: "auto",
  btn: false,
  btnAlign: "r",
  skin: "",
  className: "",
  id: "",
  scrollbar: true,
  minStack: true,
  maxmin: false,
  shadeStyle: "",
  tips: [2, "#111827"],
  formType: 0,
  value: "",
  maxlength: 500,
};

const runtime = {
  nextIndex: 0,
  zIndex: 19891014,
  config: {} as LayerConfigOptions,
  hosts: new Map<Document, LayerDocumentHost>(),
  records: new Map<
    number,
    { host: LayerDocumentHost; record: LayerInstance }
  >(),
  movedOwners: new WeakMap<HTMLElement, number>(),
  bodyLocks: new Map<Document, { count: number; overflow: string }>(),
  minimized: [] as number[],
};

const ensureDocument = (preferred?: Document): Document => {
  if (preferred?.body && preferred.head) return preferred;
  if (typeof document !== "undefined" && document.body && document.head)
    return document;
  throw new Error("layer-esm display APIs require a browser Document");
};

const hostConfig = () => ({
  theme: runtime.config.theme,
  styleNonce: runtime.config.styleNonce,
});

const getHost = (document: Document): LayerDocumentHost => {
  const existing = runtime.hosts.get(document);
  if (existing) return existing;
  const host = new LayerDocumentHost(document, hostConfig(), {
    close,
    minimize: min,
    restore,
    full,
    setTop,
    selectTab: (index, tabIndex) => {
      const entry = runtime.records.get(index);
      if (!entry) return;
      entry.record.activeTab = tabIndex;
      entry.host.flush(() => entry.host.store.touch());
      entry.record.options.change?.(tabIndex);
    },
  });
  runtime.hosts.set(document, host);
  return host;
};

const normalizeTitle = (
  title: LayerOptions["title"]
): NormalizedLayerOptions["title"] => {
  if (title === false) return false;
  if (Array.isArray(title)) return { text: title[0], style: title[1] };
  return { text: title ?? "Information" };
};

const normalizeButtons = (buttons: LayerOptions["btn"]): string[] | false => {
  if (buttons === false || buttons === undefined || buttons === null)
    return false;
  return Array.isArray(buttons) ? buttons : [buttons];
};

const normalizeTips = (tips: LayerOptions["tips"]): [1 | 2 | 3 | 4, string] =>
  Array.isArray(tips)
    ? [tips[0], tips[1] ?? "#111827"]
    : [tips ?? 2, "#111827"];

const normalizeOptions = (options: LayerOptions): NormalizedLayerOptions => {
  const merged: LayerOptions = {
    ...baseOptions,
    ...runtime.config,
    ...options,
  };
  const type = (merged.type ?? 0) as LayerType;
  let content = merged.content ?? "";
  if (type === 2 && typeof content === "string") content = [content, ""];
  return {
    ...baseOptions,
    ...merged,
    content,
    type,
    title: normalizeTitle(merged.title),
    shade: normalizeShade(merged.shade),
    area: normalizeArea(merged.area),
    tips: normalizeTips(merged.tips),
    btn: normalizeButtons(merged.btn),
    fixed: merged.fixed ?? true,
    move: merged.move ?? ".layer-esm__title",
    moveType: merged.moveType ?? 1,
    resize: merged.resize ?? true,
    closeBtn: merged.closeBtn ?? 1,
    timeMs: Math.max((merged.time ?? 0) * 1000, 0),
    zIndex:
      options.zIndex ??
      runtime.config.zIndex ??
      (typeof runtime.config.theme === "object"
        ? runtime.config.theme.zIndex
        : undefined) ??
      19891014,
    maxWidth: merged.maxWidth ?? 360,
    anim: merged.anim ?? 0,
    isOutAnim: merged.isOutAnim ?? true,
    icon: merged.icon ?? -1,
    btnAlign: merged.btnAlign ?? "r",
    skin: merged.skin ?? "",
    className: merged.className ?? "",
    id: merged.id ?? "",
    scrollbar: merged.scrollbar ?? true,
    minStack: merged.minStack ?? true,
    maxmin: merged.maxmin ?? false,
    shadeStyle: merged.shadeStyle ?? "",
    formType: merged.formType ?? 0,
    value: merged.value ?? "",
    maxlength: merged.maxlength ?? 500,
    maxWidthExplicit:
      options.maxWidth !== undefined || runtime.config.maxWidth !== undefined,
    shadeColorExplicit:
      Array.isArray(options.shade) || Array.isArray(runtime.config.shade),
    tipsColorExplicit:
      Array.isArray(options.tips) || Array.isArray(runtime.config.tips),
  };
};

const resolveFollow = (
  follow: LayerOptions["follow"],
  doc: Document
): HTMLElement | null => {
  const view = doc.defaultView;
  if (view && follow instanceof view.HTMLElement) return follow;
  if (typeof follow !== "string") return null;
  try {
    return doc.querySelector<HTMLElement>(follow);
  } catch {
    return null;
  }
};

const isHTMLElement = (value: unknown): value is HTMLElement => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const ownerDocument = (value as Node).ownerDocument;
  const view = ownerDocument?.defaultView;
  return !!view && value instanceof view.HTMLElement;
};

const prepareMovedContent = (
  content: LayerOptions["content"],
  index: number
): MovedContentState | null => {
  if (!isHTMLElement(content)) return null;
  const owner = runtime.movedOwners.get(content);
  if (owner !== undefined)
    throw new Error(`Layer content is already mounted in layer ${owner}`);
  runtime.movedOwners.set(content, index);
  const parent = content.parentNode;
  const placeholder = parent
    ? content.ownerDocument.createComment("layer-esm-placeholder")
    : null;
  if (parent && placeholder) parent.insertBefore(placeholder, content);
  return {
    node: content,
    parent,
    nextSibling: content.nextSibling,
    placeholder,
  };
};

const restoreMovedContent = (record: LayerInstance): void => {
  const moved = record.movedContent;
  if (!moved) return;
  const { node, parent, nextSibling, placeholder } = moved;
  if (parent) {
    if (placeholder?.parentNode === parent) {
      parent.insertBefore(node, placeholder);
      placeholder.remove();
    } else if (nextSibling?.parentNode === parent)
      parent.insertBefore(node, nextSibling);
    else parent.appendChild(node);
  }
  runtime.movedOwners.delete(node);
  record.movedContent = null;
};

const lockScroll = (doc: Document): void => {
  const current = runtime.bodyLocks.get(doc);
  if (current) current.count += 1;
  else
    runtime.bodyLocks.set(doc, {
      count: 1,
      overflow: doc.documentElement.style.overflow,
    });
  doc.documentElement.style.overflow = "hidden";
};

const unlockScroll = (doc: Document): void => {
  const current = runtime.bodyLocks.get(doc);
  if (!current) return;
  current.count -= 1;
  if (current.count > 0) return;
  doc.documentElement.style.overflow = current.overflow;
  runtime.bodyLocks.delete(doc);
};

const typeNameOf = (type: LayerType, override?: LayerTypeName): LayerTypeName =>
  override ?? TYPE_NAMES[type];

const finishClose = (index: number, runEnd = true): void => {
  const entry = runtime.records.get(index);
  if (!entry) return;
  const { host, record } = entry;
  const doc = host.document;
  if (record.timer !== null) doc.defaultView?.clearTimeout(record.timer);
  if (record.closeTimer !== null)
    doc.defaultView?.clearTimeout(record.closeTimer);
  restoreMovedContent(record);
  if (!record.options.scrollbar) unlockScroll(doc);
  const minimizedIndex = runtime.minimized.indexOf(index);
  if (minimizedIndex >= 0) {
    runtime.minimized.splice(minimizedIndex, 1);
    reflowMinimized();
  }
  const topmost = Array.from(runtime.records.values())
    .filter((current) => current.host === host)
    .map(({ record: current }) => current)
    .filter(
      (current) =>
        ((current.typeName === "message" && !!current.options.btn) ||
          (current.typeName !== "message" &&
            current.typeName !== "loading" &&
            current.typeName !== "tips")) &&
        current.lifecycle !== "removed"
    )
    .sort((left, right) => right.zIndex - left.zIndex)[0];
  const shouldRestoreFocus =
    !!record.root?.contains(doc.activeElement) || topmost === record;
  host.flush(() => host.store.remove(index));
  runtime.records.delete(index);
  record.lifecycle = "removed";
  let callbackError: unknown;
  if (runEnd && !record.endCalled) {
    record.endCalled = true;
    try {
      record.options.end?.();
    } catch (error) {
      callbackError = error;
    }
  }
  record.closeCallbacks.splice(0).forEach((callback) => {
    try {
      callback();
    } catch (error) {
      callbackError ??= error;
    }
  });
  try {
    if (shouldRestoreFocus && record.previousFocus?.isConnected)
      record.previousFocus.focus();
  } catch (error) {
    callbackError ??= error;
  }
  if (callbackError) throw callbackError;
};

const openInternal = (
  options: LayerOptions,
  override?: LayerTypeName
): number => {
  if (runtime.config.injectStyles === false) {
    throw new Error(
      "config({ injectStyles: false }) is not supported by the styled-components runtime; use styleNonce for CSP"
    );
  }
  const normalized = normalizeOptions(options);
  const doc = ensureDocument(normalized.targetDocument);
  const host = getHost(doc);
  const index = runtime.nextIndex++;
  runtime.zIndex = Math.max(runtime.zIndex + 2, normalized.zIndex);
  const record: LayerInstance = {
    index,
    typeName: typeNameOf(normalized.type, override),
    options: normalized,
    lifecycle: "opening",
    openedAt: Date.now(),
    zIndex: runtime.zIndex + 1,
    root: null,
    content: null,
    title: null,
    buttons: null,
    iframe: null,
    input: null,
    followTarget: resolveFollow(normalized.follow, doc),
    previousFocus:
      doc.activeElement instanceof (doc.defaultView?.HTMLElement ?? HTMLElement)
        ? (doc.activeElement as HTMLElement)
        : null,
    movedContent: null,
    windowState: "normal",
    style: {},
    restoreStyle: null,
    closeCallbacks: [],
    timer: null,
    closeTimer: null,
    endCalled: false,
    successCalled: false,
    activeTab: 0,
  };
  try {
    record.movedContent = prepareMovedContent(normalized.content, index);
    runtime.records.set(index, { host, record });
    if (!normalized.scrollbar) lockScroll(doc);
    record.lifecycle = "open";
    host.flush(() => host.store.add(record));
    if (!record.root)
      throw new Error("layer-esm failed to render the layer host");
    if (normalized.timeMs > 0) {
      record.timer = doc.defaultView!.setTimeout(
        () => close(index),
        normalized.timeMs
      );
    }
    if (!record.successCalled) {
      record.successCalled = true;
      normalized.success?.(record.root, index);
    }
    return index;
  } catch (error) {
    if (runtime.records.has(index)) finishClose(index, false);
    else restoreMovedContent(record);
    throw error;
  }
};

export const config = (options: LayerConfigOptions = {}) => {
  if (options.injectStyles === false) {
    throw new Error(
      "config({ injectStyles: false }) is incompatible with styled-components; configure styleNonce instead"
    );
  }
  runtime.config = { ...runtime.config, ...options };
  runtime.hosts.forEach((host) => host.updateConfig(hostConfig()));
  return layer;
};

export const ready = (callback?: () => void) => {
  getHost(ensureDocument());
  callback?.();
  return layer;
};

export const open = (options: LayerOptions = {}): number =>
  openInternal(options);

export const setTop = (indexOrElement: number | HTMLElement): number => {
  const index =
    typeof indexOrElement === "number"
      ? indexOrElement
      : Number(
          indexOrElement.dataset.index ??
            indexOrElement.closest(".layer-esm")?.getAttribute("data-index")
        );
  const entry = runtime.records.get(index);
  if (!entry) return runtime.zIndex;
  runtime.zIndex = Math.max(runtime.zIndex + 2, entry.record.options.zIndex);
  entry.record.zIndex = runtime.zIndex + 1;
  entry.host.flush(() => entry.host.store.touch());
  return runtime.zIndex;
};

export const title = (name: string, index = runtime.nextIndex - 1): void => {
  const entry = runtime.records.get(index);
  if (!entry || !entry.record.options.title) return;
  entry.record.options.title = { ...entry.record.options.title, text: name };
  entry.host.flush(() => entry.host.store.touch());
};

export const style = (index: number, options: LayerStyleOptions): void => {
  const entry = runtime.records.get(index);
  if (!entry) return;
  const normalize = (value: string | number | undefined) =>
    typeof value === "number" ? `${value}px` : value;
  Object.entries(options).forEach(([key, value]) => {
    (entry.record.style as Record<string, unknown>)[key] = normalize(
      value as string | number | undefined
    );
  });
  entry.host.flush(() => entry.host.store.touch());
};

export const getChildFrame = (
  selector: string,
  index = runtime.nextIndex - 1
): HTMLElement | null => {
  try {
    return (
      runtime.records
        .get(index)
        ?.record.iframe?.contentDocument?.querySelector<HTMLElement>(
          selector
        ) ?? null
    );
  } catch {
    return null;
  }
};

export const getFrameIndex = (name: string): number | null => {
  for (const [index, { record }] of runtime.records)
    if (record.iframe?.name === name || record.iframe?.id === name)
      return index;
  return null;
};

export const iframeAuto = (index: number): void => {
  const record = runtime.records.get(index)?.record;
  try {
    const body = record?.iframe?.contentDocument?.body;
    if (!record?.iframe || !record.root || !body) return;
    record.iframe.style.height = `${body.scrollHeight}px`;
    record.root.style.height = `${
      body.scrollHeight +
      (record.title?.offsetHeight ?? 0) +
      (record.buttons?.offsetHeight ?? 0)
    }px`;
  } catch {
    return;
  }
};

export const iframeSrc = (index: number, url: string): void => {
  const iframe = runtime.records.get(index)?.record.iframe;
  if (iframe) iframe.src = url;
};

const reflowMinimized = (): void => {
  const leftByDocument = new Map<Document, number>();
  runtime.minimized.forEach((index) => {
    const entry = runtime.records.get(index);
    if (!entry) return;
    const doc = entry.host.document;
    const left = leftByDocument.get(doc) ?? 0;
    entry.record.style.left = entry.record.options.minStack
      ? `${left}px`
      : "0px";
    if (entry.record.options.minStack)
      leftByDocument.set(doc, left + MINIMIZED_WIDTH + 8);
    entry.host.flush(() => entry.host.store.touch());
  });
};

export const min = (
  index: number,
  options: Partial<LayerOptions> = {}
): void => {
  const entry = runtime.records.get(index);
  if (!entry || entry.record.windowState === "minimized") return;
  if (entry.record.windowState === "full") restore(index);
  const record = entry.record;
  record.options.minStack = options.minStack ?? record.options.minStack;
  record.restoreStyle = captureWindowStyle(record);
  record.windowState = "minimized";
  record.style = {
    ...record.style,
    transform: "",
    width: `${MINIMIZED_WIDTH}px`,
    height: `${record.title?.offsetHeight ?? 52}px`,
    left: "0px",
    right: "",
    top: "",
    bottom: "0",
    position: "fixed",
  };
  runtime.minimized.push(index);
  entry.host.flush(() => entry.host.store.touch());
  reflowMinimized();
  record.root?.focus();
};

export const restore = (index: number): void => {
  const entry = runtime.records.get(index);
  if (
    !entry ||
    entry.record.windowState === "normal" ||
    !entry.record.restoreStyle
  )
    return;
  entry.record.style = entry.record.restoreStyle;
  entry.record.restoreStyle = null;
  entry.record.windowState = "normal";
  const position = runtime.minimized.indexOf(index);
  if (position >= 0) runtime.minimized.splice(position, 1);
  entry.host.flush(() => entry.host.store.touch());
  reflowMinimized();
};

export const full = (index: number): void => {
  const entry = runtime.records.get(index);
  if (!entry || entry.record.windowState === "full") return;
  if (entry.record.windowState === "minimized") restore(index);
  entry.record.restoreStyle = captureWindowStyle(entry.record);
  entry.record.windowState = "full";
  entry.record.style = {
    ...entry.record.style,
    transform: "",
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    width: "100vw",
    height: "100vh",
    maxWidth: "none",
    maxHeight: "none",
  };
  entry.host.flush(() => entry.host.store.touch());
};

export const close = (index: number, callback?: () => void): void => {
  const entry = runtime.records.get(index);
  if (!entry) {
    callback?.();
    return;
  }
  if (entry.record.lifecycle === "closing") return;
  if (callback) entry.record.closeCallbacks.push(callback);
  entry.record.lifecycle = "closing";
  entry.host.flush(() => entry.host.store.touch());
  if (entry.record.options.isOutAnim) {
    entry.record.closeTimer = entry.host.document.defaultView!.setTimeout(
      () => finishClose(index),
      CLOSE_ANIMATION_MS
    );
  } else finishClose(index);
};

export const closeAll = (
  type?: string | (() => void),
  callback?: () => void
): void => {
  const target = typeof type === "string" ? type : undefined;
  const done = typeof type === "function" ? type : callback;
  const records = Array.from(runtime.records.values())
    .map(({ record }) => record)
    .filter(
      (record) =>
        !target ||
        record.typeName === target ||
        (target === "dialog" && record.typeName === "message")
    )
    .sort((left, right) => right.zIndex - left.zIndex);
  if (!records.length) {
    done?.();
    return;
  }
  let remaining = records.length;
  let closeError: unknown;
  const onClosed = () => {
    remaining -= 1;
    if (remaining === 0) done?.();
  };
  records.forEach((record) => {
    try {
      if (record.lifecycle === "closing") record.closeCallbacks.push(onClosed);
      else close(record.index, onClosed);
    } catch (error) {
      closeError ??= error;
    }
  });
  if (closeError) throw closeError;
};

export const alert = (
  content: string,
  options?: LayerOptions | ((index: number, layero: HTMLElement) => void),
  yes?: (index: number, layero: HTMLElement) => void
): number => {
  const callbackOnly = typeof options === "function";
  return open({
    content,
    btn: ["OK"],
    ...(callbackOnly ? {} : options),
    yes: callbackOnly ? options : yes,
  });
};

export const confirm = (
  content: string,
  options?: LayerOptions | ((index: number, layero: HTMLElement) => void),
  yes?: (index: number, layero: HTMLElement) => void,
  cancel?: (index: number, layero: HTMLElement) => void
): number => {
  const callbackOnly = typeof options === "function";
  return open({
    content,
    btn: ["OK", "Cancel"],
    ...(callbackOnly ? {} : options),
    yes: callbackOnly ? options : yes,
    btn2: callbackOnly ? yes : cancel,
  });
};

export const msg = (
  content: string,
  options?: LayerOptions | (() => void),
  end?: () => void
): number => {
  const callbackOnly = typeof options === "function";
  const settings = callbackOnly ? {} : options ?? {};
  return openInternal(
    {
      ...settings,
      type: 0,
      title: false,
      content,
      shade: settings.shade ?? false,
      closeBtn: false,
      move: false,
      resize: false,
      time: settings.time ?? 3,
      end: callbackOnly ? options : end ?? settings.end,
    },
    "message"
  );
};

export const load = (icon = 0, options: LayerOptions = {}): number =>
  openInternal({
    type: 3,
    shade: 0.01,
    title: false,
    closeBtn: false,
    btn: false,
    resize: false,
    icon,
    ...options,
  });

export const tips = (
  content: string,
  follow: string | HTMLElement,
  options: LayerTipsOptions = {}
): number =>
  openInternal({
    type: 4,
    content,
    follow,
    shade: false,
    title: false,
    closeBtn: false,
    btn: false,
    resize: false,
    ...options,
  });

const escapeHTML = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        character
      ] ?? character)
  );

export const prompt = (
  options: LayerPromptOptions = {},
  yes?: (
    value: string,
    index: number,
    input: HTMLInputElement | HTMLTextAreaElement
  ) => void
): number => {
  const maxlength = options.maxlength ?? 500;
  const index = open({
    ...options,
    type: 1,
    skin: ["layui-layer-prompt", options.skin].filter(Boolean).join(" "),
    content: "",
    btn: ["OK", "Cancel"],
    yes: (current) => {
      const record = runtime.records.get(current)?.record;
      const input = record?.input;
      if (!input) return;
      const value = input.value;
      if (!value.trim()) {
        input.focus();
        return;
      }
      if (value.length > maxlength) {
        const message =
          typeof options.maxlengthMessage === "function"
            ? options.maxlengthMessage(maxlength, value)
            : options.maxlengthMessage ?? `Enter up to ${maxlength} characters`;
        tips(escapeHTML(message), input, {
          tips: [1, "#111827"],
          time: 2,
          targetDocument: input.ownerDocument,
        });
        return;
      }
      yes?.(value, current, input);
    },
  });
  return index;
};

export const tab = (options: LayerTabOptions): number => {
  if (options.tab.length === 0)
    throw new Error("tab() requires at least one tab item");
  return open({
    ...options,
    type: 1,
    skin: ["layui-layer-tab", options.skin].filter(Boolean).join(" "),
    content: "",
  });
};

export const destroy = (targetDocument?: Document): void => {
  const hosts = targetDocument
    ? ([runtime.hosts.get(targetDocument)].filter(
        Boolean
      ) as LayerDocumentHost[])
    : Array.from(runtime.hosts.values());
  let callbackError: unknown;
  hosts.forEach((host) => {
    runtime.hosts.delete(host.document);
    host.store.values().forEach((record) => {
      record.options.isOutAnim = false;
      try {
        close(record.index);
      } catch (error) {
        callbackError ??= error;
      }
    });
    host.destroy();
  });
  if (callbackError) throw callbackError;
};

const layer = {
  v: "5.0.0-react",
  get index() {
    return runtime.nextIndex;
  },
  get zIndex() {
    return runtime.zIndex;
  },
  config,
  ready,
  open,
  close,
  closeAll,
  alert,
  confirm,
  msg,
  load,
  tips,
  prompt,
  tab,
  title,
  style,
  setTop,
  getChildFrame,
  getFrameIndex,
  iframeAuto,
  iframeSrc,
  min,
  restore,
  full,
  destroy,
};

export default layer;
