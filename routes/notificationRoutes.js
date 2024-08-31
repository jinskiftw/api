const express = require('express');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();


const {listing,read, deleteNotification} = require('../controllers/notificationController');
const {costOfOwnership,costBreakdown} = require('../controllers/costTrackingController');

router.get('/notifications',isAuthincated, listing);
router.put('/notifications/:id',isAuthincated, read);
router.delete('/notifications/:id', isAuthincated, deleteNotification);
router.get('/cost-tracking/cost-of-ownership/:carId',isAuthincated, costOfOwnership);
router.get('/cost-tracking/cost-breakdown-by-category/:carId',isAuthincated, costBreakdown);
router.get('/dashboard/cost-tracking/cost-breakdown-by-category', costBreakdown);
module.exports = router;
