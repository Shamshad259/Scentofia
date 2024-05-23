const User = require("../model/userModel");
const Admin = require("../model/adminModel");
const bcrypt = require("bcrypt");
const session = require("express-session");

const loadUsers = async (req, res,next) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    const page = Number(req.query.page)||1;
    const skip = (page-1)*5;

    const userData = await User.find({
      $or: [
        { Name: { $regex: ".*" + search + ".*", $options: "i" } },
        { Email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],IsBlocked:false
    }).skip(skip).limit(5);

    const totalUsers = await User.countDocuments({
        $or:[
        {Name:{$regex:".*"+search+".*",$options:"i"}},
        {Email:{$regex:".*"+search+".*",$options:"i"}}
    ],
    });

    const totalPages = Math.ceil(totalUsers/5);

    res.render("users", { users: userData,currentPage:page,totalPages:totalPages });
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res,next) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { IsBlocked: true } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res,next) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { IsBlocked: false } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const loadBlockedUsers = async(req,res,next)=>{
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    const page = Number(req.query.page)||1;
    const skip = (page-1)*5;

    const userData = await User.find({
      $or: [
        { Name: { $regex: ".*" + search + ".*", $options: "i" } },
        { Email: { $regex: ".*" + search + ".*", $options: "i" } },
      ], IsBlocked:true
    }).skip(skip).limit(5);

    const totalUsers = await User.countDocuments({
        $or:[
        {Name:{$regex:".*"+search+".*",$options:"i"}},
        {Email:{$regex:".*"+search+".*",$options:"i"}}
    ],
    });

    const totalPages = Math.ceil(totalUsers/5);

    res.render("blocked-users", { users: userData,currentPage:page,totalPages:totalPages });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loadUsers,
  blockUser,
  unblockUser,
  loadBlockedUsers
};
