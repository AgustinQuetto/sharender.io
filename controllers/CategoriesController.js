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
}

module.exports = CategoriesController;
