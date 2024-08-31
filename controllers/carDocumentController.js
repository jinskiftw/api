

const carDocumentModel = require('../models/carDocumentModel');
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const mongoose = require('mongoose');
const fs = require('fs');

 

const allCarDocument=catchAsyncError(async (req,res,next)=>{


    const { page = 1, pageSize = 3000 } = req.query;
 
 
    try {
      const carId =(req.params.carId); // Convert to ObjectId
  
      
      const totalRecords = await carDocumentModel.countDocuments( {carId } );
       
      const recordsQuery = { carId };

      if (req.query.search) {
       
        recordsQuery.documentName = { $regex: req.query.search, $options: 'i' }; // Case-insensitive search
      }

      const records = await carDocumentModel.find(recordsQuery )
        .skip((page - 1) * pageSize)
        .sort({ createdAt: -1 })
        .limit(Number(pageSize));
  
      const response = {
        result: records,
        page: Number(page),
        totalRecords,
      };
     
      res.json(response);
    } catch (error) {
      //console.log(error);
      console.error('Error fetching records:', error.message);
      res.status(500).json({ error: 'Internal Server Error :'+error.message });
    }
});
 const createCarDocument= catchAsyncError(async (req, res, next) =>{
    try 
    {
      console.log("attr create",req.body);
      console.log("attr create",req.params);
      console.log("attr create",req.query);
  
        const userId=req.user._id; 
        const model = new carDocumentModel({
            ...req.body,
            ...req.params,
            userId,
            documentFile: req.file.filename,
          
        });

        const newCategory = await model.save();

        if(newCategory)
        {
            res.status(200).json({ message: "Document added successfully", data: newCategory  });
        }
        else 
        {
            res.status(500).json({messsage:"Something went wrong "});
        }

    


 
    }
    catch (e)
    {
        console.log(e);
        if (req.file) {
            const filePath = req.file.path;
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error deleting uploaded file:', unlinkErr);
              }
            });
          }
        next(e);
    }


});



const updateDocument= catchAsyncError(async (req, res, next) =>{
  try 
  {
      
    console.log("attr update",req.body);
    console.log("attr update",req.params);
    console.log("attr update",req.query);


      const userId=req.user._id; 
 
      const attr={


        ...req.body

    };

    if( req.file?.filename)
    {
      attr.documentFile=req.file.filename;
    }



    
      const model =  await carDocumentModel.findOneAndUpdate({_id:req.params.id,userId},attr,  { new: true });
      if(!model)
      {
        res.status(404).json({ message: "Record Not found" });
        return ; 
      }
      const data = await model.save();

      if(data)
      {
          res.status(200).json({ message: "Document updated successfully",  data  });
      }
      else 
      {
          res.status(500).json({messsage:"Something went wrong "});
      }

  



  }
  catch (e)
  {
      console.log(e);
      if (req.file) {
          const filePath = req.file.path;
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('Error deleting uploaded file:', unlinkErr);
            }
          });
        }
      next(e);
  }


});


const deleteDocument = catchAsyncError(async (req, res, next) => {
  try {
     
    console.log(req.user);
      const query = {
          _id: req.params.id,
          
      };
      console.log(query); 

      const document = await carDocumentModel.findOneAndDelete(query);
      if (!document) {
          console.log('Car document not found');
          res.status(404).json({ message: "Car document not found" });
          return;
      }

 

      if (document ) {
          
          res.status(200).json({ message: "Car document deleted successfully"});
          if (document.documentFile) {
            const filePath = `./uploads/document/${document.documentFile}`;
            fs.unlink(filePath, (unlinkErr) => {
              if (unlinkErr) {
                console.error('Error deleting uploaded file:', unlinkErr);
              }
            });
          }
          return ; 
      }else{
 
          return next(new ErrorHandler("Car document could not be deleted", 500, res));
      }
            

  } catch (err) {
      console.log(err);
      return next(new ErrorHandler("Internal server error", 500, res));
  }
});






module.exports = { allCarDocument, createCarDocument,updateDocument,deleteDocument };
