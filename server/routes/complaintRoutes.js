const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { protect, restrictTo } = require('../middleware/auth');

// Student complaints
router.post('/', protect, restrictTo('student'), createComplaint);
router.get('/my', protect, restrictTo('student'), getMyComplaints);

// Warden & Admin complaint management
router.get('/', protect, restrictTo('warden', 'admin'), getAllComplaints);
router.patch('/:id', protect, restrictTo('warden', 'admin'), updateComplaintStatus);

module.exports = router;
