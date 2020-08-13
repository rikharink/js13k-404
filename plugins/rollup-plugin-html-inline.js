var minify = require("html-minifier").minify;

export const defaultTemplate = (options, script, style) =>
  `<title>${options.title}</title>
<style>${style}</style>
<canvas id="${options.canvasId}"></canvas>
<script>${script}</script>`;

export default function inline(
  options = {
    title: "js13k-template",
    canvasId: "game",
    template: undefined,
  }
) {
  return {
    name: "rollup-plugin-html-inline",
    generateBundle(_, bundle, isWrite) {
      if (!isWrite) return;
      const renderTemplate = options.template || defaultTemplate;
      const scripts = [];
      const styles = [];
      
      Object.keys(bundle).forEach((o) => {
        const entry = bundle[o];
        if (entry.fileName.endsWith("js")) {
          scripts.push(entry.type == "chunk" ? entry.code : entry.source);
        }
        if (entry.fileName.endsWith("css")) {
          styles.push(entry.type == "chunk" ? entry.code : entry.source);
        }
        delete bundle[o];
      });
      const output = {
        fileName: "index.html",
        name: "index",
        source: minify(renderTemplate(options, scripts.join(), styles.join()), {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeComments: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true,
          removeRedundantAttributes: true,
          html5: true,
        }),
        type: "asset",
      };
      this.emitFile(output);
    },
  };
}
