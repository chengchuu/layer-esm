export const PREFIX = "layer-esm";
export const LEGACY_PREFIX = "layui-layer";

export const ensureDocument = (): Document => {
  if (typeof document === "undefined") {
    throw new Error("layer-esm requires a browser-like document.");
  }

  return document;
};

export const isHTMLElement = (value: unknown): value is HTMLElement => {
  return typeof HTMLElement !== "undefined" && value instanceof HTMLElement;
};

export const normalizeUnit = (
  value: string | number | undefined
): string | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return `${value}px`;
  }

  return /^\d+$/.test(value) ? `${value}px` : value;
};

export const resolveElement = (
  target: string | HTMLElement | undefined,
  root: ParentNode = ensureDocument()
): HTMLElement | null => {
  if (!target) {
    return null;
  }

  if (typeof target === "string") {
    try {
      return root.querySelector<HTMLElement>(target);
    } catch {
      return null;
    }
  }

  return isHTMLElement(target) ? target : null;
};

export const addEvent = (
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | boolean
): (() => void) => {
  target.addEventListener(type, listener, options);

  return () => {
    target.removeEventListener(type, listener, options);
  };
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tagName: K,
  classNames: string[] = []
): HTMLElementTagNameMap[K] => {
  const element = doc.createElement(tagName);

  if (classNames.length > 0) {
    element.className = classNames.join(" ");
  }

  return element;
};

export const appendHTML = (element: HTMLElement, html: string): void => {
  element.innerHTML = html;
};

export const setText = (element: HTMLElement, text: string): void => {
  element.textContent = text;
};
