const { Product, Report } = require('../models');

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.findAll({ order: [['name', 'ASC']] });
        res.status(200).json({ success: true, data: products });
    } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};

exports.createProduct = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Product name is required' });
        // findOrCreate is a convenient Sequelize method
        const [product, created] = await Product.findOrCreate({ 
            where: { name: name.trim() }, 
            defaults: { name: name.trim() } 
        });
        if (!created) return res.status(400).json({ success: false, message: 'Product already exists' });
        res.status(201).json({ success: true, data: product });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        // Check if the product is being used in any reports before deleting
        const reportUsingProduct = await Report.findOne({ where: { productName: product.name } });
        if (reportUsingProduct) return res.status(400).json({ success: false, message: 'Cannot delete product as it is used in existing reports.' });
        await product.destroy();
        res.status(200).json({ success: true, data: {} });
    } catch (error) { res.status(500).json({ success: false, message: 'Server Error' }); }
};