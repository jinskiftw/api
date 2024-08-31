const mongoose = require("mongoose");


const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
 
    tags:{
      type: [String], 

      required:true , 
    }
  },
  {
    timestamps: true,
  }
);
 

module.exports = mongoose.model("Blog", blogSchema);
