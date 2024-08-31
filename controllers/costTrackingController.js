

const Record = require('../models/carRecords');
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const fs = require('fs');

 const aggregationPipeline =(carId,year)=> {
  console.log(" yearyearyearyeari is ",year);
  return [
    {
     
        $match: {
            logDate: {
                $gte: new Date(year, 0, 1),
                $lte: new Date(year, 11, 31)
           
            },
            isHistory:true,
            carId: new mongoose.Types.ObjectId(carId),
        },
    },
    {
        $unwind: '$options',
    },
    {
        $lookup: {
            from: 'categories', // Replace with the actual name of your categories collection
            localField: 'categoryId',
            foreignField: '_id', // Assuming _id is the field in the categories collection
            as: 'categoryInfo',
        },
    },
    {
        $unwind: {
            path: '$categoryInfo',
            preserveNullAndEmptyArrays: true, // Preserve documents that don't have matching categories
        },
    },
    {
        $group: {
            _id: {
                month: { $month: '$logDate' },
                categoryId: '$categoryId',
            },
            categoryName: { $first: '$categoryInfo.title' }, // Assuming 'name' is the field in the  
            categoryId: {$first:'$categoryId'},
            sumOfCosts: { $sum: '$options.cost' },
        },
    },
    {
      $project: {
        _id: 1,
        categoryName: 1,
        categoryId: 1,
        sumOfCosts: { $round: ['$sumOfCosts', 0] }, // Round to 2 decimal places
      },
    },
    {
      $sort: {
         
          '_id.categoryId': 1,  // Then sort by categoryId in ascending order
      },
  },
];
 }
 

const costOfOwnership=catchAsyncError(async (req,res,next)=>{

 
    let response={};
    try {
      const {carId}=req.params; 
      const {year=(new Date()).getFullYear()}=req.query; 
        const result = await Record.aggregate(aggregationPipeline(carId,year)).exec();
      response.data=result ;
      res.json(response);
    } catch (error) {
      //console.log(error);
      console.error('Error fetching records:', error.message);
      res.status(500).json({ error: 'Internal Server Error :'+error.message });
    }
});
  

 
 
const aggregationPipeline2 = (carId=null) =>{
  const pipeline=  [
    {
      $match: {
       
        isHistory:true,
       
      },
    },
    {
      $unwind: '$options',
    },
    {
      $group: {
        _id: '$categoryId',
        carId: { $first: '$carId' },
        sumOfCosts: { $sum: '$options.cost' },
      },
    },
    {
      $lookup: {
        from: 'categories', // Assuming your category collection is named 'categories'
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: '$category',
    },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        carId: 1,
        categoryName: '$category.title', // Change 'name' to the actual field you want to project
        sumOfCosts:  { $round: ['$sumOfCosts', 2] } ,
      },
    },
  ];
  if (carId !== null) {
    pipeline[0].$match.carId = new mongoose.Types.ObjectId(carId);
  }
  return pipeline ; 
}
  
const costBreakdown=catchAsyncError(async (req,res,next)=>{

    console.log("entered") ; 
 
    let response={};
    try {
        const {carId}=req.params; 
        const result = await Record.aggregate(aggregationPipeline2(carId)).exec();
        console.log("result is ",result);
        console.log("pipeline is ",aggregationPipeline2(carId));
        response.data=result;
      res.json(response);
    } catch (error) {
      //console.log(error);
      console.error('Error fetching records:', error.message);
      res.status(500).json({ error: 'Internal Server Error :'+error.message });
    }
});




module.exports = { costOfOwnership ,costBreakdown};
