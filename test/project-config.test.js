/** @jest-environment node */

const {
  packageDetails,
  repositoryDetails,
} = require("../scripts/project-config-utils.cjs");
const projectConfig = require("../project.config.cjs");

test("project configuration is deeply frozen", () => {
  expect(Object.isFrozen(projectConfig)).toBe(true);
  expect(Object.isFrozen(projectConfig.site)).toBe(true);
  expect(Object.isFrozen(projectConfig.site.theme.primary.light)).toBe(true);
});

describe("project configuration adapters", () => {
  test("retains the Layer bundle name alias", () => {
    expect(packageDetails({ name: "@example/layer-package" })).toMatchObject({
      unscopedName: "layer-package",
      bundleBaseName: "layer-package",
    });
  });

  test.each([
    "git+https://github.com/chengchuu/layer-esm.git",
    { url: "git@github.com:chengchuu/layer-esm.git" },
  ])("adapts package repository value %# through Mazey", (repository) => {
    expect(repositoryDetails(repository)).toEqual({
      owner: "chengchuu",
      name: "layer-esm",
      slug: "chengchuu/layer-esm",
      url: "https://github.com/chengchuu/layer-esm",
    });
  });

  test.each([
    undefined,
    {},
    { url: "" },
    "https://gitlab.com/chengchuu/layer-esm",
  ])("rejects invalid package repository value %#", (repository) => {
    expect(() => repositoryDetails(repository)).toThrow();
  });
});
