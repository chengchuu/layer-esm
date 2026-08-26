/* eslint-disable no-undef */

const pkg = require("../package.json");

test("package files include every declared entry point and source map", () => {
  const publishedFiles = new Set(pkg.files);
  const entryPoints = [pkg.main, pkg.module, pkg.types].map((file) =>
    file.replace(/^\.\//, "")
  );

  [...entryPoints, `${entryPoints[0]}.map`, `${entryPoints[1]}.map`].forEach(
    (file) => expect(publishedFiles).toContain(file)
  );
});
