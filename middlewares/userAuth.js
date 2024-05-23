const User = require("../model/userModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      const userData = await User.findOne({ _id: req.session.user_id });
      if (userData.IsBlocked == false) {
        next();
      } else {
        delete req.session.user_id;
        req.session.message = "You are blocked by the admin"
        return res.redirect("/login");
      }
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    res.send(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      return res.redirect("/home");
    } else {
      next();
    }
  } catch (error) {
    res.send(error.message);
  }
};

const isNoOtp = async(req,res,next)=>{
  try {
    if(req.session.otp){
      req.session.message = "Session Expired"
      delete req.session.otp;
      return res.redirect("/login");
    } else {
      next();
    }
    
  } catch (error) {
    res.send(error.message);
  }
}



module.exports = {
  isLogin,
  isLogout,
  isNoOtp
};
