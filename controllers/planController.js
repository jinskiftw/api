const PlanModel = require("../models/planModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const fs = require('fs').promises; 

const index = catchAsyncError(async (req, res, next) => {
    try {
        const search= (req.query.search)?req.query.search:'';
        const sort=req.query.sort ; 
        let sortObj={};
        if(sort)
        {
            const sortField = Object.keys(sort);            
            sortOrder ={[sortField[0]]:sort[sortField].ascending === 'true' ? 1 : -1}; 
           
            sortObj=(sortOrder);
        }
    
    

        const query = {
          
            title: {$regex: search, $options: 'i' }
        };
        const plans = await PlanModel.find(query).sort(sortObj);

        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        next(error)
    }
});

const getPlan = catchAsyncError(async (req, res, next) => {
    try {
        const query = {
            _id: req.params.id,
        };
        const plan = await PlanModel.findOne(query);

        if (!plan) {
            return next(new ErrorHandler("Plan not found", 404, res));
        }

        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        next(error)
    }
});



const create = catchAsyncError(async (req, res, next) => {

    try {
        const userId = req.user._id
        const { title, type, description, price,isRecurring=false,garageLimit=1 } = req.body;
      
        // Convert the comma-separated string into an array of objects
        console.log("req.body",req.body); 
        const model = new PlanModel({
            title: title,
            type,
            description,
            price,
            isRecurring,
            garageLimit
        });
        
        const data = await model.save();
        res.status(200).json({ message: "Plan Created successfully", data });
    } catch (error) {
        next(error)
    }
});


const update = catchAsyncError(async (req, res, next) => {
    try {
   
        const query = {
            _id: req.params.id
        };
   
        const data= { title, type, description, price,isRecurring=false,garageLimit=1 } = req.body;
 
        const updatedCategory = await PlanModel.findOneAndUpdate(
            query,
            {
                $set: data,
            },
            { new: true }
        );

        if (!updatedCategory) {
            return next(new ErrorHandler("Plan not found", 404, res));
        } 

        res.status(200).json({ message: "Plan updated successfully", updatedCategory });
    } catch (error) {
        next(error);
    }
});


const destroy = catchAsyncError(async (req, res, next) => {
    try {
        const query = {
            _id: req.params.id
        };

        const category = await PlanModel.findOne(query);
        if (!category) {
            console.log('Plan not found');
            return;
        }

        // Delete the category record
        const result = await PlanModel.deleteOne(query);

        if (result.deletedCount > 0) {
            
            res.status(200).json({ message: "Plan deleted successfully", result });
        }else{
            return next(new ErrorHandler("Plan could not be deleted", 404, res));
        }
              

    } catch (err) {
        next(err);
    }
});


module.exports = {index,create,update,getPlan,destroy};
