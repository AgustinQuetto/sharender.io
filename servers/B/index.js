const express = require("express");
const app = express();
const port = 3001;

const sharender = require("../../sharender.io");

sharender([require.resolve("./controllers/CategoriesController")], "server-B");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
