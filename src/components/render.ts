import type { LayerTipDirection } from "../core/types";
import { PREFIX, appendHTML, createElement } from "../utils/dom";

export const createDialogIcon = (
  doc: Document,
  icon: number
): HTMLSpanElement => {
  const iconNode = createElement(doc, "span", [
    `${PREFIX}__icon`,
    `${PREFIX}__icon--${Math.max(icon, 0)}`,
  ]);
  const content =
    ["!", "✓", "×", "?", "", "☹", "☺"][Math.max(0, Math.min(icon, 6))] ?? "!";
  iconNode.dataset.icon = content;
  iconNode.setAttribute("aria-hidden", "true");
  return iconNode;
};

export const createLoadingContent = (
  doc: Document,
  icon: number,
  text: string
): HTMLDivElement => {
  const wrapper = createElement(doc, "div", [`${PREFIX}__loading-shell`]);
  const spinner = createElement(doc, "span", [
    `${PREFIX}__spinner`,
    `${PREFIX}__spinner--${Math.max(icon, 0)}`,
  ]);
  spinner.setAttribute("aria-hidden", "true");
  wrapper.appendChild(spinner);

  if (text) {
    const label = createElement(doc, "span");
    label.textContent = text;
    wrapper.appendChild(label);
  }

  return wrapper;
};

export const createTipBubble = (
  doc: Document,
  html: string,
  direction: LayerTipDirection
): HTMLDivElement => {
  const bubble = createElement(doc, "div", [`${PREFIX}__tips`]);
  appendHTML(bubble, html);

  const arrow = createElement(doc, "span", [
    `${PREFIX}__tip-arrow`,
    `${PREFIX}__tip-arrow--${direction}`,
  ]);
  arrow.setAttribute("aria-hidden", "true");
  bubble.appendChild(arrow);

  return bubble;
};
