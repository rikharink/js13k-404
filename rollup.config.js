import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
import livereload from "rollup-plugin-livereload";
import dev from "rollup-plugin-dev";
import postcss from "rollup-plugin-postcss";
import image from "@rollup/plugin-image";
import glslify from "./plugins/rollup-plugin-glslify";
import { join } from "path";
import inline, { defaultTemplate } from "./plugins/rollup-plugin-html-inline";
import shaderMinify from "./plugins/rollup-plugin-shader-minify";
import packageOutput from "./plugins/rollup-plugin-package-js13k";
const env = process.env.NODE_ENV || "development";
const isDev = env === "development";

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
  shaderMinify(),
  terser({
    compress: {
      passes: 4,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_math: true,
    },
    ecma: 8,
    // mangle: false,
    mangle: {
      properties: {
        regex: /^_/
      },
    },
  }),
  inline({
    title: "404",
    canvasId: "g",
    template: defaultTemplate,
    sourcemap: "bundle.js.map",
    delete: false,
  }),
  packageOutput({
    name: "js13k-404",
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
  input: join(__dirname, "src", "main.ts"),
  output: {
    file: join(__dirname, "dist", "bundle.js"),
    format: "iife",
    sourcemap: true,
    strict: false
  },
  plugins: plugins,
};
