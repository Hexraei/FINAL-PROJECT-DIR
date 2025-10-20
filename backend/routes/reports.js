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

// --- General routes ---

router.route('/export')
    .get(protect, exportReportsToExcel);

router.route('/')
    .get(protect, getAllReports);

// The '/meta' route was removed as it's replaced by the /api/products endpoint

router.route('/summary')
    .get(protect, getReportSummary);

// --- Official-only routes ---
router.route('/')
    .post(protect, authorize('official'), createReport);

router.route('/:id')
    .put(protect, authorize('official'), updateReport)
    .delete(protect, authorize('official'), deleteReport);

module.exports = router;