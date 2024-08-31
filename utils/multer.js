const uniqid = require('uniqid');

const multer = require("multer");
const path = require("path");
 
const carstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/cars/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Math.floor(Math.random() * 899999 + 100000) +
        path.extname(file.originalname)
    );
  },
});

const carupload = multer({
  storage: carstorage,
  fileFilter: (req, file, cb) => {
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      // Return an error if file size exceeds limit
      cb(new Error('File size exceeds 2 MB limit'));
    } else {
      // Proceed with file upload if size is within limit
      cb(null, true);
    }
  },
    limits: { fileSize: 5 * 1024 * 1024 },
   

});

const categorystorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/category/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Math.floor(Math.random() * 899999 + 100000) +
        path.extname(file.originalname)
    );
  },
});
const categoryupload = multer({
  storage: categorystorage,
});



const documentstorage = multer.diskStorage({
 
  destination: function (req, file, cb) {
 
    cb(null, "./uploads/document/");
  },
  filename: function (req, file, cb) {
 

    cb(
      null,
      uniqid() +
        path.extname(file.originalname)
    );
  },
});
const documentupload = multer({
  storage: documentstorage,
});


const profileImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/user/");
  },
  filename: function (req, file, cb) {
    console.log("File is ",file); 
    cb(
      null,
      Math.floor(Math.random() * 899999 + 100000) +
        path.extname(file.originalname)
    );
  },
});

// Configure Multer for image storage and validation
const profileImageUpload = multer({
 storage:profileImageStorage
});
module.exports = {documentupload, carupload, categoryupload ,profileImageUpload};