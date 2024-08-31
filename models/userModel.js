const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require('path');
 
const client = require("@mailchimp/mailchimp_marketing");


client.setConfig({
  apiKey: process.env.STRIPE_PUBLISHABLE_KEY,
  server: "us18",
});
const addressSchema = new mongoose.Schema({

  address:{type:String},
  streetNumber:{type:String},
  streetAddress:{type:String},
  city:{type:String},
  zipcode:{type:String},
  country:{type:String}

});
const preferenceSchema = new mongoose.Schema({
  timezone: {
    type: String,
  
    // You could potentially validate against a list of valid timezones
  },
  notification1PreferredDate: {
    type: Number,  
    default: 7,
    min: 1,
    max: 365
  },
  notification2PreferredDate: { 
    type: Number, 
    default:30,
    min: 1,
    max: 365
  },
  notification1PreferredMileage: {
    type: Number ,
    default:100,
  },
  notification2PreferredMileage: {
    type: Number ,
    default:500
  },
  distance: {
    type: String, 
    enum: ['km', 'miles', ], 
    default: 'miles'
  },
  currency: {
    type: String,
    enum: ['usd', 'eur', 'gbp', /* Add other supported currencies */], 
    default: 'usd'
  },
  view: {
    type: String,
    enum: ['list', 'grid', /* Add other valid view types */], 
    default: 'grid'
  }
});


const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      // required: [true, "Please enter your name"],
      maxLength: [30, "Name cannot exceed 30 charaters"],
      minLength: [4, "Name should have more then 4 charaters"],
    },
    profile_title:{String},
    profile_description:{String},
    preferences: {
      type:preferenceSchema,
      default:{}
    } ,
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minLength: [8, "Password should be greater then 8 charaters"],
      select: false,
    },
    resetPasswordToken: {
      type: String,
      default: "",
    },
    token: {
      type: String,
      default: "",
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    subscriptionStatusRec:
    {
      type:Boolean,
      default:false
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    planId:{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Plan",
      default: null,
    },
    paymentId:{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "PaymentLog",
      default: null,
    },
    planStartDate:{
      type: Date,
      default: null,
    },
    planExpiryDate:{
      type: Date,
      default: null,
    },
    profileImage: {
      type: String, // Store image path instead of binary data
      default:null
    },
    address: addressSchema,
  },
  {
    timestamps: true,
    methods:{
      
    }
  }
);


// Define a static method to sum documents within the schema
userSchema.statics.totalSubscribed = async function () {
  try {
    return  result = await this.find({ planExpiryDate: { $lt: Date.now() }} ).countDocuments();
     
  } catch (error) {
    console.error("Error calculating sum:", error);
    throw error;
  }
};


userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

  userSchema.methods.cancelPlan=function (planId)
  {
      
  }

  userSchema.methods.updatePlan=function (payment)
  {
                
  }

 

// Generate and set reset password token and expiration
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};


// get mailchimp member
userSchema.methods.getMailchimpMember = async function () {
  const response = await client.searchMembers.search(`email=${this.email}`);
  console.log("mail chimp response is ",response) ;
};

// add mailchimp member
userSchema.methods.getMailchimp = async function () {
  const response = await client.searchMembers.search(`email=${this.email}`);
  console.log("mail chimp response is ",response) ;
};


userSchema.virtual('profile_image_url').get(function() {
  const baseUrl = process.env.ADMIN_NODE_URL || `http://localhost:${process.env.PORT}`; // Use environment variable or default
  if(!this.profileImage)
  {
    return '';
  }
  const relativePath = path.join('uploads/user', this.profileImage || ''); // Reconstruct relative path
  return `${baseUrl}/${relativePath}`; // Combine base URL with relative path
 
});


userSchema.virtual('isSubscribed').get(function() {
  const baseUrl = process.env.ADMIN_NODE_URL || `http://localhost:${process.env.PORT}`; // Use environment variable or default
  if(!this.profileImage)
  {
    return '';
  }
  const relativePath = path.join('uploads/user', this.profileImage || ''); // Reconstruct relative path
  return `${baseUrl}/${relativePath}`; // Combine base URL with relative path
 
});





userSchema.virtual('full_address').get(function() {
   return `${(this.address?.address)?this.address?.address:''}  ${(this.address?.streetNumber)?this.address?.streetNumber:''} ${(this.address?.streetAddress)?this.address?.streetAddress:''}  ${(this.address?.city)?this.address?.city:''} `; 
 
});



 

userSchema.virtual('preferences.currencySymbol').get(   function() {
 

  
  const unitSign = { 'usd': '$', 'eur': '€', 'gbp': '£' };
 
  return (this.preferences?.currency)? `${unitSign[this.preferences.currency]}`:`${unitSign['usd']}`;
});




const mongooseModel= mongoose.model("User", userSchema);

const personEventEmitter = mongooseModel.watch()

personEventEmitter.on('change', async(change) =>{
 

 
 
});

module.exports = mongooseModel;
