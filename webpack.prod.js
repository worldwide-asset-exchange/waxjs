const path = require("path");

module.exports = {
  entry: {
    waxjs: "./src/index.ts",
  },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.web.json",
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    library: "[name]",
    path: path.resolve(__dirname, "dist-web"),
  },
};
