const express = require('express');
const { getAllCategories, getCategory, createCategory, updateCategory, deleteCategory, statusCategory } = require('../controllers/categoryController');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();
const { categoryupload } = require('../utils/multer')


router.get('/allCategories', isAuthincated, getAllCategories);
router.get('/:id', isAuthincated, getCategory);
router.post('/save', isAuthincated, categoryupload.fields([{ name: 'catIcon', maxCount: 1 }, { name: 'catIcon2', maxCount: 1 }]), createCategory);
router.post('/update/:id', isAuthincated, categoryupload.fields([{ name: 'catIcon', maxCount: 1 }, { name: 'catIcon2', maxCount: 1 }]), updateCategory);
router.delete('/delete/:id', isAuthincated, deleteCategory);
router.patch('/update-status/:id', isAuthincated, statusCategory);

module.exports = router;
