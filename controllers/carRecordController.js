
const CarRecords = require('../models/carRecords');
const  {Car:carDetail}= require('../models/carDetail');
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const Reminder=require("../models/reminderModel");
const { milesToKilometers } = require('../utils/mileage');
const { ObjectId } = require("mongodb");
 
 const moment=require('moment');
const carRecordsUpcomingList= catchAsyncError(async (req, res, next) =>{

  const { page = 1, pageSize = 30 } = req.query;
 
 
  try {
    const carId =(req.params.carId); // Convert to ObjectId

    
    const totalRecords = await CarRecords.countDocuments( {carId} );
     
    const records = await CarRecords.find({carId,isHistory: false }  )
      .populate({
        path: 'categoryId',
        select: 'title'
      })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));
      
    const response = {
      result: records,
      page: Number(page),
      totalRecords,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching records:', error.message);
    res.status(500).json({ error: 'Internal Server Error :'+error.message });
  }
});
const TYPE_HISTORY=1;
const TYPE_UPCOMING=2;
const carRecordsList = catchAsyncError(async (req, res, next) => {
  
  //await agenda.now('send reminder email', {carRecordId:'660bf7a988cdf7620fb94822',reminderTxt:"fdafas"});
 // await agenda.now('card record occurence', {carRecordId:'660d29f351aafc543c7cc1bf',reminderTxt:"fdafas"});
  const { page = 1, pageSize = 3000,type=TYPE_HISTORY ,search=""} = req.query;
 
 
  try {
    const carId =(req.params.carId); // Convert to ObjectId

     
    const recordsQuery = { carId };

    recordsQuery.isHistory=(type==TYPE_HISTORY);

    if(search.length)
    {
      recordsQuery.$or =[
        { 'options.name': { $regex: search, $options: 'i' } }, // Case-insensitive matching for name
        { 'options.partNumber': { $regex: search, $options: 'i' } }, // Case-insensitive matching for partNumber
        { 'options.source': { $regex: search, $options: 'i' } } // Case-insensitive matching for source
    ]
    }

    const dateFilter=type==TYPE_HISTORY?{$lte:new Date()}:{$gt:new Date()};
    const totalRecords = await CarRecords.countDocuments( recordsQuery );
     
    const records = await CarRecords.find(recordsQuery ).lean({ virtuals: true })
      .populate({
        path: 'categoryId',
        select: 'title color'
      }).populate("userId")
      .sort({ logDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize));

    
 
    const response = {
      result: records,
      page: Number(page),
      totalRecords,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Internal Server Error :'+error.message });
  }
 
});
const minute = 1000 * 60;
const hour = minute * 60;

const day = hour * 24;
const year = day * 365;



const createCarRecord = catchAsyncError(async (req, res, next) => {
    try {
    //  return res.status(500).json({message:"blablablae"});
        const userId = req.user._id
        const carId = req.params.carId
        const carModel = await carDetail.findOne({_id:carId});

        if(!carModel)
        {
          return res.status(500).json({message:`No car found with id ${carId}`});
        }

 

        var options=Object.values(req.body.options);
        options=options.map((item)=>{
          item._id= new mongoose.Types.ObjectId();
  
          return item;
  
        });
       
        if(req.body.mileage)
        {
         
          if (isNaN(req.body.mileage)) {
            //return res.status(400).json({ error: 'Price should be a number' });
           return  res.status(500).json({message: "Mileage should be a number format. Please exclude special characters."});
          }
        }
        const mileageUnit=req.user.preferences.distance ; 
        const mileage=(mileageUnit!=='km' && req.body.mileage!==null)? milesToKilometers(req.body.mileage):req.body.mileage;
     
        const attr={
          userId, 
          carId,
          isActive:true,
          ...req.body,
          mileage,
          options: options,
      };

    
      
      const currentDate = new Date(); 
 
      console.log(req.body);
      if(req.body.logDate  && mileage)
      {
        const logDate= new Date(req.body.logDate)  ; 

       
        const inputMoment = moment(req.body.logDate, 'YYYY-MM-DD').startOf('day');

        // Get current date
        const currentMoment = moment().startOf('day');

      
        // Compare dates
        
        if(inputMoment.isAfter(currentMoment, 'day') && mileage<=carModel.mileage)
        {
          res.status(500).json({message:"Mileage is less than the current mileage for upcoming date"});
          return ; 
        
        }
        else 
        if(inputMoment.isBefore(currentMoment, 'day') && mileage>=carModel.mileage)
        {
          res.status(500).json({message:"Mileage is more  than the current mileage for previous date"});
          return ; 
        
        }
        else 
        { 
          if (inputMoment.isSame(currentMoment, 'day'))
          {
  
            carModel.mileage=mileage;
  
          }
          let carDrivenTillDay =carModel.mileage/carModel.drivenPerYear;  //in years
          let mileageTimeReach =( (attr.mileage/carModel.drivenPerYear)-carDrivenTillDay)*365*24*60*60;  
          console.log("mileageTimeReach is",mileageTimeReach);
          console.log("carDrivenTillDay is",carDrivenTillDay); 
          let mileageBasedDate=new Date(); 
          mileageBasedDate.setSeconds(mileageBasedDate.getSeconds()+mileageTimeReach);
          console.log("mileageBasedDate is ",mileageBasedDate);
          attr.endDate=(mileageBasedDate<logDate)?mileageBasedDate:logDate;

        }
        
      }
      else if(req.body.logDate)
      {
        const logDate= new Date(req.body.logDate)  ; 
        attr.endDate=logDate;
      }
      else if(mileage!==null) 
      {
        let carDrivenTillDay =carModel.mileage/carModel.drivenPerYear;  //in years
        let mileageTimeReach =( (mileage/carModel.drivenPerYear)-carDrivenTillDay)*365*24*60*60;  

        let mileageBasedDate=new Date(); 
        mileageBasedDate.setSeconds(mileageBasedDate.getSeconds()+mileageTimeReach);
        attr.endDate=mileageBasedDate;
      }
      else 
      {
        res.status(500).json({message: "Please enter date or mileage "});
        return ; 
      }

      attr.isHistory=(attr.endDate<=(new Date()));
 
 
        const carRecords = new CarRecords(attr);    
        await carRecords.populate('carId');

       
 
        const newCar = await carRecords.save();
        await carModel.save();
     //  res.status(500).json({message: "blabla"});
      //  return 
 
        res.status(200).json({ message: "Record added successfully", data: newCar });
    } catch (error) {
        res.status(500).json({message:error.message });
        next(error); 
    }
});
const updateCarRecord=catchAsyncError(async (req,res,next)=>{
  const userId = req.user._id
 
  const carRecordId = req.params.carRecordId
  var options=Object.values(req.body.options);
  options=options.map((item)=>{
    item._id= new mongoose.Types.ObjectId();

    return item;

  });
  const attr={


    notes:req.body.notes,
    notecardType:req.body.notecardType,
    location:req.body.location,
    type:req.body.type,
    options,
};
  const carRecord = await CarRecords.findOneAndUpdate({_id:carRecordId},attr,  { new: true });

   
  await carRecord.populate('categoryId');

  if (carRecord) {
    // Document was successfully updated
    return res.status(200).json({ message: 'Car record updated successfully', data:carRecord });
  } else {
    // Document with the given ID not found
    return res.status(404).json({ message: 'Car record not found' });
  }



});

const adminCarRecordsList = catchAsyncError(async (req, res, next) => {

  const { page = 1, pageSize = 3000,type=TYPE_HISTORY,sort } = req.query;

  try {
    const carId =(req.params.carId); // Convert to ObjectId
    var query = {};
    const search = req.query.search || "";
    // const search= (req.query.search);
    if(carId){ 
      query = {carId: carId};
    }
    const totalRecords = await CarRecords.countDocuments(query);
     
    const pipeline=[
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $unwind: {
          path: '$userData',
          preserveNullAndEmptyArrays: false // Only include documents where there is a matching user
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $lookup: {
          from: 'cars',
          localField: 'carId',
          foreignField: '_id',
          as: 'car'
        }
      },
      {
        $match: {
          $or: [
            { 'userData.fullName': { $regex: search, $options: 'i' } },
            { 'category.title': { $regex: search, $options: 'i' } }
          ]
        }
      },
      {
        $addFields: {
          
          remindMeText: {
            $concat: [
              { $cond: [{ $eq: ['$is_repeating', true] }, 'every', 'in'] },
              ' ',
              { $toString: '$occurance' },
              ' ',
              {
                $cond: [
                  { $eq: ['$occurance_type', 'mileage'] },
                  // { $ifNull: [{ $arrayElemAt: ['$userData.preferences.distance', 0] }, ''] },
                  { $ifNull: ['$userData.preferences.distance', ''] },
                  '$occurance_date_timeframe'
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          // Include desired fields from joined documents
           
         _id:1,
         carId:1,
         occurance_type:1,
         occurance_date_timeframe:1,
         remindMeText:1,
         occurance:1,
         logDate:1,
         endDate:1,
         options:1,
         location:1,
         mileage:1,
         notecardType:1,
         notes:1,
         isActive:1,
         isHistory:1,
         isRepeating:1,
         
         type:1,
          // userId:{$first:'$userData'},
          userId: '$userData', // Directly project the user ID
          categoryId: { $first: '$category' }, // Select only title from category
          //carId: { $first: '$car' } // Assuming carImage is in carId
        }
      },
      { $skip: (page - 1) * pageSize },
      { $limit: Number(pageSize) }
    ];
    if (carId) {
      console.log("car Id value=>",carId)
      pipeline.push({
          $match: {
            carId: new ObjectId(carId)
          }
      });
  }
    if(sort)
    {
        const sortField = Object.keys(sort);            
        sortOrder ={[sortField[0]]:sort[sortField].ascending === 'true' ? 1 : -1}; 
         
        pipeline.push({
          $sort: sortOrder
        });
    }


    const records = await CarRecords.aggregate(pipeline);

    
     
    const response = {
      result: records,
      page: Number(page),
      totalRecords,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching records:', error.message);
    res.status(500).json({ error: 'Internal Server Error :'+error.message });
  }
 
});

const deleteCarRecord = catchAsyncError(async (req, res, next) => {
  try { 
      const query = {
          _id: req.params.id
      };

      const carRecordInfo = await CarRecords.findOne(query);
      if (!carRecordInfo) {
          console.log('Car record not found');
          return;
      }

      // Delete the car record
      const result = await CarRecords.deleteOne(query);

      if (result.deletedCount > 0) {
          
          res.status(200).json({ message: "Car record deleted successfully", result });
      }else{
          return next(new ErrorHandler("Car record counld not deleted", 404, res));
      }
            

  } catch (err) {
      next(err);
  }
});


const statusCarRecord = catchAsyncError(async (req, res, next) => {
  try {

      const query = {
          _id: req.params.id
      };


      const updatedCarRecord = await CarRecords.findOneAndUpdate(
          query,
          {
              $set: {
                  isActive:req.body.isActive
              },
          },
          { new: true }
      );


      if (!updatedCarRecord) {
          return next(new ErrorHandler("Car record not found", 404, res));
      }

      res.status(200).json({ message: "Car record status updated successfully", updatedCarRecord });
  } catch (error) {
      next(error);
  }
});

const markComplete=catchAsyncError(async (req, res, next)=>{
  
  const {logDate}=req.body;
  let {mileage }=req.body;
 
  if(req.body.mileage)
  {
   
    if (isNaN(req.body.mileage)) {
      //return res.status(400).json({ error: 'Price should be a number' });
     return  res.status(500).json({message: "Mileage should be a number format. Please exclude special characters."});
    }
  }
  const unit=(req.user.preferences?.distance!=='km')?'miles':'km';
  const record = await CarRecords.findOne({   _id: req.params.id,
    userId: req.user._id });
    await record.populate({
      path: 'carId',
      select: 'mileage'
    });
    if(unit=='miles')
    {
      mileage=milesToKilometers(mileage,true) ;
    }

   if(!record)
    {
      res.status(404).json({message:"Record not found"});
      return ; 
    }
    if(record.isHistory)
    {
      res.status(500).json({message:"This card has already been processed"});
      return ;
    }
    if(mileage<=record.carId.mileage)
    {
      res.status(500).json({message:"Mileage should be more than original logged mileage "+mileage+" --"+record.carId.mileage});
      return ; 
    }
    
 
    record.isHistory=true;
    if(logDate && logDate.length) 
    {
      record.completedOn=logDate;
      record.logDate=logDate;
      const currentDate=new Date() ; 
      const enteredDate=new Date(logDate); 
      if(enteredDate>currentDate)
      {
        res.status(500).json({message:"Cannot mark completed for future date"});
        return ; 
      }
     
    }
    record.mileage=mileage;
    record.isActive=false;

    record.carId.mileage=mileage; 
    await record.save(); 
    const clonedRecordData = { ...record.toObject(), _id: undefined };
    if(record.occurance_type &&   record.is_repeating)
    {
      // Create a new carRecord instance with the cloned data
      const clonedRecordModel = new CarRecords(clonedRecordData);
      clonedRecordModel.isHistory=false;
      clonedRecordModel.completedOn=null;
      if(clonedRecordModel.occurance_type=='mileage')
      {
        clonedRecordModel.mileage=clonedRecordModel.mileage+((req.user.preferences.distance=='km')?clonedRecordModel.occurance:milesToKilometers(clonedRecordModel.occurance)) ; 
      }
      else 
      {
        clonedRecordModel.logDate=moment().add(clonedRecordModel.occurance,clonedRecordModel.occurance_date_timeframe);
      }
      clonedRecordModel.isActive=true;
      await clonedRecordModel.save();
      

      clonedRecordModel.parentId=record._id ; 
      await clonedRecordModel.save();
    }



 
    await record.carId.save(); 

    res.status(200).json({message:"The Vehicle record marked as completed  ",data:record});
      return ; 

});


const recordDelete = catchAsyncError(async (req, res, next) => {
  try {
     
    console.log(req.user);
      const query = {
          _id: req.params.id,
          
      };
      console.log(query); 

      const document = await CarRecords.findOneAndDelete(query);
      if (!document) {
          console.log('Car Record not found');
          res.status(404).json({ message: "Car record not found" });
          return;
      }

 

      if (document ) {
           
          res.status(200).json({ message: "Car record deleted successfully"});
        
          return ; 
      }else{
 
          return next(new ErrorHandler("Car record could not be deleted", 500, res));
      }
            

  } catch (err) {
      console.log(err);
      return next(new ErrorHandler("Internal server error", 500, res));
  }
});



module.exports = {markComplete, createCarRecord, carRecordsList, carRecordsUpcomingList, adminCarRecordsList, deleteCarRecord, statusCarRecord ,updateCarRecord,recordDelete};
