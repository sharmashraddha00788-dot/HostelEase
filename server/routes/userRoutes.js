const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

// All user management routes are restricted to Admin only
router.get('/', protect, restrictTo('admin'), getAllUsers);
router.patch('/:id/role', protect, restrictTo('admin'), updateUserRole);

module.exports = router;
