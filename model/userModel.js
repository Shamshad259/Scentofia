const mongoose = require("mongoose");

function generateReferralId() {
  return Math.random().toString(36).substring(2, 10); 
}

const userSchema = mongoose.Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Mobile: { type: String },
  Password: { type: String },
  IsBlocked: { type: Boolean, required: true, default: false },
  referralId : {type:String ,default : generateReferralId}
});

module.exports = mongoose.model("User", userSchema);
