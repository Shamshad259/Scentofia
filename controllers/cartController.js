const { session } = require("passport");
const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const Address = require("../model/addressModel");
const Coupon = require("../model/couponModel");
const Wishlist = require("../model/wishlistModel");

const addToCart = async (req, res, next) => {
  try {
    const id = req.query.id;
    const already = await Cart.findOne({ userId: req.session.user_id });
    if (!already) {
      const cartItem = await new Cart({
        userId: req.session.user_id,
        items: [{ productId: id }],
      });
      await cartItem.save();
      return res.json({ success: true });
    } else {
      let flag = 0;
      already.items.forEach((item) => {
        if (item.productId == id) {
          flag = 1;
        }
      });
      if (flag == 0) {
        await Cart.updateOne(
          { userId: req.session.user_id },
          {
            $push: {
              items: { productId: id },
            },
          }
        );
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    }
  } catch (error) {
    next(error);
  }
};

const loadCart = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id }).populate(
      "items.productId"
    );
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    res.render("cart", { user: userData, cart: cart,cartCount:cartCount, wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const decrementCart = async (req, res, next) => {
  try {
    const index = req.query.index;
    const item = await Cart.findOne({ userId: req.session.user_id });
    item.items[index].quantity--;
    item.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const incrementCart = async (req, res, next) => {
  try {
    const index = req.query.index;
    const item = await Cart.findOne({ userId: req.session.user_id });
    item.items[index].quantity++;
    item.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const index = req.query.index;
    await cart.items.splice(index, 1);
    cart.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const stockCheck = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.user_id }).populate(
      "items.productId"
    );

    let isAvailable = true;
    let message;
    for (let item of cart.items) {
      if (item.productId.quantity === 0) {
        isAvailable = false;
        message = "Some items in your cart is currently unavailable";
      } else if (item.quantity > item.productId.quantity) {
        item.quantity = item.productId.quantity;
        await cart.save();
        isAvailable = false;
        message =
          "Some item's quantity in your cart is greater than the stock available";
      }
    }

    if (isAvailable) {
      res.json({ success: true, message: "All items are available" });
    } else {
      res.json({ success: false, message: message });
    }
  } catch (error) {
    next(error);
  }
};

const loadCheckout = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const addresses = await Address.findOne({ userId: req.session.user_id });
    const coupon = await Coupon.find();
    const cart = await Cart.findOne({ userId: req.session.user_id }).populate(
      "items.productId"
    );
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    let discount;
    if(req.query.coupon){
      const appliedCoupon = await Coupon.findOne({ couponCode: req.query.coupon });
      discount = Math.ceil(
        (appliedCoupon.offerPercentage * req.session.totalPrice) / 100
      );
      if (discount > appliedCoupon.maxRedeemable) {
        discount = appliedCoupon.maxRedeemable;
      }
    }
    if(req.session.discount){
      discount = req.session.discount;
      delete req.session.discount;
    }
    if (cart && cart.items.length > 0) {
        cartCount = cart.items.length;
      return res.render("checkout", {
        user: userData,
        addresses: addresses,
        cart: cart,
        cartCount:cartCount,
        coupons: coupon,
        discount: discount,
        wishlistCount:wishlistCount
      });
    } else {
      return res.redirect("/shop");
    }
  } catch (error) {
    next(error);
  }
};

const addNewAddress = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    let address = await Address.findOne({ userId: req.session.user_id });
    if (!address) {
      address = await new Address({
        userId: userData._id,
        address: [],
      });
    }

    const { name, mobile, pincode, house, locality, city, state, addressType } =
      req.body;

    address.address.push({
      name: name,
      mobile: mobile,
      pincode: pincode,
      house: house,
      locality: locality,
      city: city,
      state: state,
      type: addressType,
    });

    if(req.body.discount){
      req.session.discount = req.body.discount;
    }

    await address.save();
    res.redirect("/checkout");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addToCart,
  loadCart,
  decrementCart,
  incrementCart,
  removeFromCart,
  stockCheck,
  loadCheckout,
  addNewAddress,
};
