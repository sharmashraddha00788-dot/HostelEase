const express = require('express');
const router = express.Router();
const {
  requestRoom,
  getMyAllocation,
  vacateMyRoom,
  getAllAllocations,
  approveRequest,
  rejectRequest,
  adminVacate,
} = require('../controllers/allocationController');
const { protect, restrictTo } = require('../middleware/auth');

// Student-specific allocation actions
router.post('/request', protect, restrictTo('student'), requestRoom);
router.get('/my', protect, restrictTo('student'), getMyAllocation);
router.post('/vacate', protect, restrictTo('student'), vacateMyRoom);

// Warden & Admin allocation management
router.get('/', protect, restrictTo('warden', 'admin'), getAllAllocations);
router.patch('/:id/approve', protect, restrictTo('warden', 'admin'), approveRequest);
router.patch('/:id/reject', protect, restrictTo('warden', 'admin'), rejectRequest);
router.post('/:id/admin-vacate', protect, restrictTo('warden', 'admin'), adminVacate);

module.exports = router;
