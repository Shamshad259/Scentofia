const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const referralSchema = mongoose.Schema({
    userId:{type:ObjectId,ref:"User"},
    referralId : {type:String}
});

module.exports = mongoose.model("Referral", referralSchema);
