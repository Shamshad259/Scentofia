const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: ObjectId, ref: "Category", required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  newPrice: { type: Number },
  quantity: { type: Number, required: true },
  addedToWishlist: { type: Boolean, required: true, default: false },
  images: [{ type: String, required: true }],
  date: { type: Date, required: true },
  isDeleted: { type: Boolean, required: true, default: false },
});

module.exports = mongoose.model("Product", productSchema);
