import layer, {
  close,
  load,
  open,
  type LayerIcon,
  type LayerIconName,
  type LayerOptions,
} from "layer-esm";

const iconName: LayerIconName = "success";
const icon: LayerIcon = iconName;

const options: LayerOptions = {
  content: "Package consumer",
  icon,
  type: 0,
};

const index: number = open(options);
close(index);
layer.open(options);
load("success", { content: "Saved" });
load(1, { content: "Loading" });

// @ts-expect-error Unknown icon aliases are excluded from LayerIconName.
open({ icon: "unknown" });

// @ts-expect-error LayerType intentionally excludes unknown numeric variants.
open({ type: 5 });

// @ts-expect-error HTMLElement tuples are not a supported content shape.
open({ type: 1, content: ["ignored", document.createElement("button")] });
