const Product = require('../models/Product');

// @desc    Get all master products
// @route   GET /api/products
// @access  Private
exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ name: 1 });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create a new master product
// @route   POST /api/products
// @access  Private (Official Only)
exports.createProduct = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Product name is required' });
        }
        
        const existingProduct = await Product.findOne({ name: new RegExp(`^${name}$`, 'i') });
        if (existingProduct) {
            return res.status(400).json({ success: false, message: 'Product already exists' });
        }
        
        const product = await Product.create({ name });
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};