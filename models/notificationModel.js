// notificationModel.js
const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const moment = require('moment');


const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car"  },
    

  url: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  
  description: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  }
 
}, 
{
    timestamps: true,
  });


  notificationSchema.virtual('timeAgo').get(function() {
    return moment(this.createdAt).fromNow();
  
  });
  notificationSchema.plugin(mongooseLeanVirtuals);
const Notification = mongoose.model('notification', notificationSchema);

module.exports = Notification;
