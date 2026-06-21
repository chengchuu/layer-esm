import { PREFIX, ensureDocument } from "../utils/dom";

const STYLE_ID = `${PREFIX}-style`;

export const injectStyle = (cssText: string): void => {
  const doc = ensureDocument();

  if (doc.getElementById(STYLE_ID)) {
    return;
  }

  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.type = "text/css";
  style.textContent = cssText;
  doc.head.appendChild(style);
};
