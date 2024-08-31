const express = require('express');
const Blog = require('../controllers/blogController');
const { isAuthincated } = require("../middleware/authincation");
const router = express.Router();


router.get('/', 
            isAuthincated,
            Blog.index);

router.post('/', isAuthincated,Blog.createBlog);

router.post('/:id', isAuthincated,Blog.updateBlog);
router.delete('/:id',isAuthincated,Blog.deleteBlog);
       

module.exports = router;
