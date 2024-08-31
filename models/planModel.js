const mongoose = require("mongoose");


const planSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['Month', 'Quarter', 'Half Year', 'Year'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    garageLimit: {
      type: Number,
      required: true,
    },
    isRecurring: {
      type: Boolean,
 
      default:false
    },
  },
  {
    timestamps: true,
  }
);
const months={'Month':1,'Quarter':3,'Half Year':6,'Year':12};
planSchema.virtual('get_plan_months').get(function() {
  return months[this.type];
 
});


module.exports = mongoose.model("Plan", planSchema);
