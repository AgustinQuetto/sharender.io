//const { parse } = require('comment-parser')
const fs = require("fs");

class Sharender {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.topics = [];
    this.mapping = {};
  }

  register(topic, autogenerate) {
    this.topics.push(topic);
    if (autogenerate) this.generate();
  }

  generate(writeJsonFile) {
    this.mapping = this.topics.reduce((prev, c) => {
      if (c) {
        /* const source = fs.readFileSync(
          curr.endsWith(".js") ? curr : `${curr}.js`,
          "utf8"
        ); */
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
          const parameters = this.getParamNames(instance[methodInstance]);
          const url = `/${name}/${methodInstance}`;
          const _package = url.replace(/\//g, "_");
          mapping.methods.instance[methodInstance] = {
            parameters,
            endpoint: { url, body: parameters },
            socket: { name: { get: `get${_package}`, set: `set${_package}` } },
          };
        });
        const staticOnly = Object.getOwnPropertyNames(c).filter(
          (prop) => typeof c[prop] === "function"
        );
        staticOnly.map((methodStatic) => {
          const parameters = this.getParamNames(c[methodStatic]);
          const url = `/${name}/${methodStatic}`;
          const _package = url.replace(/\//g, "_");
          mapping.methods.static[methodStatic] = {
            parameters,
            endpoint: { url, body: parameters },
            socket: {
              name: {
                get: `get_static${_package}`,
                set: `set_static${_package}`,
              },
            },
          };
        });
        prev[name] = mapping;
      }
      return prev;
    }, {});

    if (writeJsonFile)
      fs.writeFileSync(
        `./${this.serviceName}-map.json`,
        JSON.stringify(this.mapping, null, 4)
      );
    return this.mapping;
  }

  getParamNames(func) {
    return new RegExp("(?:" + func.name + "\\s*|^)\\s*\\((.*?)\\)")
      .exec(func.toString().replace(/\n/g, ""))[1]
      .replace(/\/\*.*?\*\//g, "")
      .replace(/ /g, "")
      .split(",")
      .filter((v) => v);
  }
}

module.exports = Sharender;
