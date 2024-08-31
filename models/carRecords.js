const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const moment = require('moment');

const { milesToKilometers, kilometersToMiles } = require('../utils/mileage');

const agenda = require('../schedule/agenda.js'); // Import agenda instance

 
const userModel=require('../models/userModel.js');
const {Car:carModel}=require('../models/carDetail.js');

function calculateNextServiceDueDate( drivenPerYear,nextServiceMilestone) {
  const milesToNextService = nextServiceMilestone;
  const yearsToNextService = (milesToNextService / drivenPerYear)*365;
 
  return moment().add( (yearsToNextService), 'days') ;
}



const carRecordsOption = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String },
    partNumber: { type: String },
    source: { type: String },
    cost: { type: Number },
    costUnit: { type: String }
});
 
const carSchema = new mongoose.Schema({
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "CarRecords" }, // Self-referencing field
    logDate: { type: Date },
    completedOn: { type: Date },
    endDate: { type: Date },
    options:[carRecordsOption],
    location: { type: String },
    mileage: { type: Number,    cast: '{VALUE} is not a number' },
 
    notecardType:{ type: String },
    option: { type: String },
    notes: { type: String },
    isRepeating:{type:Boolean},
    isActive:{type:Boolean,default:false},
    isHistory:{type:Boolean,default:true},
    is_repeating:{type:Boolean,default:false},

    occurance_type:{type:String},
    occurance_date_timeframe:{type:String},
    occurance:{type:Number},
    type: { type: String },
    categoryId:{ type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    createdAt: { type: Date },  
    updatedAt:{type:Date}
},
{
  timestamps: true,
  
});
carSchema.plugin(mongooseLeanVirtuals);

carSchema.index({ logDate: 1 });
carSchema.index({ carId: 1 });

carSchema.virtual('mileageUnit').get(function() {
  return this.userId?.preferences?.distance;

});
carSchema.virtual('remindMeText').get(function() {
  const occurentime=this.occurance_type; 
    
  return `${this.is_repeating?'every':'in'} ${this.occurance} ${(this.occurance_type=='mileage')?this.mileageUnit:this.occurance_date_timeframe}`;





  
});
carSchema.virtual('mileageWithUnit').get(function() {
 
     
  console.log(this.userId);
  const unit=(this.userId?.preferences?.distance)?this.userId?.preferences?.distance:'Km';
  console.log(" unit is ",unit);
  if(!this.mileage)
  {
    return '';
  }
  else 
  if(unit=='miles')
  {
    return `${Math.round(kilometersToMiles(this.mileage)).toLocaleString()} ${unit}`;
  }
  else 
  {
    return `${this.mileage.toLocaleString()} ${unit}`;
  }
 
});
carSchema.virtual('cardUrl').get(function() {
  return `${process.env.FRONTEND_URL}/car/${this.carId}/vehicle_log`;
});

carSchema.methods.getNextOccurenceDate = async function () {
  var endDate=null;
  if(this.logDate.length)
  {
    endDate=this.logDate;
  }

};


carSchema.methods.calculateLogDate = async function () {

    
};


// Custom instance method
carSchema.methods.processReminder = async function () {
 
    
};
carSchema.index({ carId: 1 }); // Index on carId field
carSchema.index({ isActive: 1 }); // Index on isActive field

const mongooseModel = mongoose.model('CarRecords', carSchema);

 

const eventEmitter = mongooseModel.watch()

eventEmitter.on('change', async(change) =>{
 


  //handle added new notecard 
  if(change.operationType==='insert' && !change.fullDocument.isHistory)
  {
    console.log("change is ",change);
  
    
    const user=await userModel.findById(change.fullDocument.userId); 
    const car=await carModel.findById(change.fullDocument.carId); 

    var triggerDate=undefined;
    var triggerType="date";
    const currentDate = moment();
    if(change.fullDocument.occurance_type=='date')
    {
      //let triggerDate=moment(change.fullDocument.logDate).add(change.fullDocument.occurance, change.fullDocument.occurance_date_timeframe);
     
      
 

      const preferedDates=[user.preferences.notification1PreferredDate,user.preferences.notification2PreferredDate];

      for (const preferDate of preferedDates) {
        if(preferDate)
        {
          
          const subtractedDate = moment(change.fullDocument.logDate).subtract(preferDate, 'days');
         
  
          if(subtractedDate.isAfter(currentDate))
          {
            const reminderTxt=`We are notifying you of your upcoming notecard due in <span class="bluetxt">${preferDate} days</span>}. Please click the button below to navigate the notecard`;
      
            await agenda.schedule(subtractedDate,'send reminder email', { carRecordId:change.fullDocument._id.toString(),reminderTxt  } );
          }
       
      
          
        }
    }
     
      
  
    }
    else 
    if(change.fullDocument.occurance_type=='mileage')
    {
      triggerType='mileage';
      triggerDate= calculateNextServiceDueDate( car.drivenPerYear,change.fullDocument.mileage-car.mileage) ;
      console.log("nextServiceDate is ",triggerDate);
      const preferedMileages=[user.preferences.notification1PreferredMileage,user.preferences.notification2PreferredMileage];
      for(let preferedMileage of preferedMileages)
      {
        if(user.preferences.distance!='km')
        {
          preferedMileage=milesToKilometers(preferedMileage);
        }
        if(preferedMileage)
        {
          const preferedDate= calculateNextServiceDueDate( car.drivenPerYear,(change.fullDocument.mileage-car.mileage)-preferedMileage) ;
          if(preferedDate.isAfter(currentDate))
          {
            const reminderTxt=`We are notifying you of your upcoming notecard due in <span class="bluetxt">${change.fullDocument.mileage} miles</span>}. Please click the button below to navigate the notecard`;
            await agenda.schedule(preferedDate, 'send reminder email', { carRecordId:change.fullDocument._id.toString(),reminderTxt  } );
          }
         
           
        }
       
      }
     

  
    }
 

    
  }

 
});





module.exports = mongooseModel;
