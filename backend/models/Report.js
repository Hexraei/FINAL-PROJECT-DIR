const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    modifiedAt: {
        type: Date,
        default: Date.now
    },
    modifiedBy: {
        type: String,
        required: true
    },
    changes: {
        productName: { from: String, to: String },
        quantity: { from: Number, to: Number },
        entryDate: { from: Date, to: Date },
    }
}, { _id: false });

const ReportSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, 'Please provide a product name'],
        trim: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide a quantity'],
    },
    entryDate: {
        type: Date,
        required: [true, 'Please provide an entry date']
    },
    submittedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedByUsername: {
        type: String,
        required: true,
    },
    history: [HistorySchema]
}, { timestamps: true }); // `createdAt` will be our original timestamp

module.exports = mongoose.model('Report', ReportSchema);