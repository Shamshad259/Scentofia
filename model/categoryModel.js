const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: { type: String, required: true },
  isDeleted: { type: Boolean, required: true, default: 0 },
});

module.exports = mongoose.model("Category", categorySchema);
