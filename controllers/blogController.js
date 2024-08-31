
const {Car,CarOwnershipTranser} = require('../models/carDetail');
const User = require('../models/userModel');
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const { milesToKilometers } = require('../utils/mileage');

const  Blog=require('../models/blogModel'); 

const index = catchAsyncError(async (req, res, next) => {
    try {
        let query = {};
        const { search } = req.query;
        
        // If search query parameter is provided, filter blogs by title or description
        if (search) {
          query = {
            $or: [
              { title: { $regex: search, $options: 'i' } }, // Case-insensitive search
              { description: { $regex: search, $options: 'i' } }
            ]
          };
        }
    
        const blogs = await Blog.find(query);
        res.json(blogs);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }

});


const createBlog = catchAsyncError(async (req, res, next) => {
    try {
        const { title, description, tags } = req.body;
        const blog = new Blog({ title, description, tags });
        await blog.save();
        res.status(201).json(blog);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }

});

const updateBlog = catchAsyncError(async (req, res, next) => {
    try {
        const { title, description, tags } = req.body;
        const blogId = req.params.id;
        const updatedBlog = await Blog.findByIdAndUpdate(blogId, { title, description, tags }, { new: true });
        res.json(updatedBlog);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }

});


const deleteBlog = catchAsyncError(async (req, res, next) => {
    try {
        const { title, description, tags } = req.body;
        const blogId = req.params.id;
        const updatedBlog = await Blog.findByIdAndUpdate(blogId, { title, description, tags }, { new: true });
        res.json(updatedBlog);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }

});




module.exports={index,createBlog,updateBlog,deleteBlog};