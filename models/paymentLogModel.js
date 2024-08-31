const mongoose = require("mongoose");
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const mongoosePaginate = require('mongoose-paginate-v2');
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const paymentLogSchema = new mongoose.Schema(
  {
    planId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Plan", 
      required: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    paymentType: {
      type: String,
      enum: ['Stripe','Paypal'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentStatus:{
      type: String,
      required: true,
    },
    status:{
      type: String,
      required: true,
    },
    transactionId: {
      type: String
    },
    sessionId:{
      type:String
    },
    paymentResponse:{
      type: Object,
    }
  },
  {
    timestamps: true,
  }
);

paymentLogSchema.plugin(mongooseLeanVirtuals);
// Define a static method to sum documents within the schema
paymentLogSchema.statics.sumDocuments = async function () {
  try {
    const result = await this.aggregate([
      {
        $match: { paymentStatus: "Success" } // Filter documents where paymentStatus is "success"
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" } // Summing the 'amount' field
        }
      }
    ]);
    return result.length > 0 ? result[0].totalAmount : 0; // Returning the sum or 0 if no documents
  } catch (error) {
    console.error("Error calculating sum:", error);
    throw error;
  }
};


paymentLogSchema.plugin(mongoosePaginate);
paymentLogSchema.plugin(aggregatePaginate);


paymentLogSchema.methods.processPayment = async function () {

  
}
async function cancelSubscription(subscriptionId) {
  try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
      });

      console.log('Subscription canceled:', subscription);
      return subscription;
  } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
  }
}

// Custom instance method
paymentLogSchema.methods.processPayment = async function () {
  if(this.status!=='open')
  {
    return false; 
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(this.sessionId);
   
    this.paymentResponse=session ; 
    this.paymentStatus=session.payment_status;
    
   this.status = session.status;  
   await this.populate('userId');

   const user=this.userId;  
 
   //const sub=await cancelSubscription('sub_1OsOEz47ascXL5ccGt9EHQ2e');
   //console.log("canceld is ",sub);
   return ; 
    await this.save(); 
    return session.payment_status;
} catch (error) {
    console.error('Error retrieving payment status from session:', error);
    throw error;
}
    
};


paymentLogSchema.virtual('occurenceType').get(function() {

  return (this.paymentResponse.subscription)?'subscription':'single';
});
module.exports = {
  PaymentLogModel:  mongoose.model("PaymentLog", paymentLogSchema),
  cancelSubscription
};