const Wallet = require("../model/walletModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel");
const Wishlist = require("../model/wishlistModel")
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RazorpayId,
  key_secret: process.env.RazorpaySecret,
});

const loadWallet = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const wallet = await Wallet.findOne({ userId: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    if(cart){
      cartCount = cart.items.length;
    }
    res.render("wallet", { user: userData, wallet: wallet,cartCount:cartCount,wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const loadTransactionHistory = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.session.user_id });
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    if(cart){
      cartCount = cart.items.length;
    }
    res.render("transaction-history", { user: userData, wallet : wallet , cartCount:cartCount,wishlistCount:wishlistCount});
  } catch (error) {
    next(error);
  }
};

const addMoney = async (req, res, next) => {
  try {
    const amount = req.query.amount * 100;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: "scentofia@gmail.com",
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      success: true,
      message: "Order Created",
      order_id: order.id,
      amount: amount,
      key_id: razorpay.key_id,
    });
  } catch (error) {
    next(error);
  }
};

const addingMoney = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.session.user_id });
    if (!wallet) {
      wallet = await new Wallet({
        userId: req.session.user_id,
        balance: 0,
        history: [],
      });
    }
    wallet.history.push({
      amount: req.query.amount,
      transactionType: "Credit",
      newBalance: wallet.balance + Number(req.query.amount),
    });
    wallet.balance += Number(req.query.amount);
    wallet.save();
    res.redirect("/wallet");
  } catch (error) {
    next(error);
  }
};

const withdrawMoney = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.session.user_id });
    wallet.history.push({
        amount:req.query.amount,
        transactionType:"Debit",
        newBalance:wallet.balance - Number(req.query.amount)
    });
    wallet.balance -= Number(req.query.amount);
    await wallet.save();
    res.json({success:true});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadWallet,
  loadTransactionHistory,
  addMoney,
  addingMoney,
  withdrawMoney,
};
