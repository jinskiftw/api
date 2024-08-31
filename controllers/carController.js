
const {Car,CarOwnershipTranser} = require('../models/carDetail');
const User = require('../models/userModel');
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const { milesToKilometers } = require('../utils/mileage');

const ejs = require('ejs');
const {sendHtmlEmail} = require('../utils/sendEmail.js');

const path=require('path');
const validator = require('validator');

const getAllArchivedCars = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;
        
       
    
 
        const query = {};
    
        const searchTerm = req.query.search;   

        
        const cars = await Car.aggregate([
            {
                $match: query, // Add a $match stage to filter by carId if it exists
            },
          
            {
                $match:(searchTerm)?{$or:[
                    {manufacturer: { $regex: searchTerm, $options: 'i' } },
                    {model: { $regex: searchTerm, $options: 'i' } }

                ]}:{}
            },
            {
                $lookup: {
                    from: "carownershiptransfers", // The name of the collection to join with
                    localField: "_id", // The field from the Car collection
                    foreignField: "carId", // The field from the archived collection
                    as: "archivedCars" // The name of the field to store the joined documents
                }
            },
            {
                $match: {
                    "archivedCars.fromUser":  userId
                }
            }
             
            
          ]);
        
        res.status(200).json({ message: "Cars retrieved successfully "+userId, cars });
    } catch (error) {
        next(error)
    }
});


const getAllCars = catchAsyncError(async (req, res, next) => {
    try {
   
        const userId = req.user._id;
        
      
     

        const carId = req.query.carId;
        const sort = req.query;
        console.log("sort is ",sort); 
       
        const query = {};
        if (carId) {
            query._id = new mongoose.Types.ObjectId(carId);
        }
        const searchTerm = req.query.search;   


        const sortConfig = req.query.sort;
        let  sortOrder=null;
        if(sortConfig)
        {
            const sortField = Object.keys(sortConfig);            
            sortOrder ={[sortField[0]]:sortConfig[sortField].ascending === 'true' ? 1 : -1};  

        }
 
        console.log("sortConfig is ",sortConfig);  
        const pipeline=[
            {
                $match: query, // Add a $match stage to filter by carId if it exists
            },
            {
                $match: { userId: req.user.role === 'admin' ? { $exists: true } : req.user._id },
            },
            {
                $match:(searchTerm)?{$or:[
                    {manufacturer: { $regex: searchTerm, $options: 'i' } },
                    {model: { $regex: searchTerm, $options: 'i' } }

                ]}:{}
            }
            
          ];
          if(req.user.role === 'admin')
          {
            
            pipeline.push({
              $lookup: {
                from: 'carrecords', // The name of the CarRecords collection
                localField: '_id',
                foreignField: 'carId',
                as: 'carRecords',
              },
            },
            {
                $lookup: {
                  from: 'users', // Assuming your User collection is named 'users'
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user',
                }
            },
            {
                $unwind: {
                    path: '$user', // Unwind to work with individual user documents
                    preserveNullAndEmptyArrays: false // Exclude documents without matching user
                }
            },
            {
                $addFields: {
                    // 'userFullName': { $arrayElemAt: ['$user.fullName', 0] }, // Assuming 'fullName' is a field in the User model
                    userFullName: '$user.fullName',
                    purchasePriceWithUnit:'$purchasePriceWithUnit',
                    'carRecordsCount': { $size: {
                        $filter: {
                            input: '$carRecords',
                            as: 'record',
                            // cond: { $eq: ['$$record.isHistory', false] }
                            cond: { $eq: [true, true] }
                        }
                    } },
                }
            } );
            if (sortOrder) {
                pipeline.push({
                  $sort: sortOrder
                });
              }
          }
          else 
          {
            pipeline.push( {
                $lookup: {
                  from: 'carrecords', // The name of the CarRecords collection
                  localField: '_id',
                  foreignField: 'carId',
                  as: 'carRecordsCount',
                  let: { carId: '$_id' },
                  pipeline: [
                      {
                          $match: {
                              $expr: {
                                  $eq: ['$carId', '$$carId']
                              },
                              isHistory: false  
                          }
                      },
                      {
                        $count: 'carRecordsCount' 
                    }
                  ]
                },
              });
              pipeline.push({
                $sort: {createdAt:1}
              });
              pipeline.push(  {   $addFields: {
                'carRecordsCount': { $ifNull: [{ $arrayElemAt: ['$carRecordsCount.carRecordsCount', 0] }, 0] }



            } });

         
          }
          if(req.user.role === 'admin')
          {
            const cars = await Car.aggregate(pipeline);
          }
          else 
          {
            const cars = await Car.aggregate(pipeline);
          }
        

         // const cars = (req.user.role === 'admin')?await Car.aggregateWithDeleted(pipeline):await Car.aggregate(pipeline);
          const cars = await Car.aggregate(pipeline);
       
          
          console.log(cars.userId);
          const documents = [];
          const carCnt= await Car.countDocuments({userId:req.user._id});
          const user=req.user; 
          await user.populate('planId') ;
          if(user.role!='admin' && !user.planId)
          {
              res.status(500).json({ message: "Please buy a plan" });
              return ;
          }
  
             
for (const doc of cars) {
    const hydratedDoc = await Car.hydrate(doc);
    hydratedDoc.userId=req.user; 
    const virtuals = Object.keys(Car.schema.virtuals);
    const obj=  hydratedDoc.toObject({ virtuals: true });
 
    console.log(obj);
    if(user.planId && documents.length>=user.planId.garageLimit)
    {
        break; 
    }
    documents.push(obj);
}

        
        res.status(200).json({ message: "Archived Cars retrieved successfully", cars:documents });
    } catch (error) {
        next(error)
    }
});


const transferOwnership = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;
        
        const query = {
            _id: req.params.id,
            userId
        };
         
        if (!req.body.email || !validator.isEmail(req.body.email)) {
           //return res.status(400).json({ error: 'Invalid email address' });
            return next(new ErrorHandler("Invalid email address", 400, res));
        }

        
        const car = await Car.findOne(query);
       
        const user = await User.findOne({email:req.body.email,role:"user"});

        if (!user) {
              
        ejs.renderFile(path.join(__dirname,'..', 'views','email', 'ownershipTransferUnregistered.ejs'), {car,  user:req.user }, (err, html) => {
            
            console.log("err",err);
            sendHtmlEmail(req.body.email,'Wheelman: Car Transfer',html);
    
        });
        return res.status(200).json({ success: true, message: `User not registered in the platform. A signup link has been forwarded to this user .`, data: car });
       // return ;
         //   return next(new ErrorHandler("User not found with email "+req.body.email, 404, res));
        } 


        if (!car) {
            return next(new ErrorHandler("Car not found", 404, res));
         }

 
         await user.populate('planId');
        
         if(!user.planId)
         {
            return next(new ErrorHandler("Plan", 404, res));
         }
         const carCnt= await Car.countDocuments({userId:user._id});
         
        const ownershipQuery={
            fromUser:userId,
            toUser:user._id,
            carId:car._id,
            status:'complete'
        }
      
        car.userId=user._id ; 
        car.createdAt=new Date();
        await car.save() ; 
       
        const ownershipModel=new CarOwnershipTranser(ownershipQuery);
        await ownershipModel.save();
        const garageLink=(carCnt>= user.planId.garageLimit)?`${process.env.FRONTEND_URL}/profile?tab=3`:`${process.env.FRONTEND_URL}/dashboard`;

        const garageLinkName=(carCnt>= user.planId.garageLimit)?`Upgrade Plan`:`Go to Garage`; 
        
       
        ejs.renderFile(path.join(__dirname,'..', 'views','email', 'ownershipTransfer.ejs'), {carCnt,car,newUser:user, user:req.user ,garageLink,garageLinkName}, (err, html) => {
            
            console.log("err",err);
            sendHtmlEmail(user.email,'Wheelman: Car Transferred',html);
    
        });

        res.status(200).json({ success: true, message: `Your car has been successfully transferred to '${user.fullName}' .`, data: car });
    } catch (error) {
        res.status(500).json({ success: true, message:  `Internal server error` });
        next(error)
    }
});


const getCarById = catchAsyncError(async (req, res, next) => {
    try {

        const query = req.user.role=='admin'? {
            _id: req.params.id, 
        }:{
            _id: req.params.id,
            userId: req.user._id,
        };
        const car = await Car.findOne(query).populate('userId');
        
     
        if (!car) {
            return next(new ErrorHandler("Car not found", 404, res));
        }

        res.status(200).json({ success: true, message: "Car retrieved successfully", data: car.toObject({ virtuals: true }) });
    } catch (error) {
        next(error)
    }
});


const createCar = catchAsyncError(async (req, res, next) => {
    try { 
        const userId = req.user._id
        const carCnt= await Car.countDocuments({userId});
        const user=req.user; 
        await user.populate('planId') ;
        if(!user.planId)
        {
            res.status(500).json({ message: "Please buy a plan" });
            return ;
        }

        if(carCnt>=user.planId.garageLimit)
        {
            res.status(500).json({ message: "You don’t have enough garage spaces. Please upgrade your plan to add another car."});
            return ; 
        }
        const images = req.files.map((item) => {
            return { _id: new mongoose.Types.ObjectId(), image: item.filename };
        });
        const mileageUnit=(req.user.preferences?.distance!=='km')?'miles':'km';
        if (mileageUnit !== 'km' && req.body.mileage) {
    
        
            req.body.mileage= milesToKilometers(req.body.mileage);
          
            
          
        }
        if(req.body.drivenPerYear)
        {
            req.body.drivenPerYear=(req.user?.preferences?.distance!='km')?milesToKilometers(req.body.drivenPerYear):req.body.drivenPerYear;
        }
        const car = new Car({
            userId,
            carImage: images,
            ...req.body,
        });
        const newCar = await car.save();

     

        
        res.status(200).json({ message: "Cars Created successfully", data: newCar });
    } catch (error) {
        next(error)
    }
});


const updateCar = catchAsyncError(async (req, res, next) => {
    try {

        const query = {
            _id: req.params.id,
            userId: req.user._id,
        };
        const data=req.body ; 
        if(req.body.drivenPerYear)
        {
            data.drivenPerYear=(req.user?.preferences?.distance!='km')?milesToKilometers(req.body.drivenPerYear):req.body.drivenPerYear;
        }

        if(req.body.mileage)
        {
            data.mileage=(req.user?.preferences?.distance!='km')?milesToKilometers(req.body.mileage):req.body.mileage;
        }


   //     const drivenPerYear=(req.user?.preferences?.distance=='miles')?milesToKilometers(req.body.drivenPerYear):req.body.drivenPerYear;
        console.log("req.body is ",req.body);
        const updatedCar = await Car.findOneAndUpdate(
            query,
            data,
            
            { new: true }
        );

        if (!updatedCar) {
            return next(new ErrorHandler("Car not found", 404, res));
        }

        res.status(200).json({ message: "Car updated successfully", updatedCar });
    } catch (error) {
        next(error);
    }
});

const updateImage = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id;
        const carId = req.params.carId;
        console.log('<<-- req.files -->>', req.files);
        const images = req.files.map((item) => {
            return { image: item.filename };
        });

        //console.log('images', images);

        const imageId = req.params.imageId;
        const carInfo = await Car.findOne({ userId: userId, _id: carId });
        //console.log('imageId-->>', imageId);

        if (imageId) {
            const index = carInfo.carImage.findIndex(item => item._id.toString() === imageId);
            if (index !== -1) {
                carInfo.carImage[index].image = images[0].image;
            } else {
                return res.status(404).json({ message: 'Image not found for the given imageId' });
            }
        } else {
            carInfo.carImage.push(images[0].image);
        }

        await carInfo.save();
        console.log(carInfo);
        res.json({ message: 'Image updated successfully', updatedCarInfo: carInfo });

    } catch (err) {
        console.log(err);
        next(err);
    }
});

const updateImageWithoutImageId = catchAsyncError(async (req, res, next) => {
    console.log("reached");
    try {
        const userId = req.user._id;
        const carId = req.params.carId;
        const images = req.files.map((item) => {
            return { image: item.filename };
        });
        const carInfo = await Car.findOne({ userId: userId, _id: carId });
        //console.log(carInfo.carImage);
        carInfo.carImage.push(...images.map(image => ({ image: image.image, _id: new mongoose.Types.ObjectId() })));
        await carInfo.save();
        res.json({ message: 'Image updated successfully', updatedCarInfo: carInfo });

    } catch (err) {
        next(err);
    }
});

const deleteCar = catchAsyncError(async (req, res, next) => {
    try {
        const query = {
            _id: req.params.id
        };
        
        if(req.user.role!='admin')
        {
            query.userId=req.user._id; 
        }

        const carInfo = await Car.findOne(query);
        if (!carInfo) {
            console.log("query is ",query);
            console.log('Car not found');
            return; 
        }

        // Delete the car record
        const result = await carInfo.delete();

        if (result ) {
            const images = carInfo.carImage.map(async (item,index) => {
                var imagePath = `./uploads/category/${item.image}`;
                try {
                    await fs.unlink(imagePath);
                    console.log(`Car Image-${index} file deleted successfully`);
                } catch (err) {
                    console.error('Error deleting image file:', err);
                }
            });
            
            res.status(200).json({ message: "Car deleted successfully", result });
        }else{
            return next(new ErrorHandler("Car counld not deleted", 404, res));
        }
              

    } catch (err) {
        next(err);
    }
});


const statusCar = catchAsyncError(async (req, res, next) => {
    try {

        const query = {
            _id: req.params.id
        };


        const updatedCar = await Car.findOneAndUpdateWithDeleted(
            query,
            {
                $set: {
                    deleted:req.body.deleted
                },
            },
            { new: true }
        );


        if (!updatedCar) {
            return next(new ErrorHandler("Car not found", 404, res));
        }

        res.status(200).json({ message: "Car status updated successfully", updatedCar });
    } catch (error) {
        next(error);
    }
});

module.exports = {transferOwnership, getAllCars, getAllArchivedCars,updateImage, getCarById, createCar, updateCar, updateImageWithoutImageId, deleteCar, statusCar };
