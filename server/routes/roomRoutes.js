const express = require('express');
const router = express.Router();
const {
  getAvailableRooms,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');
const { protect, restrictTo } = require('../middleware/auth');

// Available rooms viewable by any authenticated user (student, warden, admin)
router.get('/available', protect, getAvailableRooms);

// Warden & Admin management routes
router.get('/', protect, restrictTo('warden', 'admin'), getAllRooms);
router.post('/', protect, restrictTo('warden', 'admin'), createRoom);
router.patch('/:id', protect, restrictTo('warden', 'admin'), updateRoom);

// Admin-only route: delete a room with 0 occupants
router.delete('/:id', protect, restrictTo('admin'), deleteRoom);

module.exports = router;
