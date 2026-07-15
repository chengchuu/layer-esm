import { PREFIX, ensureDocument } from "../utils/dom";

const STYLE_ID = `${PREFIX}-style`;

export const injectStyle = (
  cssText: string,
  options: { nonce?: string } = {}
): void => {
  const doc = ensureDocument();

  if (doc.getElementById(STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = STYLE_ID;
  if (options.nonce) {
    style.nonce = options.nonce;
  }
  style.textContent = cssText;
  (doc.head ?? doc.documentElement).appendChild(style);
};
