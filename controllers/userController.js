const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const session = require("express-session");
const nodemailer = require("nodemailer");
const Product = require("../model/productModel");
const Product_Offer = require("../model/productOfferModel");
const Category_Offer = require("../model/categoryOfferModel");
const Wishlist = require("../model/wishlistModel");
const Referral = require("../model/referralModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Category = require("../model/categoryModel");
const Address = require("../model/addressModel");
const Cart = require("../model/cartModel");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const offerPrice = async (products) => {
  try {
    let updatedProducts = [];
    const productOffer = await Product_Offer.find().populate("productId");
    const categoryOffer = await Category_Offer.find().populate("categoryId");

    for (let product of products) {
      let productOfferMatch = 0;
      let categoryOfferMatch = 0;``
      let productOfferPercentage;
      let categoryOfferPercentage;

      for (let offer of productOffer) {
        if (offer.productId._id.toString() === product._id.toString()) {
          productOfferMatch = 1;
          productOfferPercentage = offer.offerPercentage;
          break;
        }
      }

      for (let offer of categoryOffer) {
        if (offer.categoryId._id.toString() === product.categoryId.toString()) {
          categoryOfferMatch = 1;
          categoryOfferPercentage = offer.offerPercentage;
          break;
        }
      }

      if (categoryOfferMatch === 1 && productOfferMatch === 1) {
        if (categoryOfferPercentage > productOfferPercentage) {
          await Product.updateOne(
            { _id: product._id },
            {
              newPrice:
                product.price -
                Math.ceil((product.price * categoryOfferPercentage) / 100),
            }
          );
        } else {
          await Product.updateOne(
            { _id: product._id },
            {
              newPrice:
                product.price -
                Math.ceil((product.price * productOfferPercentage) / 100),
            }
          );
        }
      } else if (categoryOfferMatch === 1) {
        await Product.updateOne(
          { _id: product._id },
          {
            newPrice:
              product.price -
              Math.ceil((product.price * categoryOfferPercentage) / 100),
          }
        );
      } else if (productOfferMatch === 1) {
        await Product.updateOne(
          { _id: product._id },
          {
            newPrice:
              product.price -
              Math.ceil((product.price * productOfferPercentage) / 100),
          }
        );
      } else {
        if (product.newPrice) {
          await Product.updateOne(
            { _id: product._id },
            { $unset: { newPrice: "" } }
          );
        }
      }
      const updatedProduct = await Product.findOne({ _id: product._id });
      updatedProducts.push(updatedProduct);
    }

    return updatedProducts;
  } catch (error) {
    return [];
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    res.send(error.message);
  }
};

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

const sendOTPEmail = (recipientEmail, otp) => {
  const mailOption = {
    from: process.env.Email,
    to: recipientEmail,
    subject: "SCENTOFIA OTP",
    text: `Your OTP code for registration is ${otp}`,
  };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: true,
    auth: {
      user: process.env.Email,
      pass: process.env.Pass,
    },
  });

  transporter.sendMail(mailOption, (error, info) => {
    if (error) {
      console.log(error.message);
    } else {
      console.log("Success!!!");
    }
  });
};

const loadLandingPage = async (req, res, next) => {
  try {
    let products = await Product.find({ isDeleted: 0 })
      .sort({ date: -1 })
      .limit(6);
    products = await offerPrice(products);
    res.render("landing-page", { products: products });
  } catch (error) {
    next(error);
  }
};

const loadRegister = async (req, res, next) => {
  try {
    if (req.session.message) {
      const message = req.session.message;
      delete req.session.message;
      return res.render("register", { message: message });
    }
    res.render("register");
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const spassword = await securePassword(req.body.password);
    const existingUser = await User.findOne({ Email: req.body.email });
    if (existingUser) {
      req.session.message = "Sorry...This email already exists";
      return res.redirect("/register");
    }

    const user = new User({
      Name: req.body.name,
      Email: req.body.email,
      Mobile: req.body.mobile,
      Password: spassword,
    });
    if (req.query.referralId) {
      const referral = await new Referral({
        userId: user._id,
        referralId: req.query.referralId,
      });
      req.session.referral = referral;
    }
    req.session.user = user;
    if (req.session.user) {
      res.redirect(`/otp`);
    }
  } catch (error) {
    next(error);
  }
};

const otpGenerator = async (req, res, next) => {
  try {
    const recipientEmail = req.session.user.Email;
    const otp = generateOTP();
    req.session.otp = otp;

    setTimeout(() => {
      delete req.session.otp;
    }, 59000);
    console.log(req.session.otp);

    sendOTPEmail(recipientEmail, otp);
    res.render("otp-register");
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    if (req.body.otp == req.session.otp) {
      delete req.session.otp;
      const user = new User(req.session.user);
      delete req.session.user;
      const userData = await user.save();
      if (req.session.referral) {
        const referral = await new Referral(req.session.referral);
        await referral.save();
        delete req.session.referral;
      }
      if (userData) {
        return res.json({ success: true });
      }
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    next(error);
  }
};

const loadLogin = async (req, res, next) => {
  try {
    if (req.session.message) {
      let message = req.session.message;
      delete req.session.message;
      return res.render("login", { message: message });
    }
    res.render("login");
  } catch (error) {
    next(error);
  }
};

const verifyLogin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ Email: email });

    if (userData) {
      if (userData.IsBlocked == true) {
        return res.render("login", { message: "You are Blocked by the Admin" });
      } else {
        const passwordMatch = await bcrypt.compare(password, userData.Password);

        if (passwordMatch) {
          req.session.user_id = userData._id;
          return res.redirect("/home");
        } else {
          return res.render("login", { message: "Password is Incorrect" });
        }
      }
    } else {
      return res.render("login", { message: "No user Found" });
    }
  } catch (error) {
    next(error);
  }
};

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.ClientID,
//       clientSecret: process.env.ClientSecret,
//       callbackURL: "https://scentofia.shop/auth/google/callback",
//       passReqToCallback: true,
//     },
//     (request, accessToken, refreshToken, profile, done) => {
//       done(null, profile);
//     }
//   )
// );

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

const googleSuccess = async (req, res, next) => {
  try {
    let userData = await User.findOne({ Email: req.user.emails[0].value });
    if (!userData) {
      userData = new User({
        Name: req.user.displayName,
        Email: req.user.emails[0].value,
      });
      await userData.save();
    }
    req.session.user_id = userData._id;
    res.redirect("/home");
  } catch (error) {
    next(error);
  }
};

const loadForgot = async (req, res, next) => {
  try {
    if (req.session.message) {
      const message = req.session.message;
      delete req.session.message;
      res.render("forgot-password-1", { message: message });
    } else {
      res.render("forgot-password-1");
    }
  } catch (error) {
    next(error);
  }
};

const forgotEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({ Email: req.body.email });
    if (user) {
      req.session.user_email = req.body.email;
      res.redirect("/forgotOtp");
    } else {
      req.session.message = "No such User found";
      res.redirect("/forgotPassword");
    }
  } catch (error) {
    next(error);
  }
};

const forgotPasswordOtp = async (req, res, next) => {
  try {
    const recipientEmail = req.session.user_email;
    const otp = generateOTP();
    req.session.otp = otp;
    sendOTPEmail(recipientEmail, otp);

    setTimeout(() => {
      delete req.session.otp;
    }, 59000);
    console.log(req.session.otp);
    res.render("otp-forgot");
  } catch (error) {
    next(error);
  }
};

const verifyForgotOtp = async (req, res, next) => {
  try {
    if (req.body.otp == req.session.otp) {
      delete req.session.otp;
      return res.json({ success: true });
    } else {
      return res.json({ success: false });
    }
  } catch (error) {
    next(error);
  }
};

const loadNewPassword = async (req, res, next) => {
  try {
    res.render("newPassword");
  } catch (error) {
    next(error);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const spassword = await securePassword(req.body.newPassword);
    const userData = await User.updateOne(
      { Email: req.session.user_email },
      { $set: { Password: spassword } }
    );
    if (userData) {
      delete req.session.user_email;
      res.redirect("/login");
    }
  } catch (error) {
    next(error);
  }
};

const loadHome = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.session.user_id });
    let products = await Product.find({ isDeleted: 0 })
      .sort({ date: -1 })
      .limit(6);
    products = await offerPrice(products);
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });

    let wishlistCount = 0;
    if (wishlist) {
      wishlist = wishlist.items;
      wishlistCount = wishlist.length;
      console.log(wishlist.length);
    }
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }

    res.render("home", {
      user: userData,
      products: products,
      cart: cart,
      cartCount: cartCount,
      wishlist: wishlist,
      wishlistCount: wishlistCount,
    });
  } catch (error) {
    next(error);
  }
};

const loadProfile = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    res.render("profile", { user: userData, cartCount: cartCount,wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const loadManageAddress = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const addresses = await Address.find({ userId: userData._id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    res.render("manage-address", {
      user: userData,
      addresses: addresses,
      cartCount: cartCount,
      wishlistCount:wishlistCount
    });
  } catch (error) {
    next(error);
  }
};

const loadAddAddress = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    }
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    res.render("add-address", { user: userData, cartCount: cartCount,wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
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
      type: addressType,
      mobile: mobile,
      pincode: pincode,
      house: house,
      locality: locality,
      city: city,
      state: state,
    });

    await address.save();
    res.redirect("/profile/manageAddress");
  } catch (error) {
    next(error);
  }
};

const loadEditAddress = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const address = await Address.findOne({ userId: req.session.user_id });
    if (!address.address[req.query.index]) {
      return res.redirect("/profile/manageAddress");
    }
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    res.render("edit-address", {
      user: userData,
      address: address,
      index: req.query.index,
      cartCount: cartCount,
      wishlistCount:wishlistCount
    });
  } catch (error) {
    next(error);
  }
};

const editAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ userId: req.session.user_id });
    const index = req.query.index;
    const { name, mobile, pincode, house, locality, city, state, addressType } =
      req.body;
    address.address[index].name = name;
    address.address[index].mobile = mobile;
    address.address[index].pincode = pincode;
    address.address[index].house = house;
    address.address[index].locality = locality;
    address.address[index].city = city;
    address.address[index].state = state;
    address.address[index].type = addressType;
    address.save();

    res.redirect("/profile/manageAddress");
  } catch (error) {
    next(error);
  }
};

const deleteAddress = async (req, res, next) => {
  try {
    const address = await Address.findOne({ userId: req.session.user_id });
    const index = req.query.index;
    await address.address.splice(index, 1);
    await address.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const editProfile = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const { name, mobile } = req.body;
    userData.Name = name;
    userData.Mobile = mobile;

    await userData.save();
    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
};

const loadChangePassword = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    res.render("change-password", { user: userData, cartCount: cartCount,wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    if (userData) {
      const passwordMatch = await bcrypt.compare(
        req.body.oldPassword,
        userData.Password
      );
      if (passwordMatch) {
        const spassword = await securePassword(req.body.newPassword);
        userData.Password = spassword;
        await userData.save();
        return res.json({ success: true });
      } else {
        return res.json({ success: false });
      }
    }
  } catch (error) {
    next(error);
  }
};

const userLogout = async (req, res, next) => {
  try {
    delete req.session.user_id;
    res.redirect("/");
  } catch (error) {
    next(error);
  }
};

const loadShop = async (req, res, next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 3;

    let wishlistItems;
    const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
    let wishlistCount = 0;
    if (wishlist) {
      wishlistItems = wishlist.items;
      wishlistCount = wishlistItems.length;
    }
    const userData = await User.findOne({ _id: req.session.user_id });
    let productData = await Product.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isDeleted: false,
    })
      .skip(skip)
      .limit(3);

    productData = await offerPrice(productData);

    const totalProducts = await Product.countDocuments({
      name: { $regex: ".*" + search + ".*", $options: "i" },
      isDeleted: false,
    });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }

    const totalPages = Math.ceil(totalProducts / 3);
    res.render("shop", {
      user: userData,
      products: productData,
      totalPages: totalPages,
      currentPage: page,
      wishlist: wishlistItems,
      search: "",
      selectedCategories: "",
      sortOption: "",
      minPrice: 0,
      maxPrice: 0,
      cartCount: cartCount,
      wishlistCount:wishlistCount
    });
  } catch (error) {
    next(error);
  }
};

const sortFilterSearch = async (req, res, next) => {
  try {
    const { sortOption, searchQuery, selectedCategories, minPrice, maxPrice } =
      req.query;
    let products;

    let wishlistItems;
    const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
    let wishlistCount = 0;
    if (wishlist) {
      wishlistItems = wishlist.items;
      wishlistCount = wishlistItems.length;
    }
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * 3;

    switch (sortOption) {
      case "newArrival":
        products = await Product.find({ isDeleted: false }).sort({ date: -1 });
        break;
      case "priceLowToHigh":
        products = await Product.aggregate([
          { $match: { isDeleted: false } },
          { $addFields: { sortPrice: { $ifNull: ["$newPrice", "$price"] } } },
          { $sort: { sortPrice: 1 } },
        ]);
        break;
      case "priceHighToLow":
        products = await Product.aggregate([
          { $match: { isDeleted: false } },
          { $addFields: { sortPrice: { $ifNull: ["$newPrice", "$price"] } } },
          { $sort: { sortPrice: -1 } },
        ]);
        break;
      case "nameAZ":
        products = await Product.find({ isDeleted: false }).sort({ name: 1 });
        break;
      case "nameZA":
        products = await Product.find({ isDeleted: false }).sort({ name: -1 });
        break;
      default:
        products = await Product.find({ isDeleted: false });
        break;
    }

    products = await offerPrice(products);

    const minPriceInt = Number(minPrice);
    const maxPriceInt = Number(maxPrice);

    if (!isNaN(minPriceInt) && minPrice !== undefined && minPrice !== "") {
      products = products.filter((product) => {
        const priceToCheck =
          product.newPrice !== undefined ? product.newPrice : product.price;
        return priceToCheck >= minPriceInt;
      });
    }

    if (!isNaN(maxPriceInt) && maxPrice !== undefined && maxPrice !== "") {
      products = products.filter((product) => {
        const priceToCheck =
          product.newPrice !== undefined ? product.newPrice : product.price;
        return priceToCheck <= maxPriceInt;
      });
    }

    if (selectedCategories !== undefined && selectedCategories.length > 0) {
      products = products.filter((item) => {
        return selectedCategories.includes(item.categoryId.toString());
      });
    }

    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      products = products.filter((item) => regex.test(item.name));
    }

    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / 3);

    products = products.slice(skip, skip + 3);

    const userData = await User.findOne({ _id: req.session.user_id });

    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }

    res.render("shop", {
      products: products,
      currentPage: page,
      totalPages: totalPages,
      wishlist: wishlistItems,
      search: searchQuery,
      selectedCategories: selectedCategories,
      sortOption: sortOption,
      user: userData,
      minPrice: minPriceInt,
      maxPrice: maxPriceInt,
      cartCount: cartCount,
      wishlistCount:wishlistCount
    });
  } catch (error) {
    next(error);
  }
};

const loadMenCategory = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * 3;

    const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
    let products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $match: { "category.name": "Men" } },
    ]);
    products = await offerPrice(products);
    const userData = await User.findOne({ _id: req.session.user_id });
    const totalProducts = products.length;
    products = products.slice(skip, skip + 3);
    const totalPages = Math.ceil(totalProducts / 3);
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    let wishlistCount = wishlist?wishlist.items.length:0;

    if (userData) {
      return res.render("men-category", {
        products: products,
        user: userData,
        currentPage: page,
        totalPages: totalPages,
        wishlist: wishlist?.items,
        cartCount: cartCount,
        wishlistCount:wishlistCount
      });
    } else {
      res.render("men-category", {
        products: products,
        currentPage: page,
        totalPages: totalPages,
      });
    }
  } catch (error) {
    next(error);
  }
};

const loadWomenCategory = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * 3;

    const wishlist = await Wishlist.findOne({ userId: req.session.user_id });
    let products = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $match: { "category.name": "Women" } },
    ]);

    products = await offerPrice(products);
    const userData = await User.findOne({ _id: req.session.user_id });
    const totalProducts = products.length;

    products = products.slice(skip, skip + 3);
    const totalPages = Math.ceil(totalProducts / 3);

    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    let wishlistCount = wishlist?wishlist.items.length:0;

    if (userData) {
      return res.render("women-category", {
        products: products,
        user: userData,
        currentPage: page,
        totalPages: totalPages,
        wishlist: wishlist?.items,
        cartCount: cartCount,
        wishlistCount:wishlistCount
      });
    } else {
      res.render("women-category", {
        products: products,
        currentPage: page,
        totalPages: totalPages,
      });
    }
  } catch (error) {
    next(error);
  }
};

const loadProductPage = async (req, res, next) => {
  try {
    const productId = new ObjectId(req.query.id);

    let wishlist = await Wishlist.findOne({ userId: req.session.user_id });
    let product = await Product.findOne({ _id: productId });

    product = await offerPrice(product);

    product = await Product.aggregate([
      { $match: { _id: productId } },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
    ]);

    const relatedProducts = await Product.find({
      categoryId: product[0].category[0]._id,
      _id: { $ne: productId },
    }).limit(4);

    const userData = await User.findOne({ _id: req.session.user_id });

    let wishlistCount = 0;
    if (wishlist) {
      wishlist = wishlist.items;
      wishlistCount = wishlist.length;
    }
    const cart = await Cart.findOne({ userId: req.session.user_id });
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    if (userData) {
      return res.render("product-page", {
        product: product,
        products: relatedProducts,
        user: userData,
        wishlist: wishlist,
        cartCount: cartCount,
        wishlistCount: wishlistCount
      });
    } else {
      res.render("product-page", {
        product: product,
        products: relatedProducts,
      });
    }
  } catch (error) {
    next(error);
  }
};

const loadReferralLink = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.session.user_id });
    const cart = await Cart.findOne({ userId: req.session.user_id });
    const wishlist = await Wishlist.findOne({userId:req.session.user_id});
    let wishlistCount = 0;
    if(wishlist){
      wishlistCount = wishlist.items.length;
    };
    let cartCount = 0;
    if (cart) {
      cartCount = cart.items.length;
    }
    res.render("referral-link", { user: userData, cartCount: cartCount, wishlistCount:wishlistCount });
  } catch (error) {
    next(error);
  }
};

const loadPageNotFound = async (req, res, next) => {
  try {
    res.render("404");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loadRegister,
  loadLandingPage,
  createUser,
  otpGenerator,
  verifyOtp,
  loadLogin,
  verifyLogin,
  googleSuccess,
  loadHome,
  loadForgot,
  forgotEmail,
  forgotPasswordOtp,
  verifyForgotOtp,
  loadNewPassword,
  updatePassword,
  loadProfile,
  editProfile,
  loadManageAddress,
  loadAddAddress,
  addAddress,
  loadEditAddress,
  editAddress,
  deleteAddress,
  loadChangePassword,
  changePassword,
  userLogout,
  loadShop,
  sortFilterSearch,
  loadMenCategory,
  loadWomenCategory,
  loadProductPage,
  loadReferralLink,
  loadPageNotFound,
};
