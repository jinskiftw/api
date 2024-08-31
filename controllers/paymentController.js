const PlanModel = require("../models/planModel");
const {PaymentLogModel,cancelSubscription} = require("../models/paymentLogModel");
const UserModel = require("../models/userModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require("mongoose");
const fs = require("fs").promises;
require("dotenv").config();

const BaseUrl = process.env.BASEURL;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(STRIPE_SECRET_KEY);
const index = catchAsyncError(async (req, res, next) => {
  try {
 

    const search = req.query.search ? req.query.search : ""; 

    const options = {
      page: 1,
      limit: 55,
    };

    const sort = req.query.sort ; 
    const pipeline=[
      {
        $lookup: {
          from: "users", // assuming the collection name for users is 'users'
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
                $unwind: {
                    path: '$user', // Unwind to work with individual user documents
                    preserveNullAndEmptyArrays: false // Exclude documents without matching user
                }
            },
      {
        $lookup: {
          from: "plans", // assuming the collection name for users is 'users'
          localField: "planId",
          foreignField: "_id",
          as: "plan",
        },
      },
      {
        $match: {
          $or: [
            { "user.fullName": { $regex: search, $options: "i" } },
            { "plan.title": { $regex: search, $options: "i" } },
          ],
        },
      },
    ];
    if(sort)
    {
        const sortField = Object.keys(sort);            
        sortOrder ={[sortField[0]]:sort[sortField].ascending === 'true' ? 1 : -1}; 
        console.log("sortOrder is ",sortOrder);
        pipeline.push({
          $sort: sortOrder
        });
    }

    const aggregate = PaymentLogModel.aggregate(pipeline);
    const payments = await PaymentLogModel.aggregatePaginate(
      aggregate,
      options
    );

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});
const indexOld = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const token = req.body.token;
    const planId = new mongoose.Types.ObjectId(req.body.planID);
    const query = {
      _id: planId,
    };

    const plan = await PlanModel.findOne(query);
    //console.log("plan",plan)
    if (!plan) {
      return next(new ErrorHandler("Plan not found", 404, res));
      return;
    }

    const chargeDesc = `Cart - ${plan._id}`;
    const chargeAmount = parseInt(plan.price * 100);
    const currency = "USD";

    const charge = await stripe.charges.create({
      amount: chargeAmount,
      currency: currency,
      source: token.id,
      description: chargeDesc,
    });

    //current date and time
    const paymentResponse = JSON.stringify(charge);
    console.log("charge=>", charge);
    const AmountCaptured = charge.amount_captured / 100;
    const PaymentStatus = charge.paid ? "Success" : "Failed";

    const paymentLogModel = new PaymentLogModel({
      planId,
      userId,
      paymentType: "Stripe",
      amount: AmountCaptured,
      paymentStatus: PaymentStatus,
      transactionId: charge.id,
      paymentResponse: paymentResponse,
    });

    const data = await paymentLogModel.save();

    if (charge.paid) {
      const date = new Date(charge.created * 1000);
      const options = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      };

      const today = new Date();
      const planStartDate = today.toISOString().slice(0, 10);
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const newExpiryDate = nextMonth.toISOString().slice(0, 10);

      // Update the user document
      const result = await UserModel.updateOne(
        { _id: userId },
        {
          $set: {
            planId: planId,
            planStartDate: planStartDate,
            planExpiryDate: newExpiryDate,
          },
        }
      );

      const User = await UserModel.findById(userId);
      const UserData = {
        userName: User.fullName,
        email: User.email,
        role: "user",
        isVerified: User.isVerified,
        planId: User.planId,
        planStartDate: User.planStartDate,
        planExpiryDate: User.planExpiryDate,
      };
      console.log("Charge created:", charge, UserData);
      res
        .status(200)
        .json({ status: true, message: "Charge successful", charge, UserData });
    } else {
      //console.error('Charge failed=>', charge);
      return next({ status: false, message: "Charge failed", charge });
    }
  } catch (error) {
    next(error);
  }
});

const createCheckoutSession = catchAsyncError(async (req, res, next) => {
  const query = {
    _id: req.body.planId,
  };
  console.log("query is ", req.body);
  const plan = await PlanModel.findOne(query);
  if (!plan) {
    return next(new ErrorHandler("Plan not found", 404, res));
  }

  const chargeAmount = parseInt(plan.price * 100);
  const data = {
    ui_mode: "embedded",
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.title,
            images: [`${process.env.ADMIN_NODE_URL}/uploads/public/wheel-plan-logo.png`]
          },
          unit_amount: chargeAmount,
        },
        quantity: 1,
      },
    ],
    metadata:{userId:req.user._id.toString()},
    mode: plan.isRecurring ? "subscription" : "payment",
    subscription_data: {
      trial_period_days: 30,
   },
    return_url: `${process.env.FRONTEND_URL}/payment?session_id={CHECKOUT_SESSION_ID}`,
  };

  if(plan.isRecurring)
  {
    data.line_items[0].price_data.recurring = {
      interval: "month",
      interval_count: plan.get_plan_months,
    };
    //data.subscription_data={metadata:{userId:req.user._id.toString()}} ;
  }

  //console.log("data is ",data.line_items[0].product_data) ; 
  console.log("Subscription Data=> ",data); 
  //console.log("Time Zone",new Date().toString());

  const session = await stripe.checkout.sessions.create(data);
 
  const paymentLogModel = new PaymentLogModel({
    planId: plan._id,
    userId: req.user._id,
    paymentType: "Stripe",
    amount: chargeAmount,
  
    sessionId: session.id,
    paymentStatus: session.payment_status,
    status: session.status, 

    paymentResponse: session,
  });

  await paymentLogModel.save();
  res.send({
    clientSecret: session.client_secret,
    publishKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

 

const sessionStatus = catchAsyncError(async (req, res, next) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  if (session.id);
  const payment = await PaymentLogModel.findOne({ sessionId: session.id });
  if (!payment) {
    return next(new ErrorHandler("Payment Detail not found", 404, res));
  }
  if (payment.paymentStatus == "complete") {
    res.send({
      status: "complete",
    });
    return;
  }
  const months={'Month':1,'Quarter':3,'Half Year':6,'Year':12};
  await payment.populate('planId');
  const planMonths= months[payment.planId.type];
  console.log("planMonths is",planMonths);
  payment.paymentStatus = session.payment_status ;
  payment.status = session.status ;
  payment.paymentResponse = session;
  await payment.save();

  const today = new Date();
  const planStartDate = today.toISOString().slice(0, 10);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + planMonths);
  const newExpiryDate = nextMonth.toISOString().slice(0, 10);

  // Update the user document
  const result = await UserModel.updateOne(
    { _id: req.user._id },
    {
      $set: {
        paymentId:payment._id,
        subscriptionStatusRec:(session.subscription!==null),
        planId: payment.planId,
        planStartDate: planStartDate,
        planExpiryDate: newExpiryDate,
      },
    }
  );

  console.log("result");
  console.log(req.user._id);
  console.log(payment.planId);
  console.log(result);

  res.send({
    session: session,
    status: session.status,
    customer_email: session.customer_details.email,
  });
});


const recentTransactions=catchAsyncError(async (req, res, next) =>
{

  // const payments = await PaymentLogModel.find({paymentStatus:'paid'}).populate(['userId','planId']).sort({createdAt:-1}).limit(10);
  const paymentRecord = await PaymentLogModel.find({ paymentStatus: 'paid' })
  .populate({
    path: 'userId',
    select: 'fullName', // Adjust fields as needed
    match: {} // Optionally, add match conditions if needed
  })
  .populate({
    path: 'planId',
    select: 'title' // Adjust fields as needed
  })
  .sort({ createdAt: -1 }) // Sort by creation date in descending order
  .limit(10) // Limit to 10 latest entries
  .exec();

// Filter out any payments that don't have a populated user
const payments = paymentRecord.filter(payment => payment.userId !== null);

  return res.json({data:payments});
 
});

const cancelUserSubscription=catchAsyncError(  async (req, res,next) => {
  /* const user =req.user ; 
  try 
  {
    const subscriptions=user.subscriptions; 
    for(const subscription in subscriptions )
    {
        if(!subscription.canceled_at)
        {
          cancelSubscription(subscription.id);
        }
    }
  }
  catch (error) {
    next(error);
  }

  return res.json({message:"cancelled successfuly"});
*/

try {
  // Cancel the subscription in Stripe
 // const canceledSubscription = await stripe.subscriptions.del(subscriptionId);

  // Handle successful cancellation
  //console.log("req.user is ",req.user);
  //const subscriptions5=await req.user.subscriptions();
  //console.log('subscriptions5=>',subscriptions5);
  const planId = new mongoose.Types.ObjectId(req.user.planId);
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const query = {
    _id: planId,
  };
  const query2 = {
    planId: planId,
    userId:userId,
    paymentStatus:'paid'
  };
  //const subscriptions = await PlanModel.findOne(query);
  const subscriptions = await PaymentLogModel.findOne(query2).sort({_id: -1});
  const session_id = subscriptions?.paymentResponse?.subscription;
  //console.log("SessionData=>",subscriptions);
  // for(key in subscriptions.data)
  // {
  //   console.log("sub is ","yello",subscriptions.data[key]);
  //   if(!subscriptions.data[key].cancel_at_period_end)
  //   {
  //     await cancelSubscription(subscriptions.data[key].id);
  //   }
    
  // }
  await cancelSubscription(session_id);
 // const canc=await stripe.subscriptions.cancel(subscriptions.data[0].id);
 
  req.user.subscriptionStatusRec=false;
  await req.user.save();
  res.status(200).json({ success: true,"message":'Cancelled Successfully' });
} catch (error) {
  // Handle cancellation failure
  res.status(400).json({ success: false, error: error.message });
}
});



module.exports = { index, createCheckoutSession, sessionStatus,recentTransactions ,cancelUserSubscription};
