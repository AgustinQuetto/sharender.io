//const { parse } = require('comment-parser')
const fs = require("fs");

class Sharender {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.instances = {};
    this.statics = {};
    this.mapping = {};
    this.topics = [];
  }

  register(topic, args) {
    this.instances[topic.name] = new topic(...args);
    this.statics[topic.name] = topic;
    this.topics.push(topic.name);
  }

  generate(writeJsonFile) {
    this.mapping = this.topics.reduce((prev, topic) => {
      const source = fs.readFileSync(
        curr.endsWith(".js") ? curr : `${curr}.js`,
        "utf8"
      );

      const instance = this.instances[topic];
      const _static = this.statics[topic];
      const mapping = {
        instance,
        static: _static,
        constructor: Object.keys(instance),
        methods: { instance: {}, static: {} },
      };
      const { name, prototype } = _static;
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
      const staticOnly = Object.getOwnPropertyNames(_static).filter(
        (prop) => typeof _static[prop] === "function"
      );
      staticOnly.map((methodStatic) => {
        const parameters = this.getParamNames(_static[methodStatic]);
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

  listener(listener, type) {
    if (!type) {
      console.error("listener type missing");
      return;
    }

    this[type](listener);
  }

  express(app) {
    Object.entries(this.mapping).map(([name, configuration]) => {
      const { methods } = configuration;
      const { instance, static: _static } = methods;
      Object.entries(instance).map(([methodName, methodConfiguration]) => {
        const { endpoint, parameters } = methodConfiguration;
        app.get(endpoint.url, (req, res) => {
          const paramValues = { ...req.params, ...req.body };
          const params = parameters.map((p) => paramValues[p]);
          const output = this.instances[name][methodName](...params);
          return typeof output === "object"
            ? res.json(output)
            : res.send(output);
        });
      });
    });
  }
}

module.exports = Sharender;
