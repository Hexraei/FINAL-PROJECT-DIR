const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a product name'],
        unique: true,
        trim: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);