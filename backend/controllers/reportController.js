const Report = require('../models/Report');
const moment = require('moment'); // Using moment for easier date comparison
const ExcelJS = require('exceljs');

// Helper for date validation
const isValidEntryDate = (date) => {
    const entryDate = moment(date).startOf('day');
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    return entryDate.isSame(today) || entryDate.isSame(yesterday);
};

exports.createReport = async (req, res) => {
    try {
        if (!isValidEntryDate(req.body.entryDate)) {
            return res.status(400).json({ success: false, message: 'Entry date must be today or yesterday.' });
        }

        const reportData = {
            ...req.body,
            submittedBy: req.user._id,
            submittedByUsername: req.user.username,
        };
        const report = await Report.create(reportData);
        res.status(201).json({ success: true, data: report });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllReports = async (req, res) => {
    try {
        let query = {};
        const { product, startDate, endDate } = req.query;

        if (product) query.productName = product;
        if (startDate || endDate) {
            query.entryDate = {};
            if (startDate) query.entryDate.$gte = new Date(startDate);
            if (endDate) query.entryDate.$lte = new Date(endDate);
        }

        const reports = await Report.find(query).sort({ entryDate: -1 });
        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const timeDiff = Date.now() - new Date(report.createdAt).getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        if (hoursDiff > 48) {
            return res.status(403).json({ success: false, message: 'Cannot modify a report after 48 hours' });
        }
        
        if (req.body.entryDate && !isValidEntryDate(req.body.entryDate)) {
             return res.status(400).json({ success: false, message: 'Entry date must be today or yesterday.' });
        }

        // Log history of changes
        const changes = {};
        if (req.body.productName && req.body.productName !== report.productName) changes.productName = { from: report.productName, to: req.body.productName };
        if (req.body.quantity && req.body.quantity != report.quantity) changes.quantity = { from: report.quantity, to: req.body.quantity };
        if (req.body.entryDate && new Date(req.body.entryDate).toISOString() !== report.entryDate.toISOString()) changes.entryDate = { from: report.entryDate, to: new Date(req.body.entryDate) };

        if (Object.keys(changes).length > 0) {
            report.history.push({
                modifiedBy: req.user.username,
                changes: changes,
            });
        }
        
        report.productName = req.body.productName || report.productName;
        report.quantity = req.body.quantity || report.quantity;
        report.entryDate = req.body.entryDate || report.entryDate;

        const updatedReport = await report.save();
        res.status(200).json({ success: true, data: updatedReport });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const timeDiff = Date.now() - new Date(report.createdAt).getTime();
        const hoursDiff = timeDiff / (1000 * 3600);
        if (hoursDiff > 48) {
            return res.status(403).json({ success: false, message: 'Cannot delete a report after 48 hours' });
        }

        await report.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getReportSummary = async (req, res) => {
    try {
        const quantityByProduct = await Report.aggregate([
            { $group: { _id: '$productName', totalQuantity: { $sum: '$quantity' } } },
            { $sort: { totalQuantity: -1 } }
        ]);
        res.status(200).json({ success: true, data: { quantityByProduct } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.exportReportsToExcel = async (req, res) => {
    try {
        // Reuse the same filtering logic as getAllReports
        let query = {};
        const { product, startDate, endDate } = req.query;

        if (product) query.productName = product;
        if (startDate || endDate) {
            query.entryDate = {};
            if (startDate) query.entryDate.$gte = new Date(startDate);
            if (endDate) query.entryDate.$lte = new Date(endDate);
        }

        const reports = await Report.find(query).sort({ entryDate: -1 });

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'ImportExportApp';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Reports');

        // Define columns
        worksheet.columns = [
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Entry Date', key: 'entryDate', width: 15 },
            { header: 'Submitted By', key: 'submittedByUsername', width: 20 },
            { header: 'Original Entry Timestamp', key: 'createdAt', width: 25 },
            { header: 'Modifications', key: 'modifications', width: 15 },
        ];
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern:'solid',
            fgColor:{argb:'FFDDDDDD'}
        };


        // Add data rows from the reports
        reports.forEach(report => {
            worksheet.addRow({
                productName: report.productName,
                quantity: report.quantity,
                entryDate: moment(report.entryDate).format('YYYY-MM-DD'),
                submittedByUsername: report.submittedByUsername,
                createdAt: moment(report.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                modifications: report.history.length
            });
        });
        
        // Set headers to trigger a file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="reports_${moment().format('YYYY_MM_DD')}.xlsx"`
        );

        // Write the workbook to the response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Excel Export Error:', error);
        res.status(500).json({ success: false, message: 'Failed to export data.' });
    }
};