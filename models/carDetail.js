const { milesToKilometers, kilometersToMiles } = require('../utils/mileage');
var mongoose_delete = require('mongoose-delete');

const mongoose = require('mongoose');
 

module.exports = {

};





const carImageSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    image: { type: String }
});

const carSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    carImage: [carImageSchema],
    manufacturerYear: { type: Number },
    manufacturer: { type: String },
    model: { type: String },
    mileage: { type: Number },
   
    color: { type: String },
    transmission: { type: String },
    vin: { type: String },
    licensePlateNumber: { type: String },
    purchasePrice: { type: Number },
  
    yearsOwned: { type: Number },
    drivenPerYear: { type: Number },
    shortDescription: { type: String },
    isActive: {
        type: Boolean,
        default: true,
    }
},
{
    /*virtuals: {
        drivenPerYear: {
          get() {
            return  420;
          }
        }
      },*/
  timestamps: true,
});


 
carSchema.plugin(mongoose_delete, { overrideMethods: 'all' });


 carSchema.virtual('milesDrivenPerYear').get( function() {
      let userId=   this.userId; 
  
     if(userId?.preferences?.distance=='miles')
     {
      return kilometersToMiles(this.drivenPerYear,true);
     }
     return this.drivenPerYear;
 
  }); 

  carSchema.virtual('milesDrivenPerYearFormatted').get(  function() {
  
    var perYear=0; 
    var unit="Km";
    perYear= this.drivenPerYear;
    let userId=   this.userId;  
    if(userId?.preferences?.distance=='miles')
    {
      var unit="Miles";
      perYear= kilometersToMiles(this.drivenPerYear,true);
    }
    perYear=parseInt(perYear);
    console.log(perYear);
    return (perYear)?`${perYear?.toLocaleString()} ${unit}`:'' ; 

 }); 
  

  carSchema.virtual('purchasePriceUnit').get(  function() {
    const user = this.user ; 
    return user?.preferences?.currency;
  });

  carSchema.virtual('inputMileage').get(  function() {
    const user =this.userId ; 
    const mileageUnit=(user?.preferences?.distance!=='km')?'miles':'km';
    if(mileageUnit=='miles')
    { 
      return `${Math.round(kilometersToMiles(this.mileage))}`;
    }
    else 
    {
      return `${this.mileage}`;
    } 
  });
carSchema.virtual('mileageWithUnit').get(  function() {
  var unit ="Km" ; 
  var distance=0 ;

  let userId=   this.userId;
  console.log("KKKK");
  console.log(userId?.preferences)
  if(userId?.preferences?.distance=='miles')
  {
     unit="Miles";
     distance = Math.round(kilometersToMiles(this.mileage),true);
  }
  else 
  {
    distance= this.mileage;
  }
  distance = parseInt(distance);
  console.log("distance is ",distance);  
  return `${distance.toLocaleString()} ${unit} `;
 
});

carSchema.virtual('purchasePriceWithUnit').get(    function() {
 

  let userId=   this.userId;
  
  const unitSign = { 'usd': '$', 'eur': '€', 'gbp': '£' };
 
  const purchasePriceFormat=(this.purchasePrice)?this.purchasePrice.toLocaleString():null ; 
  const selectedCurrency=(userId?.preferences?.currency)?unitSign[userId?.preferences?.currency]:unitSign['usd'];
  return (purchasePriceFormat)?`${selectedCurrency} ${purchasePriceFormat}`:'';
});

const carOnwershipTransferSchema = new mongoose.Schema({
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    status: {
      type: String,
      enum: ['pending','complete'],
      required: true,
      default:'pending'
    }, 
},
{
  timestamps: true,
});


 
// Function to get the count of records in carRecord based on carId
carSchema.methods.getCarRecordCount = async function () {
    const carId = this._id;

    try {
      const CarRecords = require('./carRecords');
        const carRecordCount = await CarRecords.countDocuments({ carId });
        return carRecordCount;
    } catch (error) {
        throw error;
    }
};

const Car = mongoose.model('Car', carSchema);
const CarOwnershipTranser = mongoose.model('CarOwnershipTransfer', carOnwershipTransferSchema);

 

module.exports.Car = Car;
module.exports.CarOwnershipTranser = CarOwnershipTranser;
