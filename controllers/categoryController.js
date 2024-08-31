const CatModel = require("../models/categoryModel");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const fs = require('fs').promises; 

const getAllCategories = catchAsyncError(async (req, res, next) => {
    try {
        const search=  (typeof req.query.search=='string')?req.query.search:'';
        const sort=req.query.sort ; 
        let sortObj={};
        if(sort)
        {
            const sortField = Object.keys(sort);            
            sortOrder ={[sortField[0]]:sort[sortField].ascending === 'true' ? 1 : -1}; 
           
            sortObj=(sortOrder);
        }
    
        const categories = await CatModel.find({title: {$regex: search, $options: 'i' } }).sort(sortObj);

        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        next(error)
    }
});

const getCategory = catchAsyncError(async (req, res, next) => {
    try {
        const query = {
            _id: req.params.id,
        };
        const category = await CatModel.findOne(query);

        if (!category) {
            return next(new ErrorHandler("Category not found", 404, res));
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        next(error)
    }
});


const createCategory = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user._id
        const { title, options, isActive,color } = req.body;
  
        // Convert the comma-separated string into an array of objects
        const newCatData = new CatModel({
            title: title,
            icon: req.files && req.files['catIcon'] ? req.files['catIcon'][0].filename : null,
            icon2: req.files && req.files['catIcon2'] ? req.files['catIcon2'][0].filename : null,
            options: options,
            color:color,
            isActive: isActive 
        });
    
        const newCategory = await newCatData.save();
        res.status(200).json({ message: "Category Created successfully", data: newCategory });
    } catch (error) {
        next(error)
    }
});


const updateCategory = catchAsyncError(async (req, res, next) => {
    try {
        const { title, options, oldCatIcon, oldCatIcon2 ,color} = req.body;
        console.log("req.body",req.body); 
        const query = {
            _id: req.params.id
        };


        const updatedCategory = await CatModel.findOneAndUpdate(
            query,
            {
                $set: {
                    title: title,
                    options: options,
                    color:color,
                    icon: req.files && req.files['catIcon'] ? req.files['catIcon'][0].filename : oldCatIcon,
                    icon2: req.files && req.files['catIcon2'] ? req.files['catIcon2'][0].filename : oldCatIcon2,
                },
            },
            { new: true }
        );

        if (!updatedCategory) {
            return next(new ErrorHandler("Category not found", 404, res));
        }else{
           
            try {
                
                if(req.files && req.files['catIcon2'] && req.files['catIcon2'][0].filename!="" ){
                    const imagePath2 = `./uploads/category/${oldCatIcon2}`;
                    await fs.unlink(imagePath2);
                }
                
                
                console.log('old Image file deleted successfully');
            } catch (err) {
                console.error('Error deleting image file:', err);
            }
        }

        res.status(200).json({ message: "Category updated successfully", updatedCategory });
    } catch (error) {
        next(error);
    }
});


const deleteCategory = catchAsyncError(async (req, res, next) => {
    try {
        const query = {
            _id: req.params.id
        };

        const category = await CatModel.findOne(query);
        if (!category) {
            console.log('Category not found');
            return;
        }

        // Delete the category record
        const result = await CatModel.deleteOne(query);

        if (result.deletedCount > 0) {
            const imagePath = `./uploads/category/${category.icon}`;
            const imagePath2 = `./uploads/category/${category.icon2}`;

            try {
                await fs.unlink(imagePath);
                await fs.unlink(imagePath2);
                console.log('Image file deleted successfully');
            } catch (err) {
                console.error('Error deleting image file:', err);
            }
            res.status(200).json({ message: "Category deleted successfully", result });
        }else{
            return next(new ErrorHandler("Category counld not deleted", 404, res));
        }
              

    } catch (err) {
        next(err);
    }
});


const statusCategory = catchAsyncError(async (req, res, next) => {
    try {

        const query = {
            _id: req.params.id
        };


        const updatedCategory = await CatModel.findOneAndUpdate(
            query,
            {
                $set: {
                    isActive:req.body.isActive
                },
            },
            { new: true }
        );


        if (!updatedCategory) {
            return next(new ErrorHandler("Category not found", 404, res));
        }

        res.status(200).json({ message: "Category status updated successfully", updatedCategory });
    } catch (error) {
        next(error);
    }
});

module.exports = { getAllCategories, getCategory, createCategory, updateCategory, deleteCategory, statusCategory};
