const express = require("express");
const category_route = express();
const categoryController = require("../controllers/categoryController");

category_route.set("view engine", "ejs");
category_route.set("views", "./views/admin");

category_route.get("/", categoryController.loadCategory);
category_route.get("/addCategory", categoryController.loadAddCategory);
category_route.post("/addCategory", categoryController.addCategory);

category_route.get("/editCategory", categoryController.loadEditCategory);
category_route.post("/editCategory", categoryController.editCategory);

category_route.delete("/deleteCategory", categoryController.deleteCategory);
category_route.get(
  "/deletedCategories",
  categoryController.loadDeletedCategories
);

category_route.get("/restoreCategory", categoryController.restoreCategory);

module.exports = category_route;
