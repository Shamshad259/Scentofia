const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const Address = require("../model/addressModel");
const Order = require("../model/orderModel");
const Product = require("../model/productModel");
const Wallet = require("../model/walletModel");
const Referral = require("../model/referralModel");
const Wishlist = require("../model/wishlistModel");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const razorpay = new Razorpay({
  key_id: process.env.RazorpayId,
  key_secret: process.env.RazorpaySecret,
});

const createOrder = async (req, res, next) => {
  try {
    const cartData = await Cart.findOne({ userId: req.session.user_id })
      .populate("items.productId")
      .populate({
        path: "items.productId",
        populate: {
          path: "categoryId",
          model: "Category",
        },
      });
    const addressId = new ObjectId(req.body.selectedAddress);
    const addressArray = await Address.aggregate([
      { $unwind: "$address" },
      { $match: { "address._id": addressId } },
    ]);
    if (!addressArray || addressArray.length === 0 || !cartData) {
      return res.redirect("/cart");
    }

    const address = addressArray[0].address;

    const orderData = await new Order({
      orderId: Math.floor(100000 + Math.random() * 900000),
      userId: req.session.user_id,
      paymentMethod: req.body.paymentMethod,
      totalPrice: req.body.totalPrice,
      address: {
        name: address.name,
        mobile: address.mobile,
        pincode: address.pincode,
        house: address.house,
        locality: address.locality,
        city: address.city,
        state: address.state,
      },
      items: [],
    });
    for (const item of cartData.items) {
      let finalPrice = item.productId.price;
      if (item.productId.newPrice) {
        finalPrice = item.productId.newPrice;
      }
      orderData.items.push({
        productId: item.productId._id,
        productName: item.productId.name,
        categoryName: item.productId.categoryId.name,
        image: item.productId.images[0],
        quantity: item.quantity,
        price: item.productId.price,
        finalPrice: finalPrice,
      });
      await Product.findByIdAndUpdate(
        { _id: item.productId._id },
        { $inc: { quantity: -item.quantity } }
      );
    }
    if (orderData.paymentMethod === "razorpay") {
      const amount = req.body.totalPrice * 100;
      const options = {
        amount: amount,
        currency: "INR",
        receipt: process.env.RazorpayReceipt,
      };

      req.session.orderData= orderData;

      const order = await razorpay.orders.create(options);
      return res.json({
        success: true,
        message: "Order Created",
        order_id: order.id,
        amount: amount,
        key_id: razorpay.key_id,
      });
    } else if (orderData.paymentMethod === "wallet") {
      let wallet = await Wallet.findOne({ userId: req.session.user_id });
      if (wallet?.balance < req.body.totalPrice || !wallet) {
        return res.json({ success: true, message: "Insufficient Balance" });
      }
      wallet.balance -= req.body.totalPrice;
      wallet.history.push({
        amount: req.body.totalPrice,
        transactionType: "Debit",
        newBalance: wallet.balance,
      });
      wallet.save();
      orderData.paymentStatus = "Done";
    }

    if (orderData.paymentMethod === "cod") {
      if(req.body.totalPrice>1000){
        return res.json({success:true,message:"Cannot place order in COD"})
      }
      orderData.paymentStatus = "Pending";
    }

    req.session.orderData =  orderData;
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const loadOrderSuccess = async (req, res, next) => {
  try {
    if (!req.session.orderData) {
      return res.redirect("/shop");
    }
    const userData = await User.findOne({ _id: req.session.user_id });
    const orderData = new Order(req.session.orderData);
    delete req.session.orderData;
    delete req.session.totalPrice;
    if (orderData.paymentMethod === "razorpay") {
      orderData.paymentStatus = "Done";
    }
    await orderData.save();
    await Cart.deleteOne({ userId: req.session.user_id })
    const referral = await Referral.findOne({ userId: req.session.user_id });
    if (referral) {
      let referredBy = await User.findOne({referralId:referral.referralId})
      let userWallet = await Wallet.findOne({ userId: req.session.user_id });
      if (!userWallet) {
        userWallet = new Wallet({
          userId: req.session.user_id,
          balance: 0,
          history: [],
        });
      }
      userWallet.history.push({
        amount: 50,
        transactionType: "Credit",
        newBalance: userWallet.balance + 50,
      });
      userWallet.balance += 50;
      await userWallet.save();

      let referralWallet = await Wallet.findOne({
        userId: referredBy._id,
      });
      if (!referralWallet) {
        referralWallet = new Wallet({
          userId: req.session.user_id,
          balance: 0,
          history: [],
        });
      }
      referralWallet.history.push({
        amount: 100,
        transactionType: "Credit",
        newBalance: referralWallet.balance + 100,
      });
      referralWallet.balance += 100;
      await referralWallet.save();
      await Referral.deleteOne({ userId: req.session.user_id })
    }

    res.render("order-success", { user: userData, order: orderData });
  } catch (error) {
    next(error);
  }
};

const loadOrderFailed = async (req, res, next) => {
  try {
    if (!req.session.orderData) {
      return res.redirect("/shop");
    }
    const userData = await User.findOne({ _id: req.session.user_id });
    const orderData = new Order(req.session.orderData);
    delete req.session.orderData;
    delete req.session.totalPrice;
    orderData.paymentStatus = "Pending";
    orderData.status = "Pending";
    for (let item of orderData.items) {
      item.itemStatus = "Pending";
    }
    await orderData.save();
    await Cart.deleteOne({ userId: req.session.user_id })
    res.render("order-failed", { user: userData, order: orderData });
  } catch (error) {
    next(error);
  }
};

const loadMyOrder = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 5;
    const orderData = await Order.find({ userId: req.session.user_id })
      .sort({ date: -1 })
      .skip(skip)
      .limit(5);

    const totalOrders = await Order.countDocuments({
      userId: req.session.user_id,
    });
    const totalPages = Math.ceil(totalOrders / 5);
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if(cart){
      cartCount = cart.items.length;
    }
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    }


    res.render("my-order", {
      user: userData,
      orders: orderData,
      currentPage: page,
      totalPages: totalPages,
      cartCount:cartCount,
      wishlistCount:wishlistCount
    });
  } catch (error) {
    next(error);
  }
};

const loadOrdersList = async (req, res, next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 5;

    let orderData;

    if (search) {
      orderData = await Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $match: {
            $or: [
              { "user.Name": { $regex: ".*" + search + ".*", $options: "i" } },
              {
                status: { $regex: ".*" + search + ".*", $options: "i" },
              },
              {
                paymentStatus: { $regex: ".*" + search + ".*", $options: "i" },
              },
              {
                orderId: { $regex: ".*" + search + ".*", $options: "i" },
              },
            ],
          },
        },
        { $sort: { date: -1 } },
        { $skip: skip },
        { $limit: 5 },
      ]);
    } else {
      orderData = await Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $sort: { date: -1 } },
        { $skip: skip },
        { $limit: 5 },
      ]);
    }

    const totalOrders = await Order.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.Name": { $regex: ".*" + search + ".*", $options: "i" },
        },
      },
      { $count: "totalOrders" },
    ]);

    const totalPages =
      totalOrders.length > 0 ? Math.ceil(totalOrders[0].totalOrders / 5) : 0;

    res.render("orders", {
      orders: orderData,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    next(error);
  }
};

const viewDetails = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const order = await Order.findOne({ _id: req.query.orderId });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    order.items.forEach((item) => {
      if (item.productId == req.query.pId) {
        const product = item;
    let cartCount = 0;
    if(cart){
      cartCount = cart.items.length;
    }
    let orders = order.items.filter((item)=>{
      if(item.itemStatus==="Ordered"||item.itemStatus==="Shipped"||item.itemStatus==="Delivered"){
        return item;
      }
    });
        return res.render("view-order-details", {
          user: userData,
          order: order,
          orders:orders,
          item: product,
          cartCount:cartCount,
          wishlistCount:wishlistCount
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.query.orderId });

    let completed = 1;
    order.items.forEach((item) => {
      if (item._id == req.query.itemId) {
        item.itemStatus = req.query.currentStatus;
      }
      if (
        item.itemStatus !== "Delivered" &&
        item.itemStatus !== "Cancelled" &&
        item.itemStatus !== "Returned"
      ) {
        completed = 0;
      }
    });

    if (completed == 1) {
      order.status = "Completed";
      order.paymentStatus = "Done";
    } else {
      order.status = "Ordered";
    }
    await order.save();
    res.json({
      success: true,
      status: order.status,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.query.orderId });
    let wallet = await Wallet.findOne({ userId: req.session.user_id });
    let completed = 1;
    let refund = 0;
    for (let item of order.items) {
      if (item.productId == req.query.pId) {
        if (item.itemStatus !== "Delivered") {
          item.itemStatus = "Cancelled";
          refund = 1;
          await Product.findByIdAndUpdate(
            { _id: item.productId },
            { $inc: { quantity: item.quantity } }
          );
        }
      }

      if (refund === 1 && order.paymentStatus == "Done") {
        if (!wallet) {
          wallet = await new Wallet({
            userId: req.session.user_id,
            balance: 0,
            history: [],
          });
        }
        wallet.history.push({
          amount: item.finalPrice * item.quantity,
          transactionType: "Credit",
          newBalance: wallet.balance + Number(item.finalPrice * item.quantity),
        });
        wallet.balance += Number(item.finalPrice * item.quantity);
        await wallet.save();
      }

      if (
        item.itemStatus !== "Delivered" &&
        item.itemStatus !== "Cancelled" &&
        item.itemStatus !== "Returned"
      ) {
        completed = 0;
      }
      refund = 0;
    }

    if (completed == 1) {
      order.status = "Completed";
      order.paymentStatus = "Done";
    } else {
      order.status = "Ordered";
    }

    await order.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const returnItem = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.query.orderId });
    const itemId = new ObjectId(req.query.itemId);
    for (let item of order.items) {
      if (item._id.toString() === itemId.toString()) {
        item.itemStatus = "Return Pending";
        item.reason = req.query.reason;
      }
    }
    order.save();
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const returnApproval = async (req, res, next) => {
  try {
    const { orderId, isApproved, isDamaged, itemId } = req.query;
    const order = await Order.findOne({ _id: orderId });
    let wallet = await Wallet.findOne({ userId: req.session.user_id });
    let completed = 1;
    for (let item of order.items) {
      if (item._id == itemId) {
        if (isApproved === "Approve") {
          item.itemStatus = "Returned";
          item.isApproved = true;
          if (!wallet) {
            wallet = await new Wallet({
              userId: req.session.user_id,
              balance: 0,
              history: [],
            });
          }
          wallet.history.push({
            amount: item.finalPrice,
            transactionType: "Credit",
            newBalance:
              wallet.balance + Number(item.finalPrice * item.quantity),
          });
          wallet.balance += Number(item.finalPrice * item.quantity);
          await wallet.save();
          if (isDamaged == 0) {
            await Product.findByIdAndUpdate(
              { _id: item.productId },
              { $inc: { quantity: item.quantity } }
            );
          }
        } else {
          item.itemStatus = "Delivered";
          item.isApproved = false;
        }
      }
      if (
        item.itemStatus !== "Delivered" &&
        item.itemStatus !== "Cancelled" &&
        item.itemStatus !== "Returned"
      ) {
        completed = 0;
      }
    }

    if (completed == 1) {
      order.status = "Completed";
      order.paymentStatus = "Done";
    } else {
      order.status = "Ordered";
    }
    await order.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};


const payNow = async(req,res,next)=>{
  try {
    const amount = req.query.amount * 100;
    const orderId = req.query.orderId;
    const options = {
      amount: amount,
      currency: "INR",
      receipt: process.env.RazorpayReceipt,
    };

    const order = await razorpay.orders.create(options);
    return res.json({
      success: true,
      message: "Order Created",
      order_id: order.id,
      amount: amount,
      key_id: razorpay.key_id,
      orderId:orderId
    });
  } catch (error) {
    next(error);
  }
};

const orderPlacing = async(req,res,next)=>{
  try {
    console.log(req.query.orderId);
    const orderData = await Order.findOne({_id:req.query.orderId});
    orderData.paymentStatus = "Done";
    orderData.status = "Ordered";
    for (let item of orderData.items) {
      item.itemStatus = "Ordered";
    }
    await orderData.save();
    res.redirect("/myOrders")
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  loadOrderSuccess,
  loadOrderFailed,
  loadMyOrder,
  loadOrdersList,
  cancelOrder,
  returnItem,
  viewDetails,
  changeStatus,
  returnApproval,
  payNow,
  orderPlacing
};
