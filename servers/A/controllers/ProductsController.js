//product
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

module.exports = ProductsController;
