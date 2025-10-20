const Product = require('../models/Product');
const Report = require('../models/Report'); // We need this to check for usage

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

// @desc    Delete a master product
// @route   DELETE /api/products/:id
// @access  Private (Official Only)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if the product is being used in any reports
        const reportUsingProduct = await Report.findOne({ productName: product.name });
        if (reportUsingProduct) {
            return res.status(400).json({ success: false, message: 'Cannot delete product as it is used in existing reports.' });
        }

        await product.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};