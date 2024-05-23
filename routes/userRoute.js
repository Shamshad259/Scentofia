const express = require("express");
const user_route = express();
const path = require("path");
const passport = require("passport");
const User = require("../model/userModel");
const userController = require("../controllers/userController");
const cartController = require("../controllers/cartController");
const orderController = require("../controllers/orderController");
const wishlistController = require("../controllers/wishlistController");
const walletController = require("../controllers/walletController");
const couponController = require("../controllers/couponController");
const auth = require("../middlewares/userAuth");

const errorHandling = require('../middlewares/errorHandling')


user_route.set("view engine", "ejs");
user_route.set("views", "./views/user");

user_route.use(passport.initialize());
user_route.use(passport.session());

user_route.use(express.json());
user_route.use(express.urlencoded({ extended: true }));

user_route.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

user_route.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/googleSuccess",
    failureRedirect: "/login",
  })
);

user_route.get("/auth/google/googleSuccess", userController.googleSuccess);

user_route.get("/", auth.isLogout, userController.loadLandingPage);
user_route.get("/register", auth.isLogout, userController.loadRegister);
user_route.post("/register", userController.createUser);
user_route.get("/otp", auth.isLogout,auth.isNoOtp, userController.otpGenerator);
user_route.post("/otp", userController.verifyOtp);

user_route.get("/login", auth.isLogout, userController.loadLogin);
user_route.post("/login",auth.isLogout, userController.verifyLogin);

user_route.get("/home", auth.isLogin, userController.loadHome);
user_route.get("/forgotPassword", auth.isLogout, userController.loadForgot);
user_route.post("/forgotPassword", auth.isLogout, userController.forgotEmail);

user_route.get("/forgotOtp", auth.isLogout,auth.isNoOtp, userController.forgotPasswordOtp);
user_route.post("/forgotOtp", auth.isLogout, userController.verifyForgotOtp);

user_route.get("/newPassword", auth.isLogout, userController.loadNewPassword);
user_route.post("/newPassword", auth.isLogout, userController.updatePassword);

user_route.get("/profile", auth.isLogin, userController.loadProfile);
user_route.get("/profile/manageAddress",auth.isLogin,userController.loadManageAddress);
user_route.get("/profile/manageAddress/addAddress",auth.isLogin,userController.loadAddAddress);
user_route.post("/profile/manageAddress/addAddress",auth.isLogin,userController.addAddress);
user_route.get("/profile/manageAddress/editAddress",auth.isLogin,userController.loadEditAddress);
user_route.post("/profile/manageAddress/editAddress",auth.isLogin,userController.editAddress);
user_route.delete("/profile/manageAddress",auth.isLogin,userController.deleteAddress);
user_route.get("/profile/changePassword",auth.isLogin,userController.loadChangePassword);
user_route.post("/profile/changePassword",auth.isLogin,userController.changePassword);
user_route.post("/profile/editProfile",auth.isLogin,userController.editProfile);
user_route.get("/myOrders",auth.isLogin,orderController.loadMyOrder);
user_route.get("/myOrders/viewDetails",auth.isLogin,orderController.viewDetails);
user_route.get("/cancelOrder",auth.isLogin,orderController.cancelOrder)
user_route.get("/returnItem",auth.isLogin,orderController.returnItem);

user_route.get("/logout", auth.isLogin, userController.userLogout);

user_route.get("/shop",userController.loadShop);
user_route.get("/shop/men",userController.loadMenCategory);
user_route.get("/shop/women",userController.loadWomenCategory);
user_route.get("/productPage", userController.loadProductPage);
user_route.get("/sortFilterSearch",userController.sortFilterSearch);



user_route.get("/addToCart",auth.isLogin,cartController.addToCart);
user_route.get("/cart",auth.isLogin,cartController.loadCart);
user_route.get("/decrementCart",auth.isLogin,cartController.decrementCart);
user_route.get("/incrementCart",auth.isLogin,cartController.incrementCart);
user_route.get("/removeFromCart",auth.isLogin,cartController.removeFromCart);
user_route.get("/stockCheck",auth.isLogin,cartController.stockCheck);
user_route.get("/checkout",auth.isLogin,cartController.loadCheckout);
user_route.post("/checkout",auth.isLogin,cartController.addNewAddress);
user_route.get("/orderFailed",auth.isLogin,orderController.loadOrderFailed);
user_route.get("/orderSuccess",auth.isLogin,orderController.loadOrderSuccess);
user_route.post("/createOrder",auth.isLogin,orderController.createOrder);
user_route.get("/payNow",auth.isLogin,orderController.payNow);
user_route.get("/orderPlacing",auth.isLogin,orderController.orderPlacing);

user_route.get("/addToWishlist",auth.isLogin,wishlistController.addToWishlist);
user_route.get("/removeFromWishlist",auth.isLogin,wishlistController.removeFromWishlist);
user_route.get("/wishlist",auth.isLogin,wishlistController.loadWishlist);

user_route.get("/wallet",auth.isLogin,walletController.loadWallet);
user_route.get("/addMoney",auth.isLogin,walletController.addMoney);
user_route.get("/addingMoney",auth.isLogin,walletController.addingMoney);
user_route.get("/withdrawMoney",auth.isLogin,walletController.withdrawMoney);
user_route.get("/transactionHistory",auth.isLogin,walletController.loadTransactionHistory);

user_route.get("/couponCheck",auth.isLogin,couponController.couponCheck);
user_route.get("/referralLink",auth.isLogin,userController.loadReferralLink);

user_route.use(errorHandling);

user_route.get("/*",userController.loadPageNotFound);

module.exports = user_route;
