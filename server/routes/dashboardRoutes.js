const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/auth');

// Warden and Admin dashboard stats and aggregations
router.get('/stats', protect, restrictTo('warden', 'admin'), getDashboardStats);

module.exports = router;
