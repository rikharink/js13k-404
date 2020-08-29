function getAlphabetFromNumber(num) {
    let str = "";
    let multiples = Math.ceil(num / 26);
    let _charAtCode = num - ((multiples - 1) * 26)
    for (let i = 0; i < multiples; i++)
        str += String.fromCharCode(_charAtCode + 96);
    return str;
}

function mangle(name, table) {
    if (!table[name]) {
        let index = Object.keys(table).length;
        let newName = name.substring(0, 2) + getAlphabetFromNumber(index + 1);
        table[name] = newName;
    }
    return table[name];
}

export default function minifyShaders(options = {}) {
  return {
    name: "rollup-plugin-shader-minify",
    generateBundle(_, bundle, isWrite) {
      console.log("SHADER MINIFY");
      if (!isWrite) return;
      Object.keys(bundle).forEach((o) => {
        const entry = bundle[o];
        if (entry.fileName.endsWith("js")) {
          let source = entry.code;
          let regex = /([^a-zA-Z0-9])([uav]_[a-zA-Z0-9]+)/g;
          // Match placeholder
          let match;
          // Our table of replacement names
          let table = {};
          while (match = regex.exec(source)) {
              // Mangle the name... we'll need to define this!
              let name = mangle(match[2], table);
              // Modify the source code
              source = source.substring(0, match.index) + match[1] + name + source.substring(match.index + match[0].length);
              // Fudge the regular expression's last index
              regex.lastIndex -= match[2].length - name.length;
          }
          delete entry.code;
          entry.code = source;
          console.log(table);
        }
      });
    },
  };
}
