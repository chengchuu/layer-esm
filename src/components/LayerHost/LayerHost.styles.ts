import { css, keyframes, styled } from "styled-components";

const scaleIn = keyframes`
  from { opacity: 0; scale: .88; }
  to { opacity: 1; scale: 1; }
`;
const dropIn = keyframes`
  from { opacity: 0; translate: 0 -24px; scale: .92; }
  to { opacity: 1; translate: 0 0; scale: 1; }
`;
const riseIn = keyframes`
  from { opacity: 0; translate: 0 24px; }
  to { opacity: 1; translate: 0 0; }
`;
const slideInLeft = keyframes`
  from { opacity: 0; translate: -28px 0; }
  to { opacity: 1; translate: 0 0; }
`;
const rollIn = keyframes`
  from { opacity: 0; translate: -28px 0; rotate: -10deg; }
  to { opacity: 1; translate: 0 0; rotate: 0deg; }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;
const shakeIn = keyframes`
  0%, 100% { opacity: 1; translate: 0 0; }
  25% { translate: -6px 0; }
  75% { translate: 6px 0; }
`;
const exit = keyframes`to { opacity: 0; translate: 0 8px; scale: .98; }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const entranceAnimations = [
  scaleIn,
  dropIn,
  riseIn,
  slideInLeft,
  rollIn,
  fadeIn,
  shakeIn,
];

export const Shade = styled.div.attrs({
  className: "layer-esm-shade layui-layer-shade",
})<{
  $color?: string;
  $opacity: number;
  $closing: boolean;
}>`
  position: fixed;
  inset: 0;
  background: ${({ $color, theme }) => $color ?? theme.shade};
  opacity: ${({ $opacity, $closing }) => ($closing ? 0 : $opacity)};
  transition: opacity 180ms ease;
`;

export const Shell = styled.div.attrs({ className: "layer-esm layui-layer" })<{
  $closing: boolean;
  $type: string;
  $anim: number;
}>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  min-width: 240px;
  max-height: calc(100vh - 2rem);
  overflow: hidden;
  color: ${({ theme }) => theme.foreground};
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: ${({ theme }) => theme.radius};
  box-shadow: ${({ theme }) => theme.shadow};
  font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  ${({ $anim }) => css`
    animation: ${entranceAnimations[$anim] ?? scaleIn} 220ms ease-out both;
  `}
  outline: 0;

  ${({ $type, theme }) =>
    ($type === "message" || $type === "loading") &&
    css`
      min-width: auto;
      max-width: min(90vw, 28rem);
      color: #fff;
      background: ${theme.loadingBackground};
      border: 0;
      border-radius: 10px;
      overflow: visible;
    `}

  ${({ $type }) =>
    $type === "tips" &&
    css`
      min-width: auto;
      max-width: min(90vw, 24rem);
      overflow: visible;
      color: #fff;
      border: 0;
      border-radius: 6px;
    `}

  ${({ $closing }) =>
    $closing &&
    css`
      pointer-events: none;
      animation: ${exit} 180ms ease both;
    `}

  *, *::before, *::after {
    box-sizing: border-box;
  }

  .layer-esm__iframe {
    display: block;
    width: 100%;
    min-height: 180px;
    height: 100%;
    border: 0;
  }

  .layer-esm__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1ms;
    transition-duration: 1ms;
  }
`;

export const Header = styled.div.attrs({
  className: "layer-esm__title layui-layer-title",
})`
  flex: none;
  min-height: 48px;
  padding: 13px 112px 11px 18px;
  overflow: hidden;
  color: ${({ theme }) => theme.foreground};
  background: ${({ theme }) => theme.background};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
`;

export const Toolbar = styled.div.attrs({
  className: "layer-esm__toolbar layui-layer-setwin",
})`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  display: flex;
  gap: 3px;
`;

export const ToolbarButton = styled.button.attrs({ type: "button" })`
  width: 32px;
  height: 32px;
  padding: 0;
  color: ${({ theme }) => theme.muted};
  background: transparent;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  font: 18px/32px system-ui, sans-serif;
  &:hover {
    color: ${({ theme }) => theme.foreground};
    background: ${({ theme }) => theme.border};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.focusRing};
    outline-offset: 1px;
  }
`;

export const Content = styled.div.attrs({
  className: "layer-esm__content layui-layer-content",
})`
  flex: 1 1 auto;
  min-height: 0;
  padding: 20px;
  overflow: auto;
  overflow-wrap: anywhere;
`;

export const DialogContent = styled.div.attrs({
  className: "layer-esm__dialog-content",
})<{ $compact: boolean }>`
  display: flex;
  align-items: ${({ $compact }) => ($compact ? "center" : "flex-start")};
  gap: 12px;
`;

export const Icon = styled.span<{ $compact: boolean; $icon: number }>`
  display: inline-grid;
  flex: none;
  width: ${({ $compact }) => ($compact ? "26px" : "34px")};
  height: ${({ $compact }) => ($compact ? "26px" : "34px")};
  place-items: center;
  color: #fff;
  background: ${({ $icon, theme }) =>
    $icon === 1 || $icon === 6
      ? theme.success
      : $icon === 2 || $icon === 5
      ? theme.error
      : theme.warning};
  border-radius: 50%;
  font-size: ${({ $compact }) => ($compact ? "16px" : "20px")};
  font-weight: 700;
`;

export const Buttons = styled.div.attrs({
  className: "layer-esm__buttons layui-layer-btn",
})<{ $align: string }>`
  display: flex;
  flex: none;
  gap: 9px;
  justify-content: ${({ $align }) =>
    $align === "l" ? "flex-start" : $align === "c" ? "center" : "flex-end"};
  padding: 12px 16px 16px;
`;

export const Button = styled.button.attrs({
  className: "layer-esm__button",
  type: "button",
})<{ $primary: boolean }>`
  min-width: 72px;
  min-height: 36px;
  padding: 7px 15px;
  color: ${({ $primary, theme }) => ($primary ? "#fff" : theme.foreground)};
  background: ${({ $primary, theme }) =>
    $primary ? theme.primary : theme.background};
  border: 1px solid
    ${({ $primary, theme }) => ($primary ? theme.primary : theme.border)};
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  &:hover {
    background: ${({ $primary, theme }) =>
      $primary ? theme.primaryHover : theme.border};
  }
  &:active {
    background: ${({ $primary, theme }) =>
      $primary ? theme.primaryActive : theme.border};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.focusRing};
    outline-offset: 2px;
  }
`;

export const LoadingShell = styled.div.attrs({
  className: "layer-esm__loading-shell",
})`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px 18px;
`;

export const Spinner = styled.span<{ $variant: number }>`
  width: 25px;
  height: 25px;
  flex: none;
  border: 3px solid rgba(255, 255, 255, 0.28);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 700ms linear infinite;
  ${({ $variant }) =>
    $variant === 1
      ? css`
          border-style: dotted;
          animation-duration: 900ms;
        `
      : $variant === 2
      ? css`
          border-width: 2px 5px 5px 2px;
          animation-duration: 600ms;
        `
      : ""}
  @media (prefers-reduced-motion: reduce) {
    animation-duration: 1.8s;
  }
`;

export const TipArrow = styled.span<{ $direction: number; $color?: string }>`
  position: absolute;
  width: 0;
  height: 0;
  border: 7px solid transparent;
  ${({ $direction, $color, theme }) => {
    const color = $color ?? theme.tooltipBackground;
    return $direction === 1
      ? css`
          top: 100%;
          left: 50%;
          border-top-color: ${color};
          transform: translateX(-50%);
        `
      : $direction === 2
      ? css`
          top: 50%;
          right: 100%;
          border-right-color: ${color};
          transform: translateY(-50%);
        `
      : $direction === 3
      ? css`
          bottom: 100%;
          left: 50%;
          border-bottom-color: ${color};
          transform: translateX(-50%);
        `
      : css`
          top: 50%;
          left: 100%;
          border-left-color: ${color};
          transform: translateY(-50%);
        `;
  }}
`;

export const TipBubble = styled.div.attrs({ className: "layer-esm__tips" })<{
  $color?: string;
}>`
  padding: 8px 12px;
  background: ${({ $color, theme }) => $color ?? theme.tooltipBackground};
`;

export const PromptField = styled.label`
  display: block;
  width: 100%;
`;

export const Input = styled.input.attrs({
  className: "layer-esm__input layui-layer-input",
})`
  width: 100%;
  min-height: 40px;
  padding: 8px 10px;
  color: ${({ theme }) => theme.foreground};
  background: ${({ theme }) => theme.inputBackground};
  border: 1px solid ${({ theme }) => theme.inputBorder};
  border-radius: 7px;
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.focusRing};
    outline-offset: 1px;
  }
`;

export const Textarea = styled.textarea.attrs({
  className: "layer-esm__textarea layui-layer-input",
})`
  width: 100%;
  min-height: 110px;
  resize: vertical;
  padding: 8px 10px;
  color: ${({ theme }) => theme.foreground};
  background: ${({ theme }) => theme.inputBackground};
  border: 1px solid ${({ theme }) => theme.inputBorder};
  border-radius: 7px;
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.focusRing};
    outline-offset: 1px;
  }
`;

export const TabList = styled.div.attrs({
  className: "layer-esm__tab-header",
  role: "tablist",
})`
  display: flex;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;
export const Tab = styled.button.attrs({
  className: "layer-esm__tab-trigger",
  type: "button",
  role: "tab",
})<{ $active: boolean }>`
  padding: 11px 15px;
  color: ${({ theme }) => theme.foreground};
  background: transparent;
  border: 0;
  border-bottom: 3px solid
    ${({ $active, theme }) => ($active ? theme.primary : "transparent")};
  cursor: pointer;
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.focusRing};
    outline-offset: -3px;
  }
`;
export const TabPanel = styled.div.attrs({
  className: "layer-esm__tab-panel",
  role: "tabpanel",
})`
  padding: 18px;
`;

export const ResizeHandle = styled.span.attrs({
  className: "layer-esm__resize",
})`
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 15px;
  height: 15px;
  opacity: 0;
  cursor: nwse-resize;
  transition: opacity 120ms ease;

  &:hover {
    opacity: 1;
  }

  &::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 7px;
    height: 7px;
    border-right: 2px solid ${({ theme }) => theme.muted};
    border-bottom: 2px solid ${({ theme }) => theme.muted};
  }
`;
