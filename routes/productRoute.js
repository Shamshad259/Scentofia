const express = require("express");
const product_route = express();
const productController = require("../controllers/productController");
const multer = require("multer");
const path = require("path");

product_route.set("view engine", "ejs");
product_route.set("views", "./views/admin");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "../public/Product Images"));
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, 'cropped-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

product_route.post('/upload-cropped-image', upload.single('croppedImage'), (req, res) => {
  res.json({ filePath: `/public/Product Images/${req.file.filename}` });
});

product_route.get("/", productController.loadProducts);
product_route.get("/addProduct", productController.loadAddProduct);
product_route.post("/addProduct", upload.array("images"), productController.addProduct);

product_route.get("/deletedProducts", productController.loadDeletedProducts);
product_route.get("/editProduct", productController.loadEditProduct);
product_route.post(
  "/editProduct",
  upload.array("images"),
  productController.editProduct
);

product_route.delete("/:id", productController.deleteProduct);
product_route.get("/:id", productController.restoreProduct);

module.exports = product_route;
