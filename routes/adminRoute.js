const express = require("express");
const admin_route = express();
const adminController = require("../controllers/adminController");
const orderController = require("../controllers/orderController");
const offerController =require("../controllers/offerController");
const couponController = require("../controllers/couponController")
const adminAuth = require("../middlewares/adminAuth");
const errorHandling = require('../middlewares/errorHandling')

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const path = require("path");
const admin_user_route = require("./adminUserRoute");
const product_route = require("./productRoute");
const category_route = require("./categoryRoute");

admin_route.get("/", adminAuth.isLogout, adminController.loadLogin);
admin_route.post("/", adminAuth.isLogout, adminController.verifyLogin);

admin_route.get("/dashboard", adminAuth.isLogin, adminController.loadDashboard);
admin_route.get("/logout", adminAuth.isLogin, adminController.adminLogout);

admin_route.use("/users", adminAuth.isLogin, admin_user_route);
admin_route.use("/products", adminAuth.isLogin, product_route);
admin_route.use("/category", adminAuth.isLogin, category_route);
admin_route.get("/orders",adminAuth.isLogin,orderController.loadOrdersList);
admin_route.get("/orders/changeStatus",adminAuth.isLogin,orderController.changeStatus);
admin_route.get("/orders/returnApproval",adminAuth.isLogin,orderController.returnApproval);

admin_route.get("/productOffer",adminAuth.isLogin,offerController.loadProductOffer);
admin_route.post("/productOffer",adminAuth.isLogin,offerController.addProductOffer);
admin_route.delete("/productOffer",adminAuth.isLogin,offerController.removeProductOffer);
admin_route.get("/categoryOffer",adminAuth.isLogin,offerController.loadCategoryOffer);
admin_route.post("/categoryOffer",adminAuth.isLogin,offerController.addCategoryOffer);
admin_route.delete("/categoryOffer",adminAuth.isLogin,offerController.removeCategoryOffer);

admin_route.get("/coupons",adminAuth.isLogin,couponController.loadAddCoupon);
admin_route.post("/coupons",adminAuth.isLogin,couponController.addCoupon);
admin_route.delete("/coupons",adminAuth.isLogin,couponController.deleteCoupon);
admin_route.get("/coupons/edit",adminAuth.isLogin,couponController.loadEditCoupon);
admin_route.post("/coupons/edit",adminAuth.isLogin,couponController.editCoupon);

admin_route.get("/salesReport",adminController.loadSalesReport)
admin_route.get("/filterInterval",adminAuth.isLogin,adminController.filterInterval);
admin_route.get("/filter",adminAuth.isLogin,adminAuth.isLogin,adminController.filterReport);



admin_route.use(errorHandling);

admin_route.use("/*",adminController.loadPageNotFound);

module.exports = admin_route;
