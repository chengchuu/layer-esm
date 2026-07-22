import type {
  LayerConfigOptions,
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
import {
  createDialogIcon,
  createLoadingContent,
  createTipBubble,
} from "../components/render";
import { injectStyle } from "../styles/inject";
import { layerTheme } from "../styles/theme";
import {
  LEGACY_PREFIX,
  PREFIX,
  addEvent,
  appendHTML,
  createElement,
  ensureDocument,
  isHTMLElement,
  normalizeUnit,
  resolveElement,
  setText,
} from "../utils/dom";
import {
  applyOffset,
  applyTipsPlacement,
  normalizeArea,
  normalizeShade,
} from "../utils/position";

const TYPE_NAMES = ["dialog", "page", "iframe", "loading", "tips"] as const;
const DIALOG_PADDING_CLASS = `${PREFIX}__dialog-content`;
const CLOSE_ANIMATION_MS = 180;
const MINIMIZED_WIDTH = 180;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const state = {
  nextIndex: 0,
  zIndex: 19891014,
  globalConfig: {} as LayerConfigOptions,
  instances: new Map<number, LayerRecord>(),
  bodyLocks: 0,
  originalOverflow: null as string | null,
  movedContentOwners: new WeakMap<HTMLElement, number>(),
  minimizedOrder: [] as number[],
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
  tips: [2, "#111827"],
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

const shallowMerge = <T extends object>(
  ...values: Array<Partial<T> | undefined>
): T => {
  return Object.assign({}, ...values) as T;
};

const normalizeTitle = (
  title: LayerOptions["title"]
): NormalizedLayerOptions["title"] => {
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

  return Array.isArray(buttons) ? buttons : [buttons];
};

const normalizeTips = (tips: LayerOptions["tips"]): [1 | 2 | 3 | 4, string] => {
  if (Array.isArray(tips)) {
    return [tips[0], tips[1] ?? "#111827"];
  }

  return [tips ?? 2, "#111827"];
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
    maxWidthExplicit:
      options.maxWidth !== undefined ||
      state.globalConfig.maxWidth !== undefined,
  };
};

const resolvePromptMaxlengthMessage = (
  options: LayerPromptOptions,
  value: string
): string => {
  const maxlength = options.maxlength ?? 500;

  if (typeof options.maxlengthMessage === "function") {
    return options.maxlengthMessage(maxlength, value);
  }

  return options.maxlengthMessage ?? `Enter up to ${maxlength} characters`;
};

const escapeHTML = (value: string): string => {
  const escapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(
    /[&<>"']/g,
    (character) => escapes[character] ?? character
  );
};

const ensureStyleReady = (): void => {
  if (state.globalConfig.injectStyles !== false) {
    injectStyle(layerTheme, { nonce: state.globalConfig.styleNonce });
  }
};

const typeNameOf = (type: LayerType): LayerRecord["typeName"] => {
  return TYPE_NAMES[type];
};

const lockScroll = (): void => {
  const root = ensureDocument().documentElement;
  if (state.bodyLocks === 0) {
    state.originalOverflow = root.style.overflow;
  }
  state.bodyLocks += 1;
  root.style.overflow = "hidden";
};

const unlockScroll = (): void => {
  state.bodyLocks = Math.max(state.bodyLocks - 1, 0);

  if (state.bodyLocks === 0) {
    ensureDocument().documentElement.style.overflow =
      state.originalOverflow ?? "";
    state.originalOverflow = null;
  }
};

const createMovedContentState = (
  node: HTMLElement,
  index: number
): MovedContentState => {
  const owner = state.movedContentOwners.get(node);
  if (owner !== undefined) {
    throw new Error(`Layer content is already mounted in layer ${owner}`);
  }
  state.movedContentOwners.set(node, index);
  const originalParent = node.parentNode;

  if (!originalParent) {
    return {
      node,
      originalParent: null,
      originalNextSibling: null,
      placeholder: null,
    };
  }

  const placeholder = ensureDocument().createComment("layer-esm-placeholder");
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

  const { node, originalParent, originalNextSibling, placeholder } =
    record.movedContent;
  if (originalParent) {
    if (placeholder?.parentNode === originalParent) {
      originalParent.insertBefore(node, placeholder);
      placeholder.remove();
    } else if (originalNextSibling?.parentNode === originalParent) {
      originalParent.insertBefore(node, originalNextSibling);
    } else {
      originalParent.appendChild(node);
    }
  }
  state.movedContentOwners.delete(node);
  record.movedContent = null;
};

const updateZIndex = (record: LayerRecord): void => {
  state.zIndex = Math.max(state.zIndex + 2, record.options.zIndex);
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
  const [width, height] = options.area;

  root.style.position = options.fixed ? "fixed" : "absolute";
  root.style.maxWidth =
    width && !options.maxWidthExplicit
      ? "calc(100vw - 2rem)"
      : `min(calc(100vw - 2rem), ${options.maxWidth}px)`;

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
    const direction = applyTipsPlacement(
      record.root,
      record.followTarget,
      record.options.tips[0],
      record.options.fixed
    );
    const arrow = record.root.querySelector<HTMLElement>(
      `.${PREFIX}__tip-arrow`
    );
    if (arrow) {
      arrow.className = `${PREFIX}__tip-arrow ${PREFIX}__tip-arrow--${direction}`;
    }
    return;
  }

  applyOffset(record.root, record.options.offset, record.options.fixed);
};

const bindDrag = (record: LayerRecord): void => {
  const { options, root } = record;

  if (!options.move) {
    return;
  }

  let handle: HTMLElement | null = record.title;
  if (typeof options.move === "string") {
    try {
      handle = root.querySelector<HTMLElement>(options.move);
    } catch {
      handle = null;
    }
    if (!handle && /^[A-Za-z_][\w-]*$/.test(options.move)) {
      handle =
        (root.getElementsByClassName(options.move)[0] as
          | HTMLElement
          | undefined) ?? null;
    }
  }

  if (!handle) {
    return;
  }

  handle.style.cursor = "move";

  const onPointerDown = (event: Event): void => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0) {
      return;
    }

    record.activeGestureCleanup?.();

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
      root.style.left = `${
        pointer.clientX - startX + (options.fixed ? 0 : window.scrollX)
      }px`;
      root.style.top = `${
        pointer.clientY - startY + (options.fixed ? 0 : window.scrollY)
      }px`;
    });
    const removeUp = addEvent(document, "mouseup", () => {
      removeMove();
      removeUp();
      record.activeGestureCleanup = null;
    });
    record.activeGestureCleanup = () => {
      removeMove();
      removeUp();
      record.activeGestureCleanup = null;
    };
  };

  record.cleanup.push(addEvent(handle, "mousedown", onPointerDown));
};

const bindResize = (record: LayerRecord): void => {
  const { options, root } = record;

  if (
    !options.resize ||
    record.typeName === "tips" ||
    record.typeName === "loading"
  ) {
    return;
  }

  const handle = createElement(ensureDocument(), "span", [
    `${PREFIX}__resize-handle`,
  ]);
  root.appendChild(handle);

  const onMouseDown = (event: Event): void => {
    const mouseEvent = event as MouseEvent;
    mouseEvent.preventDefault();
    record.activeGestureCleanup?.();
    updateZIndex(record);

    const rect = root.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;
    const startX = mouseEvent.clientX;
    const startY = mouseEvent.clientY;

    const removeMove = addEvent(document, "mousemove", (moveEvent: Event) => {
      const pointer = moveEvent as MouseEvent;
      root.style.width = `${Math.max(
        pointer.clientX - startX + startWidth,
        260
      )}px`;
      root.style.height = `${Math.max(
        pointer.clientY - startY + startHeight,
        120
      )}px`;
    });
    const removeUp = addEvent(document, "mouseup", () => {
      removeMove();
      removeUp();
      record.activeGestureCleanup = null;
    });
    record.activeGestureCleanup = () => {
      removeMove();
      removeUp();
      record.activeGestureCleanup = null;
    };
  };

  record.cleanup.push(addEvent(handle, "mousedown", onMouseDown));
};

const createToolbarButton = (
  doc: Document,
  type: "close" | "min" | "max"
): HTMLButtonElement => {
  const button = createElement(doc, "button", [
    `${PREFIX}__toolbar-button`,
    `${PREFIX}__toolbar-button--${type}`,
  ]);
  button.type = "button";
  button.setAttribute(
    "aria-label",
    type === "close" ? "Close" : type === "min" ? "Minimize" : "Maximize"
  );
  return button;
};

const renderContent = (
  record: LayerRecord,
  rawContent: LayerOptions["content"]
): void => {
  const { options, content } = record;
  const doc = ensureDocument();

  if (record.typeName === "dialog") {
    const dialog = createElement(doc, "div", [`${PREFIX}__dialog`]);
    const dialogContent = createElement(doc, "div", [DIALOG_PADDING_CLASS]);

    if (
      Number.isFinite(options.icon) &&
      options.icon >= 0 &&
      options.icon < 7
    ) {
      dialogContent.appendChild(createDialogIcon(doc, options.icon));
    }

    const text = createElement(doc, "div");
    if (typeof rawContent === "string") {
      appendHTML(text, rawContent);
    } else if (isHTMLElement(rawContent)) {
      record.movedContent = createMovedContentState(rawContent, record.index);
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
    const loading = createLoadingContent(
      doc,
      Math.max(options.icon ?? 0, 0),
      typeof rawContent === "string" ? rawContent : ""
    );
    content.appendChild(loading);
    return;
  }

  if (record.typeName === "iframe") {
    const iframe = createElement(doc, "iframe", [`${PREFIX}__iframe`]);
    iframe.src = Array.isArray(rawContent)
      ? rawContent[0]
      : String(rawContent ?? "");
    iframe.scrolling =
      Array.isArray(rawContent) && typeof rawContent[1] === "string"
        ? rawContent[1]
        : "auto";
    iframe.setAttribute("allowtransparency", "true");
    iframe.name = `${LEGACY_PREFIX}-iframe${record.index}`;
    iframe.id = `${LEGACY_PREFIX}-iframe${record.index}`;
    record.iframe = iframe;
    content.appendChild(iframe);
    return;
  }

  if (record.typeName === "tips") {
    const bubbleContent = Array.isArray(rawContent)
      ? rawContent[0]
      : String(rawContent ?? "");
    content.appendChild(createTipBubble(doc, bubbleContent, options.tips[0]));
    return;
  }

  if (isHTMLElement(rawContent)) {
    record.movedContent = createMovedContentState(rawContent, record.index);
    content.appendChild(rawContent);
    return;
  }

  const pageContent = Array.isArray(rawContent) ? rawContent[0] : rawContent;
  appendHTML(
    content,
    typeof pageContent === "string" ? pageContent : String(pageContent ?? "")
  );
};

const bindButtons = (record: LayerRecord): void => {
  const { options, buttons } = record;
  if (!buttons || !options.btn) {
    return;
  }

  Array.from(buttons.querySelectorAll<HTMLButtonElement>("button")).forEach(
    (button, index) => {
      record.cleanup.push(
        addEvent(button, "click", () => {
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
        })
      );
    }
  );
};

const topRecord = (): LayerRecord | undefined => {
  const records = Array.from(state.instances.values())
    .filter(
      (record) =>
        !record.closing && record.root.getAttribute("role") === "dialog"
    )
    .sort(
      (left, right) =>
        Number(left.root.style.zIndex) - Number(right.root.style.zIndex)
    );
  return records[records.length - 1];
};

const focusableElements = (root: HTMLElement): HTMLElement[] => {
  return Array.from(
    root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    (element) =>
      !element.hidden && element.getAttribute("aria-hidden") !== "true"
  );
};

const reflowMinimized = (): void => {
  let stackPosition = 0;
  state.minimizedOrder.forEach((index) => {
    const record = state.instances.get(index);
    if (!record || record.windowState !== "minimized") {
      return;
    }
    record.root.style.left = record.options.minStack
      ? `${stackPosition++ * (MINIMIZED_WIDTH + 8)}px`
      : "0px";
  });
};

const bindKeyboard = (record: LayerRecord): void => {
  if (record.root.getAttribute("role") !== "dialog") {
    return;
  }

  record.cleanup.push(
    addEvent(ensureDocument(), "keydown", (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (topRecord() !== record) {
        return;
      }

      if (keyboardEvent.key === "Escape") {
        const result = record.options.cancel?.(record.index, record.root);
        if (result !== false) {
          keyboardEvent.preventDefault();
          close(record.index);
        }
        return;
      }

      if (keyboardEvent.key !== "Tab") {
        return;
      }

      const focusable = focusableElements(record.root);
      if (focusable.length === 0) {
        keyboardEvent.preventDefault();
        record.root.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = ensureDocument().activeElement;
      if (
        keyboardEvent.shiftKey &&
        (active === first || !record.root.contains(active))
      ) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (
        !keyboardEvent.shiftKey &&
        (active === last || !record.root.contains(active))
      ) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    })
  );
};

const bindToolbar = (record: LayerRecord): void => {
  if (record.minButton) {
    record.cleanup.push(
      addEvent(record.minButton, "click", () => {
        if (record.windowState === "minimized") {
          restore(record.index);
        } else {
          min(record.index);
        }
      })
    );
  }

  if (record.maxButton) {
    record.cleanup.push(
      addEvent(record.maxButton, "click", () => {
        if (record.windowState === "full") {
          restore(record.index);
        } else {
          full(record.index);
        }
      })
    );
  }
};

const createRecord = (options: NormalizedLayerOptions): LayerRecord => {
  const doc = ensureDocument();
  const index = state.nextIndex++;
  const typeName = typeNameOf(options.type);
  const shade = options.shade
    ? createElement(doc, "div", [`${PREFIX}-shade`, `${LEGACY_PREFIX}-shade`])
    : null;
  const root = createElement(doc, "div", [
    PREFIX,
    `${PREFIX}--${typeName}`,
    `${PREFIX}--anim-${options.anim}`,
    `${LEGACY_PREFIX}`,
    `${LEGACY_PREFIX}-${typeName}`,
    ...(options.skin ? options.skin.split(/\s+/).filter(Boolean) : []),
    ...(options.className
      ? options.className.split(/\s+/).filter(Boolean)
      : []),
  ]);
  const title = options.title
    ? createElement(doc, "div", [`${PREFIX}__title`, `${LEGACY_PREFIX}-title`])
    : null;
  const content = createElement(doc, "div", [
    `${PREFIX}__content`,
    `${LEGACY_PREFIX}-content`,
  ]);
  const buttons = options.btn
    ? createElement(doc, "div", [
        `${PREFIX}__buttons`,
        `${PREFIX}__buttons--${options.btnAlign || "r"}`,
        `${LEGACY_PREFIX}-btn`,
        `${LEGACY_PREFIX}-btn-${options.btnAlign || "r"}`,
      ])
    : null;
  const toolbar = createElement(doc, "div", [
    `${PREFIX}__toolbar`,
    `${LEGACY_PREFIX}-setwin`,
  ]);
  const closeButton = options.closeBtn
    ? createToolbarButton(doc, "close")
    : null;
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
  root.tabIndex = -1;

  if (typeName === "tips") {
    root.setAttribute("role", "tooltip");
  } else if (
    typeName === "loading" ||
    (typeName === "dialog" && options.title === false && !options.btn)
  ) {
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
  } else {
    root.setAttribute("role", "dialog");
    if (options.shade) {
      root.setAttribute("aria-modal", "true");
    }
  }

  if (title && options.title) {
    title.id = `${root.id}-title`;
    root.setAttribute("aria-labelledby", title.id);
    setText(title, options.title.text);
    if (options.title.style) {
      title.style.cssText += options.title.style;
    }
  }
  if (!title && options.ariaLabel) {
    root.setAttribute("aria-label", options.ariaLabel);
  } else if (!title && root.getAttribute("role") === "dialog") {
    root.setAttribute("aria-label", "Dialog");
  }

  content.id = `${root.id}-content`;
  if (root.getAttribute("role") === "dialog") {
    root.setAttribute("aria-describedby", content.id);
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
    minButton,
    maxButton,
    iframe: null,
    movedContent: null,
    cleanup: [],
    timer: null,
    closeTimer: null,
    closeCallbacks: [],
    closing: false,
    activeGestureCleanup: null,
    followTarget: resolveElement(
      typeof options.follow === "string" ? options.follow : options.follow,
      doc
    ),
    restoreCssText: null,
    windowState: "normal",
    lockedScroll: !options.scrollbar,
    previouslyFocused:
      doc.activeElement instanceof HTMLElement ? doc.activeElement : null,
  };

  try {
    renderContent(record, options.content);
  } catch (error) {
    restoreMovedContent(record);
    throw error;
  }
  root.appendChild(content);

  if (buttons && options.btn) {
    options.btn.forEach((label, buttonIndex) => {
      const button = createElement(doc, "button", [
        `${PREFIX}__button`,
        `${LEGACY_PREFIX}-btn${buttonIndex}`,
        ...(buttonIndex === 0 ? [`${PREFIX}__button--primary`] : []),
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
    record.cleanup.push(
      addEvent(record.closeButton, "click", () => {
        const result = record.options.cancel?.(record.index, record.root);
        if (result !== false) {
          close(record.index);
        }
      })
    );
  }

  if (record.shade && record.options.shadeClose) {
    record.cleanup.push(
      addEvent(record.shade, "click", () => {
        const result = record.options.cancel?.(record.index, record.root);
        if (result !== false) {
          close(record.index);
        }
      })
    );
  }

  record.cleanup.push(
    addEvent(record.root, "mousedown", () => {
      updateZIndex(record);
    })
  );

  bindButtons(record);
  bindToolbar(record);
  bindKeyboard(record);
  bindDrag(record);
  bindResize(record);

  if (record.typeName === "tips" && record.followTarget) {
    const relocate = (): void => applyPlacement(record);
    record.cleanup.push(addEvent(window, "resize", relocate));
    record.cleanup.push(
      addEvent(window, "scroll", relocate, { passive: true })
    );
  }

  if (record.options.timeMs > 0) {
    record.timer = window.setTimeout(() => {
      close(record.index);
    }, record.options.timeMs);
  }

  record.options.success?.(record.root, record.index);

  if (
    state.instances.has(record.index) &&
    record.root.getAttribute("role") === "dialog"
  ) {
    (focusableElements(record.root)[0] ?? record.root).focus();
  }
};

const removeRecord = (record: LayerRecord): void => {
  const shouldRestoreFocus =
    record.root.contains(ensureDocument().activeElement) ||
    topRecord() === record;
  record.activeGestureCleanup?.();
  record.activeGestureCleanup = null;
  record.cleanup.forEach((cleanup) => cleanup());
  record.cleanup = [];

  if (record.timer) {
    window.clearTimeout(record.timer);
    record.timer = null;
  }
  if (record.closeTimer) {
    window.clearTimeout(record.closeTimer);
    record.closeTimer = null;
  }

  restoreMovedContent(record);
  record.shade?.remove();
  record.root.remove();

  if (record.lockedScroll) {
    unlockScroll();
    record.lockedScroll = false;
  }

  const minimizedIndex = state.minimizedOrder.indexOf(record.index);
  if (minimizedIndex >= 0) {
    state.minimizedOrder.splice(minimizedIndex, 1);
    reflowMinimized();
  }

  if (shouldRestoreFocus && record.previouslyFocused?.isConnected) {
    record.previouslyFocused.focus();
  }
};

const openMessage = (contentValue: string, options: LayerOptions): number => {
  ensureStyleReady();
  const doc = ensureDocument();
  const normalized = normalizeOptions({
    ...options,
    type: 0,
    title: false,
    content: contentValue,
    shade: options.shade ?? false,
    closeBtn: false,
    move: false,
    resize: false,
    skin: [PREFIX + "--message", options.skin].filter(Boolean).join(" "),
  });
  const index = state.nextIndex++;
  const shade = normalized.shade
    ? createElement(doc, "div", [`${PREFIX}-shade`, `${LEGACY_PREFIX}-shade`])
    : null;
  const root = createElement(doc, "div", [
    PREFIX,
    `${PREFIX}--dialog`,
    `${PREFIX}--anim-${normalized.anim}`,
    LEGACY_PREFIX,
    `${LEGACY_PREFIX}-dialog`,
    ...normalized.skin.split(/\s+/).filter(Boolean),
    ...normalized.className.split(/\s+/).filter(Boolean),
  ]);
  const content = createElement(doc, "div", [
    `${PREFIX}__content`,
    `${LEGACY_PREFIX}-content`,
  ]);
  const dialog = createElement(doc, "div", [`${PREFIX}__dialog`]);
  const dialogContent = createElement(doc, "div", [DIALOG_PADDING_CLASS]);
  const text = createElement(doc, "div");
  const buttons = normalized.btn
    ? createElement(doc, "div", [
        `${PREFIX}__buttons`,
        `${PREFIX}__buttons--${normalized.btnAlign || "r"}`,
        `${LEGACY_PREFIX}-btn`,
        `${LEGACY_PREFIX}-btn-${normalized.btnAlign || "r"}`,
      ])
    : null;

  if (normalized.icon >= 0 && normalized.icon < 7) {
    dialogContent.appendChild(createDialogIcon(doc, normalized.icon));
  }
  appendHTML(text, contentValue);
  dialogContent.appendChild(text);
  dialog.appendChild(dialogContent);
  content.appendChild(dialog);
  root.appendChild(content);
  if (buttons && normalized.btn) {
    normalized.btn.forEach((label, buttonIndex) => {
      const button = createElement(doc, "button", [
        `${PREFIX}__button`,
        `${LEGACY_PREFIX}-btn${buttonIndex}`,
        ...(buttonIndex === 0 ? [`${PREFIX}__button--primary`] : []),
      ]);
      button.type = "button";
      setText(button, label);
      buttons.appendChild(button);
    });
    root.appendChild(buttons);
  }
  root.dataset.index = `${index}`;
  root.dataset.type = "dialog";
  root.id = normalized.id || `${LEGACY_PREFIX}${index}`;
  root.tabIndex = -1;
  content.id = `${root.id}-content`;
  if (buttons) {
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", normalized.ariaLabel ?? "Message");
    root.setAttribute("aria-describedby", content.id);
    if (shade) root.setAttribute("aria-modal", "true");
  } else {
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
  }

  if (shade && normalized.shade) {
    shade.style.background = normalized.shadeStyle || normalized.shade.color;
    shade.style.opacity = `${normalized.shade.opacity}`;
    shade.dataset.index = `${index}`;
  }

  const record: LayerRecord = {
    index,
    options: normalized,
    typeName: "dialog",
    root,
    shade,
    title: null,
    content,
    buttons,
    closeButton: null,
    minButton: null,
    maxButton: null,
    iframe: null,
    movedContent: null,
    cleanup: [],
    timer: null,
    closeTimer: null,
    closeCallbacks: [],
    closing: false,
    activeGestureCleanup: null,
    followTarget: null,
    restoreCssText: null,
    windowState: "normal",
    lockedScroll: false,
    previouslyFocused:
      doc.activeElement instanceof HTMLElement ? doc.activeElement : null,
  };

  state.instances.set(index, record);
  try {
    if (!normalized.scrollbar) {
      record.lockedScroll = true;
      lockScroll();
    }
    updateZIndex(record);
    applyRootLayout(record);
    if (shade) doc.body.appendChild(shade);
    doc.body.appendChild(root);
    applyPlacement(record);
    record.cleanup.push(
      addEvent(root, "mousedown", () => {
        updateZIndex(record);
      })
    );
    bindButtons(record);
    bindKeyboard(record);
    if (shade && normalized.shadeClose) {
      record.cleanup.push(
        addEvent(shade, "click", () => {
          const result = normalized.cancel?.(index, root);
          if (result !== false) close(index);
        })
      );
    }
    if (normalized.timeMs > 0) {
      record.timer = window.setTimeout(() => close(index), normalized.timeMs);
    }
    normalized.success?.(root, index);
    if (buttons) (focusableElements(root)[0] ?? root).focus();
    return index;
  } catch (error) {
    removeRecord(record);
    state.instances.delete(index);
    throw error;
  }
};

export const config = (options: LayerConfigOptions = {}) => {
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
  try {
    mountRecord(record);
    return record.index;
  } catch (error) {
    removeRecord(record);
    state.instances.delete(record.index);
    throw error;
  }
};

export const setTop = (indexOrElement: number | HTMLElement): number => {
  const record =
    typeof indexOrElement === "number"
      ? state.instances.get(indexOrElement)
      : state.instances.get(
          Number(
            indexOrElement.dataset.index ??
              indexOrElement.closest(`.${PREFIX}`)?.getAttribute("data-index")
          )
        );

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

  setText(record.title, name);
};

export const style = (index: number, options: LayerStyleOptions): void => {
  const record = state.instances.get(index);
  if (!record) {
    return;
  }

  setLayerSize(record, options);
};

export const getChildFrame = (
  selector: string,
  index = state.nextIndex - 1
): HTMLElement | null => {
  const record = state.instances.get(index);
  try {
    return (
      record?.iframe?.contentDocument?.querySelector<HTMLElement>(selector) ??
      null
    );
  } catch {
    return null;
  }
};

export const getFrameIndex = (name: string): number | null => {
  const record = Array.from(state.instances.values()).find(
    (item) => item.iframe?.name === name || item.iframe?.id === name
  );
  return record ? record.index : null;
};

export const iframeAuto = (index: number): void => {
  const record = state.instances.get(index);
  let body: HTMLElement | null | undefined;
  try {
    body = record?.iframe?.contentDocument?.body;
  } catch {
    return;
  }

  if (!record || !record.iframe || !body) {
    return;
  }

  record.iframe.style.height = `${body.scrollHeight}px`;
  record.root.style.height = `${
    body.scrollHeight +
    (record.title?.offsetHeight ?? 0) +
    (record.buttons?.offsetHeight ?? 0)
  }px`;
};

export const iframeSrc = (index: number, url: string): void => {
  const record = state.instances.get(index);
  if (record?.iframe) {
    record.iframe.src = url;
  }
};

export const min = (
  index: number,
  options: Partial<LayerOptions> = {}
): void => {
  const record = state.instances.get(index);
  if (!record || record.windowState === "minimized") {
    return;
  }

  if (record.windowState === "full") {
    restore(index);
  }
  record.restoreCssText = record.root.style.cssText;
  record.options.minStack = options.minStack ?? record.options.minStack;
  record.windowState = "minimized";
  record.content.style.display = "none";
  if (record.buttons) {
    record.buttons.style.display = "none";
  }
  if (record.shade) {
    record.shade.style.display = "none";
  }

  state.minimizedOrder.push(index);
  record.root.style.transform = "";
  record.root.style.width = `${MINIMIZED_WIDTH}px`;
  record.root.style.height = `${record.title?.offsetHeight ?? 52}px`;
  record.root.style.left = "0px";
  record.root.style.right = "";
  record.root.style.top = "";
  record.root.style.bottom = "0";
  record.root.style.position = "fixed";
  reflowMinimized();
};

export const restore = (index: number): void => {
  const record = state.instances.get(index);
  if (!record || record.windowState === "normal" || !record.restoreCssText) {
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
  const minimizedIndex = state.minimizedOrder.indexOf(index);
  if (minimizedIndex >= 0) {
    state.minimizedOrder.splice(minimizedIndex, 1);
    reflowMinimized();
  }
  record.windowState = "normal";
  record.restoreCssText = null;
};

export const full = (index: number): void => {
  const record = state.instances.get(index);
  if (!record || record.windowState === "full") {
    return;
  }

  if (record.windowState === "minimized") {
    restore(index);
  }
  record.restoreCssText = record.root.style.cssText;
  record.windowState = "full";
  record.root.style.transform = "";
  record.root.style.position = "fixed";
  record.root.style.top = "0";
  record.root.style.left = "0";
  record.root.style.right = "0";
  record.root.style.bottom = "0";
  record.root.style.width = "100vw";
  record.root.style.height = "100vh";
};

export const close = (index: number, callback?: () => void): void => {
  const record = state.instances.get(index);
  if (!record) {
    callback?.();
    return;
  }
  if (record.closing) {
    return;
  }
  record.closing = true;
  if (callback) {
    record.closeCallbacks.push(callback);
  }

  const finish = (): void => {
    removeRecord(record);
    state.instances.delete(index);
    record.options.end?.();
    const callbacks = record.closeCallbacks.splice(0);
    callbacks.forEach((closeCallback) => closeCallback());
  };

  if (record.options.isOutAnim) {
    record.root.classList.add(`${PREFIX}--closing`);
    record.closeTimer = window.setTimeout(finish, CLOSE_ANIMATION_MS);
    return;
  }

  finish();
};

export const closeAll = (
  type?: string | (() => void),
  callback?: () => void
): void => {
  let targetType = type;
  let done = callback;

  if (typeof type === "function") {
    done = type;
    targetType = undefined;
  }

  const records = Array.from(state.instances.values()).filter(
    (record) => !targetType || record.typeName === targetType
  );

  if (records.length === 0) {
    done?.();
    return;
  }

  let remaining = records.length;
  const onClosed = (): void => {
    remaining -= 1;
    if (remaining === 0) {
      done?.();
    }
  };

  records.forEach((record) => {
    if (record.closing) {
      record.closeCallbacks.push(onClosed);
    } else {
      close(record.index, onClosed);
    }
  });
};

export const alert = (
  content: string,
  options?: LayerOptions | ((index: number, layero: HTMLElement) => void),
  yes?: (index: number, layero: HTMLElement) => void
): number => {
  const isCallbackOnly = typeof options === "function";
  return open({
    content,
    btn: ["OK"],
    ...(isCallbackOnly ? {} : options),
    yes: isCallbackOnly ? options : yes,
  });
};

export const confirm = (
  content: string,
  options?: LayerOptions | ((index: number, layero: HTMLElement) => void),
  yes?: (index: number, layero: HTMLElement) => void,
  cancel?: (index: number, layero: HTMLElement) => void
): number => {
  const isCallbackOnly = typeof options === "function";
  return open({
    content,
    btn: ["OK", "Cancel"],
    ...(isCallbackOnly ? {} : options),
    yes: isCallbackOnly ? options : yes,
    btn2: isCallbackOnly ? yes : cancel,
  });
};

export const msg = (
  content: string,
  options?: LayerOptions | (() => void),
  end?: () => void
): number => {
  const isEndOnly = typeof options === "function";
  const messageOptions = isEndOnly ? {} : options ?? {};
  return openMessage(content, {
    ...messageOptions,
    time: messageOptions.time ?? 3,
    end: isEndOnly ? options : end ?? messageOptions.end,
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

export const tips = (
  content: string,
  follow: string | HTMLElement,
  options: LayerTipsOptions = {}
): number => {
  return open({
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
};

export const prompt = (
  options: LayerPromptOptions = {},
  yes?: (
    value: string,
    index: number,
    input: HTMLInputElement | HTMLTextAreaElement
  ) => void
): number => {
  const doc = ensureDocument();
  const input =
    options.formType === 2
      ? createElement(doc, "textarea", [
          `${PREFIX}__textarea`,
          "layui-layer-input",
        ])
      : createElement(doc, "input", [`${PREFIX}__input`, "layui-layer-input"]);

  if (input instanceof HTMLInputElement) {
    input.type = options.formType === 1 ? "password" : "text";
    input.value = options.value ?? "";
  } else {
    input.value = options.value ?? "";
  }

  return open({
    ...options,
    type: 1,
    skin: ["layui-layer-prompt", options.skin].filter(Boolean).join(" "),
    content: input,
    btn: ["OK", "Cancel"],
    yes: (index) => {
      const value = input.value;
      if (!value.trim()) {
        input.focus();
        return;
      }
      if (value.length > (options.maxlength ?? 500)) {
        tips(escapeHTML(resolvePromptMaxlengthMessage(options, value)), input, {
          tips: [1, "#111827"],
          time: 2,
        });
        return;
      }
      yes?.(value, index, input);
    },
  });
};

export const tab = (options: LayerTabOptions): number => {
  const doc = ensureDocument();
  const wrapper = createElement(doc, "div");
  const header = createElement(doc, "div", [`${PREFIX}__tab-header`]);
  const panels = createElement(doc, "div");
  header.setAttribute("role", "tablist");

  options.tab.forEach((item, index) => {
    const trigger = createElement(doc, "button", [
      `${PREFIX}__tab-trigger`,
      ...(index === 0 ? [`${PREFIX}__tab-trigger--active`, "layui-this"] : []),
    ]);
    trigger.type = "button";
    trigger.textContent = item.title;
    trigger.id = `${PREFIX}-tab-${state.nextIndex}-${index}`;
    trigger.setAttribute("role", "tab");
    trigger.setAttribute("aria-selected", index === 0 ? "true" : "false");
    header.appendChild(trigger);

    const panel = createElement(doc, "div", [
      `${PREFIX}__tab-panel`,
      ...(index === 0 ? [`${PREFIX}__tab-panel--active`, "layui-this"] : []),
    ]);
    panel.id = `${PREFIX}-panel-${state.nextIndex}-${index}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", trigger.id);
    trigger.setAttribute("aria-controls", panel.id);
    appendHTML(panel, item.content || "no content");
    panels.appendChild(panel);
  });

  wrapper.appendChild(header);
  wrapper.appendChild(panels);

  return open({
    ...options,
    type: 1,
    skin: ["layui-layer-tab", options.skin].filter(Boolean).join(" "),
    content: wrapper,
    success: (layero, index) => {
      options.success?.(layero, index);
      const triggers = Array.from(
        layero.querySelectorAll<HTMLElement>(`.${PREFIX}__tab-trigger`)
      );
      const tabPanels = Array.from(
        layero.querySelectorAll<HTMLElement>(`.${PREFIX}__tab-panel`)
      );

      triggers.forEach((trigger, triggerIndex) => {
        addEvent(trigger, "click", () => {
          triggers.forEach((node) =>
            node.classList.remove(
              `${PREFIX}__tab-trigger--active`,
              "layui-this"
            )
          );
          tabPanels.forEach((panel) =>
            panel.classList.remove(`${PREFIX}__tab-panel--active`, "layui-this")
          );
          trigger.classList.add(`${PREFIX}__tab-trigger--active`, "layui-this");
          triggers.forEach((node) =>
            node.setAttribute(
              "aria-selected",
              node === trigger ? "true" : "false"
            )
          );
          tabPanels[triggerIndex]?.classList.add(
            `${PREFIX}__tab-panel--active`,
            "layui-this"
          );
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
