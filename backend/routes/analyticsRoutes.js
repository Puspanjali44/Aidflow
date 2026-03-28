// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/stats', protect, analyticsController.getStats);
router.get('/donation-trends', protect, analyticsController.getDonationTrends);
router.get('/donor-growth', protect, analyticsController.getDonorGrowth);
router.get('/project-performance', protect, analyticsController.getProjectPerformance);

module.exports = router;