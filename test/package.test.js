/* eslint-disable no-undef */

const fs = require("node:fs");
const path = require("node:path");
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

test("package includes the Bootstrap Icons notice without runtime icon assets", () => {
  expect(pkg.files).toContain("guides/THIRD_PARTY_NOTICES.md");
  const notice = fs.readFileSync(
    path.resolve(__dirname, "../guides/THIRD_PARTY_NOTICES.md"),
    "utf8"
  );
  const bootstrapLicense = fs
    .readFileSync(
      path.resolve(__dirname, "../node_modules/bootstrap-icons/LICENSE"),
      "utf8"
    )
    .trim();
  expect(notice).toContain("Bootstrap Icons 1.13.1");
  expect(notice).toContain(bootstrapLicense);
  expect(pkg.dependencies).not.toHaveProperty("bootstrap-icons");

  for (const file of pkg.files) {
    expect(file).not.toMatch(/\.(?:svg|woff2?|ttf|eot)$/i);
  }
});

test("built formats embed icon paths and declarations expose named icons", () => {
  const bundles = ["dist/index.mjs", "dist/index.cjs"].map((file) =>
    fs.readFileSync(path.resolve(__dirname, "..", file), "utf8")
  );
  const declaration = fs.readFileSync(
    path.resolve(__dirname, "../dist/index.d.ts"),
    "utf8"
  );

  bundles.forEach((bundle) => {
    expect(bundle).toContain("exclamation-lg");
    expect(bundle).toContain("emoji-smile");
    expect(bundle).not.toMatch(/(?:from\s+|require\()["']bootstrap-icons/);
    expect(bundle).not.toMatch(/\.svg["']/);
  });
  expect(declaration).toContain("type LayerIconName =");
  expect(declaration).toContain("type LayerIcon = number | LayerIconName");
  expect(declaration).toMatch(/declare const load: \(icon\?: LayerIcon,/);
});
