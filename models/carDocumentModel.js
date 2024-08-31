const mongoose = require("mongoose");

const carDocumentSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentName: {
      type: String
    },
    notes: {
      type: String
    },
    documentFile: {
      type: String,
 
    }
  },
  {
    timestamps: true,
  }
);


module.exports = mongoose.model("carDocument", carDocumentSchema);
