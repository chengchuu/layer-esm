/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
import { babel } from "@rollup/plugin-babel";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import { dts } from "rollup-plugin-dts";
import { rmSync } from "node:fs";
import path, { dirname } from "node:path";
import terser from "@rollup/plugin-terser";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const fromRoot = (...segments) => path.resolve(projectRoot, ...segments);

const pkgVersion =
  process.env.SCRIPTS_NPM_PACKAGE_VERSION ||
  process.env.VERSION ||
  pkg.version ||
  "unknown";
const debugMode = process.env.SCRIPTS_NPM_PACKAGE_DEBUG;
const banner =
  "/*!\n" +
  ` * ${pkg.name} v${pkgVersion}\n` +
  ` * (c) 2018-${new Date().getFullYear()} Cheng https://www.npmjs.com/package/${
    pkg.name
  }\n` +
  " * Released under the MIT License.\n" +
  " */";

const plugins = [
  nodeResolve({
    extensions: [...DEFAULT_EXTENSIONS, ".ts"],
  }),
  babel({
    babelHelpers: "bundled",
    exclude: /node_modules/,
    extensions: [...DEFAULT_EXTENSIONS, ".ts"],
  }),
];

const cjsOutputPlugins =
  debugMode === "open"
    ? []
    : [
        terser({
          format: {
            comments: /^!\n\s\*\slayer-esm/,
          },
        }),
      ];

const cleanDist = {
  name: "clean-dist",
  buildStart() {
    rmSync(fromRoot("dist"), { recursive: true, force: true });
  },
};

export default [
  {
    input: fromRoot("src/index.ts"),
    output: [
      {
        file: fromRoot("dist/index.cjs"),
        format: "cjs",
        banner,
        exports: "named",
        sourcemap: true,
        plugins: cjsOutputPlugins,
      },
      {
        file: fromRoot("dist/index.mjs"),
        format: "esm",
        banner,
        sourcemap: true,
      },
    ],
    plugins: [cleanDist, ...plugins],
  },
  {
    input: fromRoot("src/index.ts"),
    output: [
      {
        file: fromRoot("dist/index.d.ts"),
        format: "es",
      },
    ],
    plugins: [dts()],
  },
];
