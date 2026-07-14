/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
import { babel } from "@rollup/plugin-babel";
import { DEFAULT_EXTENSIONS } from "@babel/core";
import cleaner from "rollup-plugin-cleaner";
import { dts } from "rollup-plugin-dts";
import path from "path";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import { fileURLToPath } from "url";
import { dirname } from "path";
import pkg from "../package.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const fromRoot = (...segments) => path.resolve(projectRoot, ...segments);

const pkgVersion = process.env.SCRIPTS_NPM_PACKAGE_VERSION || process.env.VERSION || pkg.version || "unknown";
const debugMode = process.env.SCRIPTS_NPM_PACKAGE_DEBUG;
const banner =
  "/*!\n" +
  ` * ${pkg.name} v${pkgVersion}\n` +
  ` * (c) 2018-${new Date().getFullYear()} Cheng https://www.npmjs.com/package/${pkg.name}\n` +
  " * Released under the MIT License.\n" +
  " */";

const plugins = [
  resolve({
    extensions: [ ...DEFAULT_EXTENSIONS, ".ts" ],
  }),
  babel({
    babelHelpers: "runtime",
    exclude: /node_modules/,
    extensions: [ ...DEFAULT_EXTENSIONS, ".ts" ],
  }),
  commonjs({
    include: /node_modules/,
  }),
];

const outputPlugins = debugMode === "open"
  ? []
  : [
    terser({
      format: {
        comments: /^!\n\s\*\slayer-esm/,
      },
    }),
  ];

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
        plugins: outputPlugins,
      },
      {
        file: fromRoot("dist/index.mjs"),
        format: "esm",
        banner,
        sourcemap: true,
        plugins: outputPlugins,
      },
    ],
    plugins: [
      cleaner({
        targets: [fromRoot("dist")],
      }),
      ...plugins,
    ],
  },
  {
    input: fromRoot("src/index.ts"),
    output: [
      {
        file: fromRoot("dist/index.d.ts"),
        format: "es",
      },
    ],
    plugins: [
      dts(),
    ],
  },
];
