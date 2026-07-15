import type { LayerOffset, LayerTipDirection, ShadeValue } from "../core/types";
import { normalizeUnit } from "./dom";

export const normalizeShade = (
  shade: boolean | number | [number, string] | undefined
): ShadeValue | false => {
  if (shade === false || shade === 0) {
    return false;
  }

  if (shade === true || shade === undefined) {
    return {
      opacity: 0.3,
      color: "#000",
    };
  }

  if (typeof shade === "number") {
    return {
      opacity: shade,
      color: "#000",
    };
  }

  return {
    opacity: shade[0],
    color: shade[1] ?? "#000",
  };
};

export const normalizeArea = (
  area: string | number | [string | number, string | number] | undefined
): [string | undefined, string | undefined] => {
  if (area === undefined || area === "auto") {
    return [undefined, undefined];
  }

  if (typeof area === "string" || typeof area === "number") {
    return [normalizeUnit(area), undefined];
  }

  return [normalizeUnit(area[0]), normalizeUnit(area[1])];
};

export const applyOffset = (
  element: HTMLElement,
  offset: LayerOffset | undefined,
  fixed: boolean
): void => {
  element.style.top = "";
  element.style.left = "";
  element.style.right = "";
  element.style.bottom = "";
  element.style.transform = "";

  const scrollY = fixed ? 0 : window.scrollY;
  const scrollX = fixed ? 0 : window.scrollX;

  if (Array.isArray(offset)) {
    element.style.top = normalizeUnit(offset[0]) ?? "";
    element.style.left = normalizeUnit(offset[1]) ?? "";
    return;
  }

  if (
    typeof offset === "number" ||
    (typeof offset === "string" && /^\d/.test(offset))
  ) {
    const top = normalizeUnit(offset);
    if (top) {
      element.style.top = top;
    }
    element.style.left = `calc(50% + ${scrollX}px)`;
    element.style.transform = "translateX(-50%)";
    return;
  }

  switch (offset) {
    case "t":
      element.style.top = `${scrollY}px`;
      element.style.left = `calc(50% + ${scrollX}px)`;
      element.style.transform = "translateX(-50%)";
      return;
    case "r":
      element.style.top = `calc(50% + ${scrollY}px)`;
      element.style.right = "0";
      element.style.transform = "translateY(-50%)";
      return;
    case "b":
      element.style.bottom = "0";
      element.style.left = `calc(50% + ${scrollX}px)`;
      element.style.transform = "translateX(-50%)";
      return;
    case "l":
      element.style.top = `calc(50% + ${scrollY}px)`;
      element.style.left = `${scrollX}px`;
      element.style.transform = "translateY(-50%)";
      return;
    case "lt":
      element.style.top = `${scrollY}px`;
      element.style.left = `${scrollX}px`;
      return;
    case "lb":
      element.style.left = `${scrollX}px`;
      element.style.bottom = "0";
      return;
    case "rt":
      element.style.top = `${scrollY}px`;
      element.style.right = "0";
      return;
    case "rb":
      element.style.right = "0";
      element.style.bottom = "0";
      return;
    case "auto":
    default:
      element.style.top = `calc(50% + ${scrollY}px)`;
      element.style.left = `calc(50% + ${scrollX}px)`;
      element.style.transform = "translate(-50%, -50%)";
  }
};

export const applyTipsPlacement = (
  element: HTMLElement,
  target: HTMLElement,
  direction: LayerTipDirection,
  fixed: boolean
): LayerTipDirection => {
  const targetRect = target.getBoundingClientRect();
  const layerRect = element.getBoundingClientRect();
  const scrollX = fixed ? 0 : window.scrollX;
  const scrollY = fixed ? 0 : window.scrollY;
  const gap = 12;
  const margin = 8;
  const viewportLeft = scrollX + margin;
  const viewportTop = scrollY + margin;
  const viewportRight = scrollX + window.innerWidth - margin;
  const viewportBottom = scrollY + window.innerHeight - margin;

  const coordinates = (
    candidate: LayerTipDirection
  ): { left: number; top: number } => {
    switch (candidate) {
      case 1:
        return {
          top: targetRect.top + scrollY - layerRect.height - gap,
          left:
            targetRect.left +
            scrollX +
            (targetRect.width - layerRect.width) / 2,
        };
      case 2:
        return {
          top:
            targetRect.top +
            scrollY +
            (targetRect.height - layerRect.height) / 2,
          left: targetRect.right + scrollX + gap,
        };
      case 3:
        return {
          top: targetRect.bottom + scrollY + gap,
          left:
            targetRect.left +
            scrollX +
            (targetRect.width - layerRect.width) / 2,
        };
      case 4:
      default:
        return {
          top:
            targetRect.top +
            scrollY +
            (targetRect.height - layerRect.height) / 2,
          left: targetRect.left + scrollX - layerRect.width - gap,
        };
    }
  };

  const overflow = ({ left, top }: { left: number; top: number }): number => {
    return (
      Math.max(viewportLeft - left, 0) +
      Math.max(left + layerRect.width - viewportRight, 0) +
      Math.max(viewportTop - top, 0) +
      Math.max(top + layerRect.height - viewportBottom, 0)
    );
  };

  const alternatives: LayerTipDirection[] = [direction, 1, 2, 3, 4];
  let actualDirection = direction;
  let placement = coordinates(direction);
  let leastOverflow = overflow(placement);
  alternatives.forEach((candidate) => {
    const candidatePlacement = coordinates(candidate);
    const candidateOverflow = overflow(candidatePlacement);
    if (candidateOverflow < leastOverflow) {
      actualDirection = candidate;
      placement = candidatePlacement;
      leastOverflow = candidateOverflow;
    }
  });

  placement.left = Math.min(
    Math.max(placement.left, viewportLeft),
    Math.max(viewportRight - layerRect.width, viewportLeft)
  );
  placement.top = Math.min(
    Math.max(placement.top, viewportTop),
    Math.max(viewportBottom - layerRect.height, viewportTop)
  );

  element.style.transform = "";
  element.style.right = "";
  element.style.bottom = "";
  element.style.top = `${placement.top}px`;
  element.style.left = `${placement.left}px`;
  return actualDirection;
};
