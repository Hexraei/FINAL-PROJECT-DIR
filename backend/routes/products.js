const express = require('express');
const router = express.Router();
const { getProducts, createProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProducts)
    .post(protect, authorize('official'), createProduct);

router.route('/:id')
    .delete(protect, authorize('official'), deleteProduct);

module.exports = router;