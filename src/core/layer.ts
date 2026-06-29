import type {
  LayerOptions,
  LayerPromptOptions,
  LayerRecord,
  LayerStyleOptions,
  LayerTabOptions,
  LayerTipsOptions,
  LayerType,
  MovedContentState,
  NormalizedLayerOptions,
} from "./types";
import { createDialogIcon, createLoadingContent, createTipBubble } from "../components/render";
import { injectStyle } from "../styles/inject";
import { layerTheme } from "../styles/theme";
import {
  LEGACY_PREFIX, PREFIX, addEvent, appendHTML, createElement, ensureDocument, isHTMLElement, normalizeUnit, resolveElement, setText, 
} from "../utils/dom";
import {
  applyOffset, applyTipsPlacement, normalizeArea, normalizeShade, 
} from "../utils/position";

const TYPE_NAMES = [ "dialog", "page", "iframe", "loading", "tips" ] as const;
const DIALOG_PADDING_CLASS = `${PREFIX}__dialog-content`;
const CLOSE_ANIMATION_MS = 180;
const MINIMIZED_WIDTH = 180;

const state = {
  nextIndex: 0,
  zIndex: 19891014,
  globalConfig: {} as Partial<LayerOptions>,
  instances: new Map<number, LayerRecord>(),
  bodyLocks: 0,
};

const baseOptions: LayerOptions = {
  type: 0,
  title: "Information",
  content: "",
  shade: 0.3,
  shadeClose: false,
  fixed: true,
  move: `${PREFIX}__title`,
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
  tips: [ 2, "#111827" ],
  follow: undefined,
  formType: 0,
  value: "",
  maxlength: 500,
  success: undefined,
  end: undefined,
  yes: undefined,
  btn2: undefined,
  cancel: undefined,
  change: undefined,
  tab: undefined,
};

const shallowMerge = <T extends object>(...values: Array<Partial<T> | undefined>): T => {
  return Object.assign({}, ...values) as T;
};

const normalizeTitle = (title: LayerOptions["title"]): NormalizedLayerOptions["title"] => {
  if (title === false) {
    return false;
  }

  if (Array.isArray(title)) {
    return {
      text: title[0],
      style: title[1],
    };
  }

  return {
    text: title ?? "Information",
  };
};

const normalizeButtons = (buttons: LayerOptions["btn"]): string[] | false => {
  if (buttons === false || buttons === undefined || buttons === null) {
    return false;
  }

  return Array.isArray(buttons) ? buttons : [ buttons ];
};

const normalizeTips = (tips: LayerOptions["tips"]): [1 | 2 | 3 | 4, string] => {
  if (Array.isArray(tips)) {
    return [ tips[0], tips[1] ?? "#111827" ];
  }

  return [ tips ?? 2, "#111827" ];
};

const normalizeOptions = (options: LayerOptions): NormalizedLayerOptions => {
  const merged: LayerOptions = {
    ...baseOptions,
    ...state.globalConfig,
    ...options,
  };

  return {
    ...baseOptions,
    ...merged,
    type: (merged.type ?? 0) as LayerType,
    title: normalizeTitle(merged.title),
    shade: normalizeShade(merged.shade),
    area: normalizeArea(merged.area),
    tips: normalizeTips(merged.tips),
    btn: normalizeButtons(merged.btn),
    fixed: merged.fixed ?? true,
    move: merged.move ?? `${PREFIX}__title`,
    moveType: merged.moveType ?? 1,
    resize: merged.resize ?? true,
    closeBtn: merged.closeBtn ?? 1,
    timeMs: Math.max((merged.time ?? 0) * 1000, 0),
    zIndex: merged.zIndex ?? 19891014,
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
  };
};

const ensureStyleReady = (): void => {
  injectStyle(layerTheme);
};

const typeNameOf = (type: LayerType): LayerRecord["typeName"] => {
  return TYPE_NAMES[type];
};

const lockScroll = (): void => {
  state.bodyLocks += 1;
  ensureDocument().documentElement.style.overflow = "hidden";
};

const unlockScroll = (): void => {
  state.bodyLocks = Math.max(state.bodyLocks - 1, 0);

  if (state.bodyLocks === 0) {
    ensureDocument().documentElement.style.overflow = "";
  }
};

const createMovedContentState = (node: HTMLElement): MovedContentState => {
  const placeholder = ensureDocument().createComment("layer-esm-placeholder");
  const originalParent = node.parentNode;

  if (!originalParent) {
    throw new Error("Cannot move detached content into layer.");
  }

  originalParent.insertBefore(placeholder, node);

  return {
    node,
    originalParent,
    originalNextSibling: node.nextSibling,
    placeholder,
  };
};

const restoreMovedContent = (record: LayerRecord): void => {
  if (!record.movedContent) {
    return;
  }

  const { node, originalParent, placeholder } = record.movedContent;
  originalParent.insertBefore(node, placeholder);
  placeholder.remove();
  record.movedContent = null;
};

const updateZIndex = (record: LayerRecord): void => {
  state.zIndex += 2;
  if (record.shade) {
    record.shade.style.zIndex = `${state.zIndex}`;
  }
  record.root.style.zIndex = `${state.zIndex + 1}`;
};

const setLayerSize = (record: LayerRecord, style: LayerStyleOptions): void => {
  const { root, iframe } = record;

  if (style.width !== undefined) {
    root.style.width = normalizeUnit(style.width) ?? "";
  }
  if (style.height !== undefined) {
    root.style.height = normalizeUnit(style.height) ?? "";
  }
  if (style.top !== undefined) {
    root.style.top = normalizeUnit(style.top) ?? "";
  }
  if (style.left !== undefined) {
    root.style.left = normalizeUnit(style.left) ?? "";
  }
  if (style.right !== undefined) {
    root.style.right = normalizeUnit(style.right) ?? "";
  }
  if (style.bottom !== undefined) {
    root.style.bottom = normalizeUnit(style.bottom) ?? "";
  }
  if (style.position !== undefined) {
    root.style.position = style.position;
  }
  if (style.overflow !== undefined) {
    root.style.overflow = style.overflow;
  }

  if (iframe && root.style.height) {
    iframe.style.height = "100%";
  }
};

const applyRootLayout = (record: LayerRecord): void => {
  const { options, root, typeName } = record;
  const [ width, height ] = options.area;

  root.style.position = options.fixed ? "fixed" : "absolute";
  root.style.maxWidth = `${options.maxWidth}px`;

  if (width) {
    root.style.width = width;
  }

  if (height) {
    root.style.height = height;
  }

  if (typeName === "loading") {
    root.style.maxHeight = "none";
  }
};

const applyPlacement = (record: LayerRecord): void => {
  if (record.typeName === "tips" && record.followTarget) {
    applyTipsPlacement(record.root, record.followTarget, record.options.tips[0], record.options.fixed);
    return;
  }

  applyOffset(record.root, record.options.offset, record.options.fixed);
};

const bindDrag = (record: LayerRecord): void => {
  const { options, root } = record;

  if (!options.move) {
    return;
  }

  const handle = options.move === true
    ? record.title
    : typeof options.move === "string"
      ? root.querySelector<HTMLElement>(`.${options.move.replace(/^\./, "")}`) ?? root.querySelector<HTMLElement>(options.move)
      : record.title;

  if (!handle) {
    return;
  }

  handle.style.cursor = "move";

  const onPointerDown = (event: Event): void => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) {
      return;
    }

    updateZIndex(record);

    const rect = root.getBoundingClientRect();
    const startX = mouseEvent.clientX - rect.left;
    const startY = mouseEvent.clientY - rect.top;

    root.style.transform = "";
    root.style.left = `${rect.left + (options.fixed ? 0 : window.scrollX)}px`;
    root.style.top = `${rect.top + (options.fixed ? 0 : window.scrollY)}px`;
    root.style.right = "";
    root.style.bottom = "";

    const removeMove = addEvent(document, "mousemove", (moveEvent: Event) => {
      const pointer = moveEvent as MouseEvent;
      root.style.left = `${pointer.clientX - startX + (options.fixed ? 0 : window.scrollX)}px`;
      root.style.top = `${pointer.clientY - startY + (options.fixed ? 0 : window.scrollY)}px`;
    });
    const removeUp = addEvent(document, "mouseup", () => {
      removeMove();
      removeUp();
    });
  };

  record.cleanup.push(addEvent(handle, "mousedown", onPointerDown));
};

const bindResize = (record: LayerRecord): void => {
  const { options, root } = record;

  if (!options.resize || record.typeName === "tips" || record.typeName === "loading") {
    return;
  }

  const handle = createElement(ensureDocument(), "span", [ `${PREFIX}__resize-handle` ]);
  root.appendChild(handle);

  const onMouseDown = (event: Event): void => {
    const mouseEvent = event as MouseEvent;
    mouseEvent.preventDefault();
    updateZIndex(record);

    const rect = root.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startX = mouseEvent.clientX;
    const startY = mouseEvent.clientY;

    const removeMove = addEvent(document, "mousemove", (moveEvent: Event) => {
      const pointer = moveEvent as MouseEvent;
      root.style.width = `${Math.max(pointer.clientX - startX + startWidth, 260)}px`;
      root.style.height = `${Math.max(pointer.clientY - startY + startHeight, 120)}px`;
    });
    const removeUp = addEvent(document, "mouseup", () => {
      removeMove();
      removeUp();
    });
  };

  record.cleanup.push(addEvent(handle, "mousedown", onMouseDown));
};

const createToolbarButton = (doc: Document, type: "close" | "min" | "max"): HTMLButtonElement => {
  const button = createElement(doc, "button", [ `${PREFIX}__toolbar-button`, `${PREFIX}__toolbar-button--${type}` ]);
  button.type = "button";
  button.setAttribute("aria-label", type);
  return button;
};

const renderContent = (record: LayerRecord, rawContent: LayerOptions["content"]): void => {
  const { options, content } = record;
  const doc = ensureDocument();

  if (record.typeName === "dialog") {
    const dialog = createElement(doc, "div", [ `${PREFIX}__dialog` ]);
    const dialogContent = createElement(doc, "div", [ DIALOG_PADDING_CLASS ]);

    if (typeof options.icon === "number" && options.icon >= 0) {
      dialogContent.appendChild(createDialogIcon(doc, options.icon));
    }

    const text = createElement(doc, "div");
    if (typeof rawContent === "string") {
      appendHTML(text, rawContent);
    } else if (isHTMLElement(rawContent)) {
      record.movedContent = createMovedContentState(rawContent);
      text.appendChild(rawContent);
    } else {
      appendHTML(text, String(rawContent ?? ""));
    }

    dialogContent.appendChild(text);
    dialog.appendChild(dialogContent);
    content.appendChild(dialog);
    return;
  }

  if (record.typeName === "loading") {
    const loading = createLoadingContent(doc, Math.max(options.icon ?? 0, 0), typeof rawContent === "string" ? rawContent : "");
    content.appendChild(loading);
    return;
  }

  if (record.typeName === "iframe") {
    const iframe = createElement(doc, "iframe", [ `${PREFIX}__iframe` ]);
    iframe.src = Array.isArray(rawContent) ? rawContent[0] : String(rawContent ?? "");
    iframe.scrolling = Array.isArray(rawContent) && typeof rawContent[1] === "string" ? rawContent[1] : "auto";
    iframe.setAttribute("allowtransparency", "true");
    iframe.name = `${LEGACY_PREFIX}-iframe${record.index}`;
    iframe.id = `${LEGACY_PREFIX}-iframe${record.index}`;
    record.iframe = iframe;
    content.appendChild(iframe);
    return;
  }

  if (record.typeName === "tips") {
    const bubbleContent = Array.isArray(rawContent) ? rawContent[0] : String(rawContent ?? "");
    content.appendChild(createTipBubble(doc, bubbleContent, options.tips[0]));
    return;
  }

  if (isHTMLElement(rawContent)) {
    record.movedContent = createMovedContentState(rawContent);
    content.appendChild(rawContent);
    return;
  }

  appendHTML(content, typeof rawContent === "string" ? rawContent : String(rawContent ?? ""));
};

const bindButtons = (record: LayerRecord): void => {
  const { options, buttons } = record;
  if (!buttons || !options.btn) {
    return;
  }

  Array.from(buttons.querySelectorAll<HTMLButtonElement>("button")).forEach((button, index) => {
    record.cleanup.push(addEvent(button, "click", () => {
      if (index === 0) {
        options.yes?.(record.index, record.root);
        if (!options.yes) {
          close(record.index);
        }
        return;
      }

      const handled = options.btn2?.(record.index, record.root);
      if (handled === false) {
        return;
      }
      {
        close(record.index);
      }
    }));
  });
};

const createRecord = (options: NormalizedLayerOptions): LayerRecord => {
  const doc = ensureDocument();
  const index = state.nextIndex++;
  const typeName = typeNameOf(options.type);
  const shade = options.shade ? createElement(doc, "div", [ `${PREFIX}-shade`, `${LEGACY_PREFIX}-shade` ]) : null;
  const root = createElement(doc, "div", [
    PREFIX,
    `${PREFIX}--${typeName}`,
    `${PREFIX}--anim-${options.anim}`,
    `${LEGACY_PREFIX}`,
    `${LEGACY_PREFIX}-${typeName}`,
    ...(options.skin ? options.skin.split(/\s+/).filter(Boolean) : []),
    ...(options.className ? options.className.split(/\s+/).filter(Boolean) : []),
  ]);
  const title = options.title ? createElement(doc, "div", [ `${PREFIX}__title`, `${LEGACY_PREFIX}-title` ]) : null;
  const content = createElement(doc, "div", [ `${PREFIX}__content`, `${LEGACY_PREFIX}-content` ]);
  const buttons = options.btn ? createElement(doc, "div", [
    `${PREFIX}__buttons`,
    `${PREFIX}__buttons--${options.btnAlign || "r"}`,
    `${LEGACY_PREFIX}-btn`,
    `${LEGACY_PREFIX}-btn-${options.btnAlign || "r"}`,
  ]) : null;
  const toolbar = createElement(doc, "div", [ `${PREFIX}__toolbar`, `${LEGACY_PREFIX}-setwin` ]);
  const closeButton = options.closeBtn ? createToolbarButton(doc, "close") : null;
  const minButton = options.maxmin ? createToolbarButton(doc, "min") : null;
  const maxButton = options.maxmin ? createToolbarButton(doc, "max") : null;

  if (shade && options.shade) {
    shade.style.background = options.shadeStyle || options.shade.color;
    shade.style.opacity = `${options.shade.opacity}`;
    shade.dataset.index = `${index}`;
  }

  root.dataset.index = `${index}`;
  root.dataset.type = typeName;
  root.id = options.id || `${LEGACY_PREFIX}${index}`;

  if (title && options.title) {
    setText(title, options.title.text);
    if (options.title.style) {
      title.style.cssText += options.title.style;
    }
  }

  if (minButton) {
    toolbar.appendChild(minButton);
  }
  if (maxButton) {
    toolbar.appendChild(maxButton);
  }
  if (closeButton) {
    toolbar.appendChild(closeButton);
  }
  if (toolbar.childElementCount > 0) {
    root.appendChild(toolbar);
  }

  if (title) {
    root.appendChild(title);
  }

  const record: LayerRecord = {
    index,
    options,
    typeName,
    root,
    shade,
    title,
    content,
    buttons,
    closeButton,
    iframe: null,
    movedContent: null,
    cleanup: [],
    timer: null,
    followTarget: resolveElement(typeof options.follow === "string" ? options.follow : options.follow, doc),
    restoreCssText: null,
    minimized: false,
    lockedScroll: !options.scrollbar,
  };

  renderContent(record, options.content);
  root.appendChild(content);

  if (buttons && options.btn) {
    options.btn.forEach((label, buttonIndex) => {
      const button = createElement(doc, "button", [
        `${PREFIX}__button`,
        `${LEGACY_PREFIX}-btn${buttonIndex}`,
        ...(buttonIndex === 0 ? [ `${PREFIX}__button--primary` ] : []),
      ]);
      button.type = "button";
      setText(button, label);
      buttons.appendChild(button);
    });
    root.appendChild(buttons);
  }

  return record;
};

const mountRecord = (record: LayerRecord): void => {
  const doc = ensureDocument();

  if (record.lockedScroll) {
    lockScroll();
  }

  updateZIndex(record);
  applyRootLayout(record);

  if (record.shade) {
    doc.body.appendChild(record.shade);
  }
  doc.body.appendChild(record.root);
  applyPlacement(record);

  if (record.closeButton) {
    record.cleanup.push(addEvent(record.closeButton, "click", () => {
      const result = record.options.cancel?.(record.index, record.root);
      if (result !== false) {
        close(record.index);
      }
    }));
  }

  if (record.shade && record.options.shadeClose) {
    record.cleanup.push(addEvent(record.shade, "click", () => {
      const result = record.options.cancel?.(record.index, record.root);
      if (result !== false) {
        close(record.index);
      }
    }));
  }

  record.cleanup.push(addEvent(record.root, "mousedown", () => {
    updateZIndex(record);
  }));

  bindButtons(record);
  bindDrag(record);
  bindResize(record);

  if (record.typeName === "tips" && record.followTarget) {
    const relocate = (): void => applyPlacement(record);
    record.cleanup.push(addEvent(window, "resize", relocate));
    record.cleanup.push(addEvent(window, "scroll", relocate, { passive: true }));
  }

  if (record.options.timeMs > 0) {
    record.timer = window.setTimeout(() => {
      close(record.index);
    }, record.options.timeMs);
  }

  record.options.success?.(record.root, record.index);
};

const removeRecord = (record: LayerRecord): void => {
  record.cleanup.forEach((cleanup) => cleanup());
  record.cleanup = [];

  if (record.timer) {
    window.clearTimeout(record.timer);
    record.timer = null;
  }

  restoreMovedContent(record);
  record.shade?.remove();
  record.root.remove();

  if (record.lockedScroll) {
    unlockScroll();
  }
};

export const config = (options: Partial<LayerOptions> = {}) => {
  state.globalConfig = shallowMerge(state.globalConfig, options);
  ensureStyleReady();
  return layer;
};

export const ready = (callback?: () => void) => {
  ensureStyleReady();
  callback?.();
  return layer;
};

export const open = (options: LayerOptions = {}): number => {
  ensureStyleReady();
  const normalized = normalizeOptions(options);
  const record = createRecord(normalized);
  state.instances.set(record.index, record);
  mountRecord(record);
  return record.index;
};

export const setTop = (indexOrElement: number | HTMLElement): number => {
  const record = typeof indexOrElement === "number"
    ? state.instances.get(indexOrElement)
    : state.instances.get(Number(indexOrElement.dataset.index ?? indexOrElement.closest(`.${PREFIX}`)?.getAttribute("data-index")));

  if (!record) {
    return state.zIndex;
  }

  updateZIndex(record);
  return state.zIndex;
};

export const title = (name: string, index = state.nextIndex - 1): void => {
  const record = state.instances.get(index);
  if (!record?.title) {
    return;
  }

  appendHTML(record.title, name);
};

export const style = (index: number, options: LayerStyleOptions): void => {
  const record = state.instances.get(index);
  if (!record) {
    return;
  }

  setLayerSize(record, options);
};

export const getChildFrame = (selector: string, index = state.nextIndex - 1): HTMLElement | null => {
  const record = state.instances.get(index);
  return record?.iframe?.contentDocument?.querySelector<HTMLElement>(selector) ?? null;
};

export const getFrameIndex = (name: string): number | null => {
  const record = Array.from(state.instances.values()).find((item) => item.iframe?.name === name || item.iframe?.id === name);
  return record ? record.index : null;
};

export const iframeAuto = (index: number): void => {
  const record = state.instances.get(index);
  const body = record?.iframe?.contentDocument?.body;

  if (!record || !record.iframe || !body) {
    return;
  }

  record.iframe.style.height = `${body.scrollHeight}px`;
  record.root.style.height = `${body.scrollHeight + (record.title?.offsetHeight ?? 0) + (record.buttons?.offsetHeight ?? 0)}px`;
};

export const iframeSrc = (index: number, url: string): void => {
  const record = state.instances.get(index);
  if (record?.iframe) {
    record.iframe.src = url;
  }
};

export const min = (index: number, options: Partial<LayerOptions> = {}): void => {
  const record = state.instances.get(index);
  if (!record || record.minimized) {
    return;
  }

  record.restoreCssText = record.root.style.cssText;
  record.minimized = true;
  record.content.style.display = "none";
  if (record.buttons) {
    record.buttons.style.display = "none";
  }
  if (record.shade) {
    record.shade.style.display = "none";
  }

  const position = state.instances.size - 1;
  const stackLeft = options.minStack === false ? 0 : position * (MINIMIZED_WIDTH + 8);

  record.root.style.transform = "";
  record.root.style.width = `${MINIMIZED_WIDTH}px`;
  record.root.style.height = `${record.title?.offsetHeight ?? 52}px`;
  record.root.style.left = `${stackLeft}px`;
  record.root.style.right = "";
  record.root.style.top = "";
  record.root.style.bottom = "0";
  record.root.style.position = "fixed";
};

export const restore = (index: number): void => {
  const record = state.instances.get(index);
  if (!record || !record.minimized || !record.restoreCssText) {
    return;
  }

  record.root.style.cssText = record.restoreCssText;
  record.content.style.display = "";
  if (record.buttons) {
    record.buttons.style.display = "";
  }
  if (record.shade) {
    record.shade.style.display = "";
  }
  record.minimized = false;
  record.restoreCssText = null;
};

export const full = (index: number): void => {
  const record = state.instances.get(index);
  if (!record) {
    return;
  }

  record.restoreCssText = record.root.style.cssText;
  record.root.style.transform = "";
  record.root.style.position = "fixed";
  record.root.style.top = "0";
  record.root.style.left = "0";
  record.root.style.right = "0";
  record.root.style.bottom = "0";
  record.root.style.width = "100vw";
  record.root.style.height = "100vh";
  if (record.lockedScroll) {
    lockScroll();
  }
};

export const close = (index: number, callback?: () => void): void => {
  const record = state.instances.get(index);
  if (!record) {
    callback?.();
    return;
  }

  const finish = (): void => {
    removeRecord(record);
    state.instances.delete(index);
    record.options.end?.();
    callback?.();
  };

  if (record.options.isOutAnim) {
    record.root.classList.add(`${PREFIX}--closing`);
    window.setTimeout(finish, CLOSE_ANIMATION_MS);
    return;
  }

  finish();
};

export const closeAll = (type?: string | (() => void), callback?: () => void): void => {
  let targetType = type;
  let done = callback;

  if (typeof type === "function") {
    done = type;
    targetType = undefined;
  }

  const records = Array.from(state.instances.values()).filter((record) => !targetType || record.typeName === targetType);

  records.forEach((record, index) => {
    close(record.index, index === records.length - 1 ? done : undefined);
  });

  if (records.length === 0) {
    done?.();
  }
};

export const alert = (content: string, options?: LayerOptions | ((index: number, layero: HTMLElement) => void), yes?: (index: number, layero: HTMLElement) => void): number => {
  const isCallbackOnly = typeof options === "function";
  return open({
    content,
    ...(isCallbackOnly ? {} : options),
    yes: isCallbackOnly ? options : yes,
  });
};

export const confirm = (
  content: string,
  options?: LayerOptions | ((index: number, layero: HTMLElement) => void),
  yes?: (index: number, layero: HTMLElement) => void,
  cancel?: (index: number, layero: HTMLElement) => void,
): number => {
  const isCallbackOnly = typeof options === "function";
  return open({
    content,
    btn: [ "确定", "取消" ],
    ...(isCallbackOnly ? {} : options),
    yes: isCallbackOnly ? options : yes,
    btn2: isCallbackOnly ? yes : cancel,
  });
};

export const msg = (content: string, options?: LayerOptions | (() => void), end?: () => void): number => {
  const isEndOnly = typeof options === "function";
  return open({
    content,
    title: false,
    closeBtn: false,
    btn: false,
    shade: false,
    resize: false,
    skin: `${PREFIX}--message`,
    time: 3,
    ...(isEndOnly ? {} : options),
    end: isEndOnly ? options : end,
  });
};

export const load = (icon = 0, options: LayerOptions = {}): number => {
  return open({
    type: 3,
    shade: 0.01,
    title: false,
    closeBtn: false,
    btn: false,
    resize: false,
    icon,
    ...options,
  });
};

export const tips = (content: string, follow: string | HTMLElement, options: LayerTipsOptions = {}): number => {
  return open({
    type: 4,
    content: [ content, typeof follow === "string" ? follow : follow ],
    follow,
    shade: false,
    title: false,
    closeBtn: false,
    btn: false,
    resize: false,
    ...options,
  });
};

export const prompt = (options: LayerPromptOptions = {}, yes?: (value: string, index: number, input: HTMLInputElement | HTMLTextAreaElement) => void): number => {
  const doc = ensureDocument();
  const input = options.formType === 2
    ? createElement(doc, "textarea", [ `${PREFIX}__textarea`, "layui-layer-input" ])
    : createElement(doc, "input", [ `${PREFIX}__input`, "layui-layer-input" ]);

  if (input instanceof HTMLInputElement) {
    input.type = options.formType === 1 ? "password" : "text";
    input.value = options.value ?? "";
  } else {
    input.value = options.value ?? "";
  }

  return open({
    ...options,
    type: 1,
    skin: [ "layui-layer-prompt", options.skin ].filter(Boolean).join(" "),
    content: input,
    btn: [ "确定", "取消" ],
    yes: (index) => {
      const value = input.value;
      if (!value.trim()) {
        input.focus();
        return;
      }
      if (value.length > (options.maxlength ?? 500)) {
        tips(`最多输入 ${(options.maxlength ?? 500)} 个字符`, input, { tips: [ 1, "#111827" ], time: 2 });
        return;
      }
      yes?.(value, index, input);
    },
  });
};

export const tab = (options: LayerTabOptions): number => {
  const doc = ensureDocument();
  const wrapper = createElement(doc, "div");
  const header = createElement(doc, "div", [ `${PREFIX}__tab-header` ]);
  const panels = createElement(doc, "div");

  options.tab.forEach((item, index) => {
    const trigger = createElement(doc, "button", [
      `${PREFIX}__tab-trigger`,
      ...(index === 0 ? [ `${PREFIX}__tab-trigger--active`, "layui-this" ] : []),
    ]);
    trigger.type = "button";
    trigger.textContent = item.title;
    header.appendChild(trigger);

    const panel = createElement(doc, "div", [
      `${PREFIX}__tab-panel`,
      ...(index === 0 ? [ `${PREFIX}__tab-panel--active`, "layui-this" ] : []),
    ]);
    appendHTML(panel, item.content || "no content");
    panels.appendChild(panel);
  });

  wrapper.appendChild(header);
  wrapper.appendChild(panels);

  return open({
    ...options,
    type: 1,
    skin: [ "layui-layer-tab", options.skin ].filter(Boolean).join(" "),
    content: wrapper,
    success: (layero, index) => {
      options.success?.(layero, index);
      const triggers = Array.from(layero.querySelectorAll<HTMLElement>(`.${PREFIX}__tab-trigger`));
      const tabPanels = Array.from(layero.querySelectorAll<HTMLElement>(`.${PREFIX}__tab-panel`));

      triggers.forEach((trigger, triggerIndex) => {
        addEvent(trigger, "click", () => {
          triggers.forEach((node) => node.classList.remove(`${PREFIX}__tab-trigger--active`, "layui-this"));
          tabPanels.forEach((panel) => panel.classList.remove(`${PREFIX}__tab-panel--active`, "layui-this"));
          trigger.classList.add(`${PREFIX}__tab-trigger--active`, "layui-this");
          tabPanels[triggerIndex]?.classList.add(`${PREFIX}__tab-panel--active`, "layui-this");
          options.change?.(triggerIndex);
        });
      });
    },
  });
};

const layer = {
  v: "4.0.0-esm",
  get index() {
    return state.nextIndex;
  },
  get zIndex() {
    return state.zIndex;
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
};

export default layer;
