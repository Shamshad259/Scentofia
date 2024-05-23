const Wishlist = require("../model/wishlistModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel");

const loadWishlist = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    let wishlist = await Wishlist.find({
      userId: req.session.user_id,
    }).populate("items.productId");
    wishlist = wishlist[0];
    let wishlistCount = wishlist?wishlist.items.length:0;
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if(cart){
      cartCount = cart.items.length;
    }
    res.render("wishlist", { user: userData, wishlist: wishlist,cartCount:cartCount, wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const productId = req.query.productId;
    let wishlist = await Wishlist.findOne({ userId: req.session.user_id });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.session.user_id,
        items: [{ productId: productId }],
      });
      await wishlist.save();
    } else {
      await Wishlist.updateOne(
        { userId: req.session.user_id },
        { $push: { items: { productId: productId } } }
      );
    }

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const productId = req.query.productId;
    await Wishlist.updateOne(
      { userId: req.session.user_id },
      { $pull: { items: { productId: productId } } }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadWishlist,
  addToWishlist,
  removeFromWishlist,
};
