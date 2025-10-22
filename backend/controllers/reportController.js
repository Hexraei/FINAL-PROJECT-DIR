const { Report, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const ExcelJS = require('exceljs');

// Helper to validate that the entry date is today or yesterday
const isValidEntryDate = (date) => {
    const entryDate = moment(date).startOf('day');
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');
    return entryDate.isSame(today) || entryDate.isSame(yesterday);
};

// Helper to build the WHERE clause for Sequelize queries based on request query params
const buildReportQuery = (queryParams) => {
    const { product, startDate, endDate } = queryParams;
    let where = {};
    if (product) where.productName = product;
    if (startDate || endDate) {
        where.entryDate = {};
        if (startDate) where.entryDate[Op.gte] = new Date(startDate);
        if (endDate) where.entryDate[Op.lte] = new Date(endDate);
    }
    return where;
};

exports.createReport = async (req, res) => {
    try {
        if (!isValidEntryDate(req.body.entryDate)) return res.status(400).json({ success: false, message: 'Entry date must be today or yesterday.' });
        const report = await Report.create({
            ...req.body,
            submittedById: req.user.id,
            submittedByUsername: req.user.username,
        });
        res.status(201).json({ success: true, data: report });
    } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

exports.getAllReports = async (req, res) => {
    try {
        const where = buildReportQuery(req.query);
        const reports = await Report.findAll({ where, order: [['entryDate', 'DESC'], ['createdAt', 'DESC']] });
        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
        if ((Date.now() - new Date(report.createdAt).getTime()) / 3600000 > 48) return res.status(403).json({ success: false, message: 'Cannot modify a report after 48 hours' });
        if (req.body.entryDate && !isValidEntryDate(req.body.entryDate)) return res.status(400).json({ success: false, message: 'Entry date must be today or yesterday.' });
        
        // --- START OF FIX ---
        // Create a new array from the existing history to avoid mutation issues.
        const newHistory = [...report.history];
        const changes = {};

        // Check each field for a change before adding it to the history log.
        if (req.body.productName && req.body.productName !== report.productName) {
            changes.productName = { from: report.productName, to: req.body.productName };
        }
        if (req.body.quantity && Number(req.body.quantity) !== report.quantity) {
            changes.quantity = { from: report.quantity, to: Number(req.body.quantity) };
        }
        // Correctly compare the DATEONLY string (YYYY-MM-DD)
        if (req.body.entryDate && req.body.entryDate !== report.entryDate) {
            changes.entryDate = { from: report.entryDate, to: req.body.entryDate };
        }
        
        // If the changes object has any keys, it means something was modified.
        if (Object.keys(changes).length > 0) {
            newHistory.push({
                modifiedBy: req.user.username,
                modifiedAt: new Date(),
                changes: changes
            });
        }
        
        // Update the report with the new data from the request body AND the new history array.
        const updatedReport = await report.update({
            productName: req.body.productName,
            quantity: req.body.quantity,
            entryDate: req.body.entryDate,
            history: newHistory
        });
        // --- END OF FIX ---

        res.status(200).json({ success: true, data: updatedReport });
    } catch (error) { 
        console.error("Update Error:", error);
        res.status(400).json({ success: false, message: error.message }); 
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
        if ((Date.now() - new Date(report.createdAt).getTime()) / 3600000 > 48) return res.status(403).json({ success: false, message: 'Cannot delete a report after 48 hours' });
        await report.destroy();
        res.status(200).json({ success: true, data: {} });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getReportSummary = async (req, res) => {
    try {
        const where = buildReportQuery(req.query);
        const quantityByProduct = await Report.findAll({
            where,
            attributes: ['productName', [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']],
            group: ['productName'],
            order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']]
        });
        const formattedResult = quantityByProduct.map(r => ({_id: r.productName, totalQuantity: r.dataValues.totalQuantity}));
        res.status(200).json({ success: true, data: { quantityByProduct: formattedResult } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.exportReportsToExcel = async (req, res) => {
    try {
        const where = buildReportQuery(req.query);
        const reports = await Report.findAll({ where, order: [['entryDate', 'DESC']] });
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'DataEntryApp';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Reports');
        worksheet.columns = [
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 15 },
            { header: 'Entry Date', key: 'entryDate', width: 15 },
            { header: 'Submitted By', key: 'submittedByUsername', width: 20 },
            { header: 'Original Entry Timestamp', key: 'createdAt', width: 25 },
            { header: 'Modifications', key: 'modifications', width: 15 },
        ];
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'FFDDDDDD'} };
        
        reports.forEach(report => {
            worksheet.addRow({
                productName: report.productName,
                quantity: report.quantity,
                entryDate: report.entryDate,
                submittedByUsername: report.submittedByUsername,
                createdAt: moment(report.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                modifications: report.history ? report.history.length : 0
            });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="reports_${moment().format('YYYY_MM_DD')}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) { 
        console.error('Excel Export Error:', error);
        res.status(500).json({ success: false, message: 'Failed to export data.' }); 
    }
};