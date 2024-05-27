const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const Product = require("../model/productModel");
const Category = require("../model/categoryModel");
const session = require("express-session");

const loadCategory = async (req, res,next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const categoryData = await Category.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isDeleted: false,
    });
    res.render("category", { category: categoryData });
  } catch (error) {
    next(error);
  }
};

const loadAddCategory = async (req, res,next) => {
  try {
    res.render("add-category");
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res,next) => {
  try {
    const already = await Category.find({
      name: { $regex: req.body.categoryName, $options: "i" },
    });
    if(already.length>0){
      return res.render("add-category",{message:"This category already exists"});
    }
    await new Category({ name: req.body.categoryName }).save();
    res.redirect("/admin/category");
  } catch (error) {
    next(error);
  }
};

const loadEditCategory = async (req, res,next) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });
    if (category) {
      res.render("edit-category", { category: category });
    }
  } catch (error) {
    next(error);
  }
};

const editCategory = async (req, res,next) => {
  try {
    const already = await Category.findOne({name:req.body.categoryName});
    if(already){
      return res.redirect("/admin/category");
    }
    await Category.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { name: req.body.categoryName } }
    );
    res.redirect("/admin/category");
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res,next) => {
  try {
    await Category.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { isDeleted: true } }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const loadDeletedCategories = async (req, res,next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const categoryData = await Category.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isDeleted: true,
    });
    res.render("deleted-categories", { category: categoryData });
  } catch (error) {
    next(error);
  }
};

const restoreCategory = async (req, res,next) => {
  try {
    await Category.findByIdAndUpdate(
      { _id: req.query.id },
      { $set: { isDeleted: false } }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadCategory,
  loadAddCategory,
  addCategory,
  loadEditCategory,
  editCategory,
  deleteCategory,
  loadDeletedCategories,
  restoreCategory,
};
