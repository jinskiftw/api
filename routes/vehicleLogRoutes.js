const express = require('express');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();


const {adminCarRecordsList, deleteCarRecord, statusCarRecord,markComplete} = require('../controllers/carRecordController');

router.get('/all',isAuthincated, adminCarRecordsList);
router.get('/:carId',isAuthincated, adminCarRecordsList);
router.delete('/delete/:id', isAuthincated, deleteCarRecord);
router.patch('/update-status/:id', isAuthincated, statusCarRecord);



router.patch('/:id/complete', isAuthincated, markComplete);

module.exports = router;
