/** @jest-environment node */

test("the package can be imported without browser globals", () => {
  jest.resetModules();
  expect(() => require("../src/index.ts")).not.toThrow();
  const runtime = require("../src/index.ts");
  expect(() => runtime.msg("Unavailable")).toThrow(/browser Document/);
});
