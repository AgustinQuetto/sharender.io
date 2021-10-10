class ProductsController {
  constructor(name = "") {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }

  static message(text) {
    return `description: ${text}`;
  }
}

ProductsController.sharender = {
  getName: {
    endpoint: "/products/:name",
    method: "post",
  },
};

module.exports = ProductsController;
