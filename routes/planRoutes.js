const express = require('express');
const {index, getPlan, create, update, destroy} = require('../controllers/planController');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();


router.get('/', isAuthincated, index);
router.get('/:id', isAuthincated, getPlan);
router.post('/', isAuthincated,  create);
router.put('/:id', isAuthincated,update);
router.delete('/:id', isAuthincated, destroy);
 
module.exports = router;
