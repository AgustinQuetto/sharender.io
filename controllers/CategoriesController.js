//categories
class CategoriesController {
  constructor(categoriesNames = []) {
    this.categoriesNames = categoriesNames;
  }

  getCategories() {
    return this.categoriesNames;
  }

  addCategory(name, adds) {
    this.categoriesNames.push(name);
  }

  static message(arr) {
    return `categories: ${arr.join(",")}`;
  }
}

module.exports = CategoriesController;
