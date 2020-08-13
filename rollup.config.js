import { terser } from "rollup-plugin-terser";
import livereload from 'rollup-plugin-livereload'
import dev from "rollup-plugin-dev";
import postcss from "rollup-plugin-postcss";
import image from "@rollup/plugin-image";
import glslify from "rollup-plugin-glslify";
import inline, { defaultTemplate } from "./plugins/rollup-plugin-html-inline";
import packageOutput from "./plugins/rollup-plugin-package-js13k";
export default {
  input: "src/main.js",
  output: [
    {
      name: "prod",
      dir: "dist",
      format: "es",
      sourcemap: "inline",
      strict: false,
      plugins: [],
    },
  ],
  plugins: [
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
    // terser({
    //   compress: {
    //     passes: 4,
    //     unsafe: true,
    //     unsafe_arrows: true,
    //     unsafe_comps: true,
    //     unsafe_math: true,
    //   },
    //   ecma: 8,
    //   mangle: true,
    //   module: {
    //     properties: {
    //       reserved: [],
    //     },
    //   },
    // }),
    inline({
      title: "js13k-template",
      canvasId: "game",
      template: defaultTemplate,
    }),
    packageOutput({
      name: "js13k-template",
      directory: "dist",
    }),
    dev({
      dirs: ["dist"],
    }),
    livereload({
      watch: "dist"
    })
  ],
};
