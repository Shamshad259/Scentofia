const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const Category = require("../model/categoryModel");
const Product = require("../model/productModel");
const session = require("express-session");
const sharp = require("sharp");
const fs = require("fs");

const loadProducts = async (req, res,next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 5;

    let productData = await Product.aggregate([
      {
        $match: {
          name: { $regex: ".*" + search + ".*", $options: "i" },
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {$sort:{date:-1}}
    ]);


    const totalProducts = await Product.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isDeleted: false,
    });

    productData = productData.slice(skip,skip+5);

    const totalPages = Math.ceil(totalProducts / 5);

    res.render("products", {
      products: productData,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const loadAddProduct = async (req, res,next) => {
  try {
    const category = await Category.find();
    res.render("add-product", { category: category });
  } catch (error) {
    next(error);
  }
};
const addProduct = async (req, res, next) => {
  try {
      const { productName, categoryName, price, quantity, productDescription } = req.body;
      const category = await Category.findOne({ name: categoryName });
      const product = new Product({
          name: productName,
          categoryId: category._id,
          price: price,
          quantity: quantity,
          description: productDescription,
          date: new Date(),
      });

      for (const file of req.files) {
          product.images.push(file.filename);
      }

      await product.save();
      res.redirect("/admin/products");
  } catch (error) {
      next(error);
  }
};


const deleteProduct = async (req, res,next) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(
      { _id: productId },
      { $set: { isDeleted: 1 } }
    );
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};

const loadDeletedProducts = async (req, res,next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 5;

    const productData = await Product.aggregate([
      {
        $match: {
          name: { $regex: ".*" + search + ".*", $options: "i" },
          isDeleted: true,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $skip: skip },
      { $limit: 5 },
    ]);

    const totalProducts = await Product.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isDeleted: true,
    });

    const totalPages = Math.ceil(totalProducts / 5);

    res.render("deleted-products", {
      products: productData,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const restoreProduct = async (req, res,next) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(
      { _id: productId },
      { $set: { isDeleted: 0 } }
    );

    res
      .status(200)
      .json({ success: true, message: "Product restored successfully" });
  } catch (error) {
    next(error);
  }
};

const loadEditProduct = async (req, res,next) => {
  try {
    const id = req.query.id;
    const category = await Category.find();
    const prod = await Product.findOne({ _id: id });
    const product = await Product.aggregate([
      { $match: { _id: prod._id } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);
    if (product) {
      res.render("edit-product", { product: product, category: category });
    }
  } catch (error) {
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  try {
    const { categoryName, productName, price, quantity, productDescription } = req.body;
    const id = req.query.id;
    const category = await Category.findOne({ name: categoryName });
    const product = await Product.findByIdAndUpdate(
      { _id: id },
      {
        $set: {
          name: productName,
          categoryId: category._id,
          price: price,
          quantity: quantity,
          description: productDescription,
        },
      }
    );
    if (req.body.deletedIndices) {
      const deletedIndices = JSON.parse(req.body.deletedIndices);
      for (let index of deletedIndices) {
        product.images.splice(Number(index), 1);
      }
    }
    for (const file of req.files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = `cropped_${uniqueSuffix}_${file.originalname}`;
      await sharp(file.path)
        .resize({ width: 600, height: 600, fit: "cover" })
        .toFile(`./public/Product Images/${filename}`);
      product.images.push(filename);
    }
    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  loadProducts,
  loadAddProduct,
  addProduct,
  deleteProduct,
  loadDeletedProducts,
  restoreProduct,
  loadEditProduct,
  editProduct,
};
