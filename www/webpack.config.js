const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require('path');
const webpack = require('webpack');
const package = require("./package.json");

module.exports = {
  entry: "./bootstrap.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bootstrap.js",
  },
  mode: "development",
  plugins: [
    new CopyWebpackPlugin(['index.html']),
    new webpack.DefinePlugin({
      DELAUNATOR_JS_VERSION: JSON.stringify(package.dependencies.delaunator)
    })
  ],
};
