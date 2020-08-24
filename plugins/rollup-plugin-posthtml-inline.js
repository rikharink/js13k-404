const posthtml = require('posthtml');
const posthtmlInlineAssets = require('posthtml-inline-assets');

export default function inline(options = {}) {
  return {
    name: "rollup-plugin-posthtml-inline",
    generateBundle(_, bundle, isWrite) {
      if (!isWrite) return;
      Object.keys(bundle).forEach((o) => {
        const entry = bundle[o];
        if (entry.fileName.endsWith("html")) {
            posthtml([
                posthtmlInlineAssets({
                    cwd: "./dist",
                    root: "./dist",
                })
              ]).process(entry.source).then(x => console.log(x.html));
        }
      });
    },
  };
}
