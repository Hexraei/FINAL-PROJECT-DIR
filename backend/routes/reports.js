const express = require('express');
const router = express.Router();
const {
    createReport,
    getAllReports,
    updateReport,
    deleteReport,
    getReportSummary,
    exportReportsToExcel
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/export')
    .get(protect, exportReportsToExcel);

router.route('/')
    .get(protect, getAllReports)
    .post(protect, authorize('official'), createReport);

router.route('/summary')
    .get(protect, getReportSummary);

router.route('/:id')
    .put(protect, authorize('official'), updateReport)
    .delete(protect, authorize('official'), deleteReport);

module.exports = router;