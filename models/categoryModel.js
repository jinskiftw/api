const mongoose = require("mongoose");


const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String
    },
    icon: {
      type: String
    },
    icon2: {
      type: String
    },
    color:{
      type:String
    },
    options: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("Category", categorySchema);
