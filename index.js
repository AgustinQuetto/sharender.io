//const { parse } = require('comment-parser')
const fs = require("fs");
const files = [
  "./controllers/ProductController",
  "./controllers/CategoriesController",
];
const Mapps = files.reduce((prev, curr) => {
  if (curr) {
    const c = require(curr);
    const source = fs.readFileSync(
      curr.endsWith(".js") ? curr : `${curr}.js`,
      "utf8"
    );
    const instance = new c();
    const mapping = {
      instance,
      static: c,
      constructor: Object.keys(instance),
      methods: { instance: {}, static: {} },
    };
    const { name, prototype } = c;
    const instanceOnly = Object.getOwnPropertyNames(prototype).filter(
      (prop) => prop != "constructor"
    );
    instanceOnly.map((methodInstance) => {
      const parameters = getParamNames(instance[methodInstance]);
      const url = `/${name}/${methodInstance}`;
      const package = url.replace(/\//g, "_");
      mapping.methods.instance[methodInstance] = {
        parameters,
        endpoint: { url, body: parameters },
        socket: { name: { get: `get${package}`, set: `set${package}` } },
      };
    });
    const staticOnly = Object.getOwnPropertyNames(c).filter(
      (prop) => typeof c[prop] === "function"
    );
    staticOnly.map((methodStatic) => {
      const parameters = getParamNames(c[methodStatic]);
      const url = `/${name}/${methodStatic}`;
      const package = url.replace(/\//g, "_");
      mapping.methods.static[methodStatic] = {
        parameters,
        endpoint: { url, body: parameters },
        socket: {
          name: { get: `get_static${package}`, set: `set_static${package}` },
        },
      };
    });
    prev[name] = mapping;
  }
  return prev;
}, {});

function getParamNames(func) {
  return new RegExp("(?:" + func.name + "\\s*|^)\\s*\\((.*?)\\)")
    .exec(func.toString().replace(/\n/g, ""))[1]
    .replace(/\/\*.*?\*\//g, "")
    .replace(/ /g, "")
    .split(",")
    .filter((v) => v);
}

fs.writeFileSync("./maps.json", JSON.stringify(Mapps, null, 4));
