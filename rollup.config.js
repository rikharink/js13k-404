import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import livereload from "rollup-plugin-livereload";
import dev from "rollup-plugin-dev";
import postcss from "rollup-plugin-postcss";
import image from "@rollup/plugin-image";
import glslify from "rollup-plugin-glslify";
import inline, { defaultTemplate } from "./plugins/rollup-plugin-html-inline";
import packageOutput from "./plugins/rollup-plugin-package-js13k";
const env = process.env.NODE_ENV || "development";

let plugins = [
  glslify({
    compress: true,
  }),
  image(),
  postcss({
    extract: true,
    minimize: true,
    path: "./",
    plugins: [],
  }),
  typescript(),
  terser({
    compress: {
      passes: 4,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_math: true,
    },
    ecma: 8,
    mangle: {
      properties: {
        regex: /^_/
      },
    },
  }),
  inline({
    title: "404: this world does not exist",
    canvasId: "game",
    template: defaultTemplate,
    sourcemap: "main.js.map",
  }),
  packageOutput({
    name: "js13k-template",
    directory: "dist",
    include: ["index.html"],
    notify: env === "development",
  }),
];

if (env === "development") {
  plugins.push(
    dev({
      dirs: ["dist"],
    })
  );
  plugins.push(
    livereload({
      watch: "dist",
    })
  );
}

export default {
  input: "src/main.ts",
  output: [
    {
      name: "prod",
      dir: "dist",
      format: "es",
      sourcemap: true,
      strict: false,
      plugins: [],
    },
  ],
  plugins: plugins,
};
