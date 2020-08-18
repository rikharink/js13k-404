const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { execFile } = require("child_process");
const advzip = require("advzip-bin");
const notifier = require("node-notifier");
const filesize = require("filesize");
const zipstats = require("zipstats");

function notifyFilesize(title, path) {
  const stat = fs.statSync(path);
  const size = filesize(stat.size);
  console.log(zipstats(path));
  notifier.notify({
    title: title,
    message: `${size}`,
    wait: false,
    sound: false,
  });
}

export default function packageJs13k(
  options = {
    name: "",
    directory: "",
    notify: false,
    include: undefined,
    exclude: undefined,
  }
) {
  return {
    name: "rollup-plugin-package-js13k",
    writeBundle(_, bundle) {
      return new Promise((resolve, reject) => {
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });
        const outputPath = path.join(options.directory, `${options.name}.zip`);
        const output = fs.createWriteStream(outputPath);
        output.on("close", () => {
          execFile(
            advzip,
            ["--recompress", "--shrink-insane", outputPath],
            (err) => {
              if (err) {
                reject(err);
              } else {
                if (options.notify) {
                  notifyFilesize("Archive Size", outputPath);
                }
                console.log("done");
                resolve();
              }
            }
          );
        });
        archive.pipe(output);

        Object.keys(bundle).forEach((k) => {
          const entry = bundle[k];
          const include =
            !options.include || options.include.includes(entry.fileName);
          const exclude =
            !options.exclude || !options.include.includes(entry.fileName);
          const process = include && exclude;
          if (process) {
            if (entry.type === "asset") {
              const { source } = entry;
              if (source) {
                const buffer = Buffer.from(source, "utf8");
                archive.append(buffer, { name: entry.fileName });
              }
            } else {
              const { code } = entry;
              if (code) {
                const buffer = Buffer.from(code, "utf8");
                archive.append(buffer, { name: entry.fileName });
              }
            }
          }
        });
        archive.finalize();
      });
    },
  };
}
