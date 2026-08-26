/** @jest-environment node */
/* eslint-disable no-undef */

const fs = require("node:fs");
const path = require("node:path");
const {
  bootstrapIconDefinitions,
} = require("../src/icons/bootstrap-icons.generated.ts");

test("generated definitions match the installed Bootstrap Icons SVG paths", () => {
  for (const definition of Object.values(bootstrapIconDefinitions)) {
    const source = fs.readFileSync(
      path.resolve(
        __dirname,
        "../node_modules/bootstrap-icons/icons",
        `${definition.bootstrapName}.svg`
      ),
      "utf8"
    );
    const viewBox = source.match(/viewBox="([^"]+)"/)?.[1];
    const paths = [...source.matchAll(/<path\b([^>]*)\/>/g)].map((match) => ({
      d: match[1].match(/\bd="([^"]+)"/)?.[1],
      fillRule: match[1].match(/\bfill-rule="([^"]+)"/)?.[1],
    }));

    expect(definition.viewBox).toBe(viewBox);
    expect(definition.paths).toEqual(paths);
  }
});
