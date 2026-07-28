import type { LayerTheme, LayerThemeSelection } from "../styles/theme";

export type LayerType = 0 | 1 | 2 | 3 | 4;

export type LayerOffsetKeyword =
  | "auto"
  | "t"
  | "r"
  | "b"
  | "l"
  | "lt"
  | "lb"
  | "rt"
  | "rb";

export type LayerOffset =
  | LayerOffsetKeyword
  | string
  | number
  | [string | number, string | number];

export type LayerArea = string | number | [string | number, string | number];

export type LayerTitle = false | string | [string, string];

export type LayerShade = boolean | number | [number, string];

export type LayerTipDirection = 1 | 2 | 3 | 4;

export interface LayerTabItem {
  title: string;
  content: string;
}

export interface LayerOptions {
  type?: LayerType;
  title?: LayerTitle;
  content?: string | HTMLElement | [string, string?];
  shade?: LayerShade;
  shadeClose?: boolean;
  fixed?: boolean;
  move?: boolean | string;
  moveType?: 0 | 1;
  resize?: boolean;
  closeBtn?: boolean | 0 | 1 | 2;
  time?: number;
  zIndex?: number;
  maxWidth?: number;
  anim?: number;
  isOutAnim?: boolean;
  icon?: number;
  area?: LayerArea;
  offset?: LayerOffset;
  btn?: false | string | string[];
  btnAlign?: "l" | "c" | "r" | string;
  skin?: string;
  className?: string;
  id?: string;
  ariaLabel?: string;
  scrollbar?: boolean;
  minStack?: boolean;
  maxmin?: boolean;
  shadeStyle?: string;
  tips?: LayerTipDirection | [LayerTipDirection, string];
  follow?: HTMLElement | string;
  formType?: 0 | 1 | 2;
  value?: string;
  maxlength?: number;
  success?: (layero: HTMLElement, index: number) => void;
  end?: () => void;
  yes?: (index: number, layero: HTMLElement) => void;
  btn2?: (index: number, layero: HTMLElement) => boolean | void;
  cancel?: (index: number, layero: HTMLElement) => boolean | void;
  change?: (index: number) => void;
  tab?: LayerTabItem[];
  targetDocument?: Document;
}

export interface LayerConfigOptions extends Partial<LayerOptions> {
  injectStyles?: boolean;
  styleNonce?: string;
  theme?: LayerThemeSelection;
}

export interface LayerPromptOptions
  extends Omit<LayerOptions, "content" | "type"> {
  formType?: 0 | 1 | 2;
  value?: string;
  maxlengthMessage?: string | ((maxlength: number, value: string) => string);
}

export interface LayerTipsOptions
  extends Omit<LayerOptions, "content" | "type" | "follow"> {
  tips?: LayerTipDirection | [LayerTipDirection, string];
}

export interface LayerTabOptions
  extends Omit<LayerOptions, "content" | "type" | "title"> {
  tab: LayerTabItem[];
}

export interface ShadeValue {
  opacity: number;
  color: string;
}

export interface TitleValue {
  text: string;
  style?: string;
}

export interface NormalizedLayerOptions
  extends Omit<LayerOptions, "title" | "shade" | "area" | "tips" | "btn"> {
  type: LayerType;
  title: TitleValue | false;
  shade: ShadeValue | false;
  area: [string | undefined, string | undefined];
  tips: [LayerTipDirection, string];
  btn: string[] | false;
  fixed: boolean;
  move: boolean | string;
  moveType: 0 | 1;
  resize: boolean;
  closeBtn: boolean | 0 | 1 | 2;
  timeMs: number;
  zIndex: number;
  maxWidth: number;
  anim: number;
  isOutAnim: boolean;
  icon: number;
  btnAlign: "l" | "c" | "r" | string;
  skin: string;
  className: string;
  id: string;
  scrollbar: boolean;
  minStack: boolean;
  maxmin: boolean;
  shadeStyle: string;
  formType: 0 | 1 | 2;
  value: string;
  maxlength: number;
  maxWidthExplicit: boolean;
  shadeColorExplicit: boolean;
  tipsColorExplicit: boolean;
}

export interface LayerStyleOptions {
  width?: string | number;
  height?: string | number;
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  position?: string;
  overflow?: string;
}

export type { LayerTheme, LayerThemeSelection };
