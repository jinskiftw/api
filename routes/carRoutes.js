const express = require('express');
const { transferOwnership,getAllCars,getAllArchivedCars, getCarById, createCar, updateCar,updateImage, updateImageWithoutImageId, deleteCar, statusCar } = require('../controllers/carController');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();
const { carupload ,documentupload} = require('../utils/multer') ;
const sharp = require('sharp');
const fs = require('fs');



// Middleware to resize images
const resizeImages = (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const width = parseInt(req.query.width) || 800; // Default width if not specified
  const height = parseInt(req.query.height) || null;

  const resizePromises = req.files.map((file) => {
    const tempPath = file.path + '.tmp'; // Temporary file path
    return sharp(file.path)
      .resize(width, height)
      .toFile(tempPath)
      .then(() => {
        fs.renameSync(tempPath, file.path); // Replace original file with resized file
      })
      .catch((err) => {
        console.error(`Error resizing file ${file.filename}:`, err);
        throw err;
      });
  });

  Promise.all(resizePromises)
    .then(() => next())
    .catch((err) => next(err));
};



const {createCarRecord,updateCarRecord ,carRecordsList,carRecordsUpcomingList,recordDelete} = require('../controllers/carRecordController');

const {allCarDocument,createCarDocument,updateDocument,deleteDocument} =require('../controllers/carDocumentController');

router.get('/allCars', isAuthincated, getAllCars);
router.get('/allArchivedCars', isAuthincated, getAllArchivedCars);
router.get('/cars/:id', isAuthincated, getCarById);

const fileSizeLimitErrorHandler = (err, req, res, next) => {
  
 
 
    if (err) {
        
      res.status(500).json({ message:(err.message=='File too large')?'Picture file is too large. The maximum size of each photo should be under 5 megabytes.':err.message });
    } else {
      next()
    }
  }
router.post('/cars', isAuthincated, carupload.array('carImage'),resizeImages,fileSizeLimitErrorHandler, createCar);
router.put('/updateCars/:id', isAuthincated, updateCar);
router.put('/updateImage/:carId/:imageId', isAuthincated, carupload.array('carImage'),resizeImages,  fileSizeLimitErrorHandler, updateImage);

  
router.put('/updateImage/:carId', isAuthincated, carupload.array('carImage'),resizeImages ,fileSizeLimitErrorHandler, updateImageWithoutImageId);
router.delete('/car/delete/:id', isAuthincated, deleteCar);
router.patch('/car/update-status/:id', isAuthincated, statusCar);

router.post('/updateCarRecords/:carId',isAuthincated,createCarRecord);
router.patch('/updateCarRecords/:carRecordId',isAuthincated,updateCarRecord);


router.get('/car/:carId/records',isAuthincated,carRecordsList);
router.post('/car/:carId/document',isAuthincated,documentupload.single('documentFile'),createCarDocument);

router.get('/car/:carId/document',isAuthincated,allCarDocument);

router.delete('/document/:id',isAuthincated,deleteDocument);
router.post('/document/:id',isAuthincated,documentupload.single('documentFile'),updateDocument);

router.get('/car/:carId/records_upcoming',isAuthincated,carRecordsUpcomingList);
router.delete('/car/record/:id',isAuthincated,recordDelete);
 



router.post('/car/:id/transfer_ownership',isAuthincated,transferOwnership);



module.exports = router;
