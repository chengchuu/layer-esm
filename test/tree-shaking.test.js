/** @jest-environment node */

const fs = require("node:fs");
const path = require("node:path");
const { rollup } = require("rollup");

test("a msg-only consumer drops unrelated dialog APIs", async () => {
  const projectRoot = path.resolve(__dirname, "..");
  const bundle = await rollup({
    input: path.join(projectRoot, "audit-reproductions/tree-shake-entry.mjs"),
  });
  const generated = await bundle.generate({ format: "esm" });
  await bundle.close();

  const msgOnlySize = Buffer.byteLength(generated.output[0].code);
  const fullEsmSize = fs.statSync(
    path.join(projectRoot, "dist/index.mjs")
  ).size;
  expect(msgOnlySize).toBeLessThan(fullEsmSize * 0.65);
});
