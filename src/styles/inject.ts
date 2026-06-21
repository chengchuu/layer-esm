import { addStyle } from "mazey";
import { PREFIX, ensureDocument } from "../utils/dom";

const STYLE_ID = `${PREFIX}-style`;

export const injectStyle = (cssText: string): void => {
  const doc = ensureDocument();

  if (doc.getElementById(STYLE_ID)) {
    return;
  }

  addStyle(cssText, { id: STYLE_ID });
};
