/* eslint-disable @typescript-eslint/no-var-requires, no-undef */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");
const _resolve = (_path) => path.resolve(__dirname, _path);
const distDevPath = _resolve("../dist-dev");

module.exports = {
  mode: "development",
  entry: {
    index: _resolve("../examples/index.ts"),
  },
  output: {
    filename: "[name].js",
    path: distDevPath,
  },
  devServer: {
    port: 8080,
    host: "0.0.0.0",
    static: {
      directory: distDevPath,
    },
    allowedHosts: [
      ".mazey.net",
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: _resolve("../examples/index.html"),
      inject: true,
    }),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [ "**/*" ],
      cleanStaleWebpackAssets: false,
    }),
  ],
  resolve: {
    extensions: [ ".tsx", ".ts", ".js" ],
  },
};
