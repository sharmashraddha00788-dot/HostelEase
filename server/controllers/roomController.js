const Room = require('../models/Room');

// @desc    Get available rooms (not in maintenance and has free beds)
// @route   GET /api/rooms/available
// @access  Private (All authenticated roles)
const getAvailableRooms = async (req, res, next) => {
  try {
    const { block } = req.query;

    const query = {
      status: 'available',
      $expr: { $lt: ['$occupied', '$capacity'] }, // Occupied must be strictly less than capacity
    };

    if (block && block !== 'all') {
      query.block = block.toUpperCase();
    }

    const rooms = await Room.find(query).sort({ block: 1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms (for Warden / Admin management)
// @route   GET /api/rooms
// @access  Private (Warden, Admin)
const getAllRooms = async (req, res, next) => {
  try {
    const { block, status, floor } = req.query;
    const query = {};

    if (block && block !== 'all') {
      query.block = block.toUpperCase();
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (floor) {
      query.floor = Number(floor);
    }

    const rooms = await Room.find(query).sort({ block: 1, roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new hostel room
// @route   POST /api/rooms
// @access  Private (Warden, Admin)
const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, block, floor, capacity, status } = req.body;

    if (!roomNumber || !block || floor === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomNumber, block, floor, and capacity',
      });
    }

    // Check if room with same number in block already exists
    const existing = await Room.findOne({
      block: block.toUpperCase().trim(),
      roomNumber: roomNumber.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomNumber} already exists in Block ${block.toUpperCase()}`,
      });
    }

    const room = await Room.create({
      roomNumber: roomNumber.trim(),
      block: block.toUpperCase().trim(),
      floor: Number(floor),
      capacity: Number(capacity),
      occupied: 0,
      status: status || 'available',
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room details or maintenance status
// @route   PATCH /api/rooms/:id
// @access  Private (Warden, Admin)
const updateRoom = async (req, res, next) => {
  try {
    const { status, capacity } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // If changing capacity, ensure it is not less than currently occupied
    if (capacity !== undefined) {
      if (Number(capacity) < room.occupied) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease capacity to ${capacity} because ${room.occupied} students are currently occupying this room`,
        });
      }
      room.capacity = Number(capacity);
    }

    if (status) {
      if (!['available', 'maintenance'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either "available" or "maintenance"',
        });
      }
      room.status = status;
    }

    await room.save();

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      room,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a room (Admin only - must have 0 students)
// @route   DELETE /api/rooms/:id
// @access  Private (Admin Only)
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Sheet requirement: Delete only if no students are in it
    if (room.occupied > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room: ${room.occupied} student(s) currently allocated to this room. Please vacate them first.`,
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Room ${room.block}-${room.roomNumber} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableRooms,
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
};
