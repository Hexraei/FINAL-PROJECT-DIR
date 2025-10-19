const express = require('express');
const router = express.Router();
const { getProducts, createProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProducts)
    .post(protect, authorize('official'), createProduct);

module.exports = router;