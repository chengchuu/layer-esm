import { bootstrapIconDefinitions } from "./bootstrap-icons.generated";
import type { EmbeddedBootstrapIconDefinition } from "./bootstrap-icons.generated";
import type { LayerIcon, LayerIconName } from "../core/types";

const names = Object.keys(bootstrapIconDefinitions) as LayerIconName[];
const numericDefinitions = names.map((name) => bootstrapIconDefinitions[name]);

export interface LayerIconDescriptor {
  numericValue: number;
  definition: EmbeddedBootstrapIconDefinition;
}

export function assertLayerIcon(icon: unknown): asserts icon is LayerIcon {
  if (
    typeof icon === "string" &&
    !Object.prototype.hasOwnProperty.call(bootstrapIconDefinitions, icon)
  ) {
    throw new TypeError(
      `Unknown layer icon name: "${icon}". Expected one of: ${names.join(
        ", "
      )}.`
    );
  }
}

export const resolveLayerIcon = (
  icon: LayerIcon
): LayerIconDescriptor | null => {
  const numericValue =
    typeof icon === "string"
      ? bootstrapIconDefinitions[icon].legacyValue
      : icon;
  if (!(numericValue >= 0)) return null;
  return {
    numericValue,
    definition:
      numericDefinitions[Math.min(numericValue, 6)] ??
      bootstrapIconDefinitions.warning,
  };
};
