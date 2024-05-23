const Product_Offer = require("../model/productOfferModel");
const Category_Offer = require("../model/categoryOfferModel");
const Product = require("../model/productModel");
const Catergory = require("../model/categoryModel");
const Coupon = require("../model/couponModel");

const loadAddCoupon = async (req, res, next) => {
  try {
    let coupons = await Coupon.find();
    res.render("coupon", { coupons: coupons });
  } catch (error) {
    next(error);
  }
};

const addCoupon = async (req, res, next) => {
  try {
    const { couponCode, offerPercentage, minPrice, maxRedeemable, expiryDate } =
      req.body;
    let coupon = await Coupon.findOne({ couponCode: couponCode });
    if (!coupon) {
      coupon = await new Coupon({
        couponCode: couponCode,
        offerPercentage: offerPercentage,
        minPrice: minPrice,
        maxRedeemable: maxRedeemable,
        expiryDate: expiryDate,
      });
      await coupon.save();
    }
    res.redirect("/admin/coupons");
  } catch (error) {
    next(error);
  }
};

const deleteCoupon = async (req, res, next) => {
  try {
    await Coupon.deleteOne({ _id: req.query.id });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const loadEditCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.query.id });
    res.render("edit-coupon", { coupon: coupon });
  } catch (error) {
    next(error);
  }
};

const editCoupon = async (req, res, next) => {
  try {
    const { couponCode, offerPercentage, minPrice, maxRedeemable, expiryDate } =
      req.body;
    const coupon = await Coupon.updateOne(
      { _id: req.query.id },
      {
        $set: {
          couponCode: couponCode,
          offerPercentage: offerPercentage,
          minPrice: minPrice,
          maxRedeemable: maxRedeemable,
          expiryDate: expiryDate,
        },
      }
    );
    res.redirect("/admin/coupons")
  } catch (error) {
    next(error);
  }
};

const couponCheck = async (req, res, next) => {
  try {
    const coupon = await Coupon.findOne({ couponCode: req.query.couponCode });
    if (!coupon) {
      return res.json({ success: true, message: "Not Valid Coupon" });
    } else if (coupon.minPrice > req.query.totalPrice) {
      return res.json({
        success: true,
        message: "Not Eligible for this coupon",
      });
    } else {
      req.session.totalPrice = req.query.totalPrice;
      return res.json({ success: true, coupon: coupon.couponCode });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadAddCoupon,
  addCoupon,
  deleteCoupon,
  loadEditCoupon,
  editCoupon,
  couponCheck,
};
