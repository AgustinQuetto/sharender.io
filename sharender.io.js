const axios = require("axios");
const fs = require("fs");

class Sharender {
  constructor(serviceName) {
    this.serviceName = serviceName;
    this.instances = {};
    this.statics = {};
    this.mapping = {};
    this.source_code = {};
    this.topics = [];
    this.consumer = "";
    this.connections = {};
    this.interfaces = {};
  }

  register(topic, args) {
    const { name } = topic;
    this.instances[name] = new topic(...args);
    this.statics[name] = topic;
    this.source_code[name] = String(topic);
    this.topics.push(topic.name);
  }

  generate(writeJsonFile) {
    this.mapping = this.topics.reduce((prev, topic) => {
      /*       const source = fs.readFileSync(
        curr.endsWith(".js") ? curr : `${curr}.js`,
        "utf8"
      ); */
      const instance = this.instances[topic];
      const _static = this.statics[topic];
      const settings = _static.sharender || {};
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
        const method = settings?.[methodInstance]?.method;
        const url =
          settings?.[methodInstance]?.endpoint || `/${name}/${methodInstance}`;
        const _package = url.replace(/\//g, "_");
        mapping.methods.instance[methodInstance] = {
          parameters,
          method: method || "post",
          endpoint: { url, body: parameters },
          socket: { name: { get: `get${_package}`, set: `set${_package}` } },
        };
      });
      const staticOnly = Object.getOwnPropertyNames(_static).filter(
        (prop) => typeof _static[prop] === "function"
      );
      staticOnly.map((methodStatic) => {
        const parameters = this.getParamNames(_static[methodStatic]);
        const method = settings?.[methodStatic]?.method;
        const _url = settings?.[methodStatic]?.endpoint;
        const url = _url ? `/static${_url}}` : `/${name}/${methodStatic}`;
        const _package = url.replace(/\//g, "_");
        mapping.methods.static[methodStatic] = {
          parameters,
          endpoint: { url, body: parameters, method: method || "post" },
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
        const { endpoint, parameters, method } = methodConfiguration;
        app[method](endpoint.url, (req, res) => {
          const paramValues = { ...req.params, ...req.body };
          const params = parameters.map((p) => paramValues[p]);
          const output = this.instances[name][methodName](...params);
          return typeof output === "object"
            ? res.json(output)
            : res.send(output);
        });
      });
    });
    app.get("/sharender/map", (req, res, next) => res.json(this.mapping));
    this.consumer = "express";
  }

  service(name, address) {
    switch (this.consumer) {
      case "express":
        this.connections[name] = address;
        break;
      default:
        break;
    }
  }

  consume() {
    switch (this.consumer) {
      case "express":
        Object.entries(this.connections).map(async ([service, address]) => {
          const serviceMap = await axios.get(`${address}/sharender/map`);
          if (serviceMap && serviceMap.status === 200) {
            const { data: map } = serviceMap;
            const interfaceData = {};
            Object.entries(map).map(
              ([name, { instance, constructor, methods }]) => {
                interfaceData[name] = { static: {}, instance: {} };
                const { instance: _instance, static: _static } = methods;
                Object.entries(_instance).map(
                  ([methodName, methodConfiguration]) => {
                    interfaceData[name].instance[methodName] = function () {
                      return new Promise(async (resolve, rejected) => {
                        try {
                          const body =
                            {}; /* methodConfiguration.endpoint.body.reduce(([]) */
                          const response = await axios[
                            methodConfiguration.method
                          ](`${address}${methodConfiguration.endpoint.url}`);
                          return resolve(response.data);
                        } catch (e) {
                          return rejected(e);
                        }
                      });
                    };
                  }
                );
              }
            );
            this[service] = interfaceData;
            console.log(
              await this[
                "server-B"
              ].CategoriesController.instance.getCategories("hola")
            );
          }
        });
        break;
      default:
        break;
    }
  }
}

module.exports = Sharender;
