const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const couponSchema = mongoose.Schema({
  couponCode: { type: String },
  minPrice: { type: Number },
  offerPercentage: { type: Number },
  maxRedeemable: { type: Number },
  expiryDate: { type: Date, index: { expires: 0 } },
});

module.exports = mongoose.model("coupon", couponSchema);
