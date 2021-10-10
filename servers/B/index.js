const express = require("express");
const app = express();
const port = 3001;

const CategoriesController = require("./controllers/CategoriesController");

const Sharender = require("../../sharender.io");
const SharenderInstance = new Sharender("server-B");

SharenderInstance.register(CategoriesController, ["Drinks"]);
SharenderInstance.generate(true);

SharenderInstance.listener(app, "express");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
