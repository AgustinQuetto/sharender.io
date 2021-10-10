const express = require("express");
const app = express();
const port = 3000;

const ProductsController = require("./controllers/ProductsController");

const Sharender = require("../../sharender.io");
const SharenderInstance = new Sharender("server-A");

SharenderInstance.register(ProductsController, ["Coffee"]);
SharenderInstance.generate(true);
SharenderInstance.listener(app, "express");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
