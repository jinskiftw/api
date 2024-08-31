const express = require('express');
const {index,createCheckoutSession,sessionStatus,recentTransactions,cancelUserSubscription} = require('../controllers/paymentController');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();


router.get('/payment', 
            isAuthincated,
            index);

router.post('/create-checkout-session', isAuthincated,createCheckoutSession);

router.post('/payment/cancel', isAuthincated,cancelUserSubscription);
router.get('/session-status', isAuthincated,sessionStatus);
router.get('/dashboard/recent-transaction',recentTransactions);
       

module.exports = router;
