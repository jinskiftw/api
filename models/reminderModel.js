const mongoose = require('mongoose');
const addNotification=require("../utils/NotificationService");
const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
  carRecordId: { type: mongoose.Schema.Types.ObjectId, ref: "CarRecords", required: true },
  
  frequency: {
    type: Number,
    required: true,
  },
  frequencyType: {
    type: String,
    enum : ['day','month'],
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastReminderDate: {
    type: Date,
    default: null,
  },
  nextReminderDate:
  {
    type:Date,
    default:null
  }
});


// Custom instance method
reminderSchema.methods.processReminder = async function () {
  try {

    await this.populate('carRecordId');
    await this.carRecordId.populate('categoryId')  ; 

    const reminderDate=this.nextReminderDate ; 
    reminderDate.setUTCHours(0,0,0,0);
    const currentDate=new Date() ; 
    currentDate.setUTCHours(0,0,0,0);
    if(currentDate.getTime()!=reminderDate.getTime()) 
    {
      console.log(`Due date is not today for record ${this._id}` ,currentDate,reminderDate);
      return false ;
    }
    // Your custom logic here
    

    // Save the updated record
  //  await this.save();
  addNotification(this.userId,"#","Reminder Notification",`Your Service for ${this.carRecordId.categoryId.title} is due today` );
  this.lastReminderDate=currentDate; 
  const nextDate = new Date(currentDate);

  nextDate.setDate(currentDate.getDate() + this.frequency);

  this.nextReminderDate=nextDate;
  await this.save() ; 
  
    console.log(`Reminder processed: ${this._id}`,this.carRecordId.categoryId);
  } catch (error) {
    console.error('Error processing reminder:', error);
  }
};

const Reminder = mongoose.model('Reminder', reminderSchema);




module.exports = Reminder;
