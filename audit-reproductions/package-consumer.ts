import layer, { close, open, type LayerOptions } from "layer-esm";

const options: LayerOptions = {
  content: "Package consumer",
  type: 0,
};

const index: number = open(options);
close(index);
layer.open(options);

// @ts-expect-error LayerType intentionally excludes unknown numeric variants.
open({ type: 5 });

// @ts-expect-error HTMLElement tuples are not a supported content shape.
open({ type: 1, content: ["ignored", document.createElement("button")] });
