const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const User = require('../models/User');

// @desc    Student sends a room allocation request
// @route   POST /api/allocations/request
// @access  Private (Student)
const requestRoom = async (req, res, next) => {
  try {
    const { roomId } = req.body;
    const studentId = req.user._id;

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid roomId',
      });
    }

    // Rule 1: A student can have only ONE active request or room at a time
    if (req.user.room) {
      return res.status(400).json({
        success: false,
        message: 'You already have an allocated room. Please vacate your current room before requesting another.',
      });
    }

    const activeAllocation = await Allocation.findOne({
      student: studentId,
      status: { $in: ['requested', 'approved'] },
    });

    if (activeAllocation) {
      return res.status(400).json({
        success: false,
        message:
          activeAllocation.status === 'requested'
            ? 'You already have a pending room request awaiting warden approval.'
            : 'You already have an approved room allocation.',
      });
    }

    // Rule 2: Target room must be available and have free beds
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    if (room.status === 'maintenance') {
      return res.status(400).json({
        success: false,
        message: 'This room is currently under maintenance and cannot be requested.',
      });
    }

    if (room.occupied >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: 'This room is fully occupied. Please select another room with free beds.',
      });
    }

    // Create the allocation request
    const allocation = await Allocation.create({
      student: studentId,
      room: roomId,
      status: 'requested',
      requestDate: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Room allocation request submitted successfully. Awaiting warden approval.',
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student gets their current room and request status
// @route   GET /api/allocations/my
// @access  Private (Student)
const getMyAllocation = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // First check if there is an active request or approved allocation
    let allocation = await Allocation.findOne({
      student: studentId,
      status: { $in: ['requested', 'approved'] },
    })
      .populate('room')
      .sort({ createdAt: -1 });

    // If not active, fetch the most recent allocation history (e.g. rejected or vacated)
    if (!allocation) {
      allocation = await Allocation.findOne({ student: studentId })
        .populate('room')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student vacates their current allocated room
// @route   POST /api/allocations/vacate
// @access  Private (Student)
const vacateMyRoom = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Find the approved allocation
    const allocation = await Allocation.findOne({
      student: studentId,
      status: 'approved',
    });

    if (!allocation) {
      return res.status(400).json({
        success: false,
        message: 'No active approved room allocation found to vacate.',
      });
    }

    const roomId = allocation.room;

    // Atomically decrement occupied bed count
    await Room.findOneAndUpdate(
      { _id: roomId, occupied: { $gt: 0 } },
      { $inc: { occupied: -1 } }
    );

    // Update allocation record
    allocation.status = 'vacated';
    allocation.vacatedDate = new Date();
    await allocation.save();

    // Remove room reference from student
    await User.findByIdAndUpdate(studentId, { room: null });

    res.status(200).json({
      success: true,
      message: 'Room vacated successfully.',
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all room requests & allotments (Warden, Admin)
// @route   GET /api/allocations
// @access  Private (Warden, Admin)
const getAllAllocations = async (req, res, next) => {
  try {
    const { status, block } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const allocations = await Allocation.find(filter)
      .populate('student', 'name email phone avatar role')
      .populate('room')
      .sort({ createdAt: -1 });

    // Optional block filtering on populated room
    let result = allocations;
    if (block && block !== 'all') {
      result = allocations.filter(
        (a) => a.room && a.room.block.toUpperCase() === block.toUpperCase()
      );
    }

    res.status(200).json({
      success: true,
      count: result.length,
      allocations: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Warden approves a room request with atomic capacity check
// @route   PATCH /api/allocations/:id/approve
// @access  Private (Warden, Admin)
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wardenNotes } = req.body;

    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation request not found',
      });
    }

    if (allocation.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with current status: ${allocation.status}`,
      });
    }

    // MANDATORY REQUIREMENT:
    // "check capacity and take the bed in ONE atomic MongoDB operation so two approvals cannot overfill a room"
    const updatedRoom = await Room.findOneAndUpdate(
      {
        _id: allocation.room,
        status: 'available',
        $expr: { $lt: ['$occupied', '$capacity'] },
      },
      { $inc: { occupied: 1 } },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(400).json({
        success: false,
        message: 'Approval failed: Room is either fully occupied or under maintenance.',
      });
    }

    // Update allocation document
    allocation.status = 'approved';
    allocation.allottedDate = new Date();
    if (wardenNotes) allocation.wardenNotes = wardenNotes;
    await allocation.save();

    // Link room to student
    await User.findByIdAndUpdate(allocation.student, { room: updatedRoom._id });

    // Populate for response
    await allocation.populate('student', 'name email phone avatar');
    await allocation.populate('room');

    res.status(200).json({
      success: true,
      message: `Request approved. Student assigned to Room ${updatedRoom.block}-${updatedRoom.roomNumber}`,
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Warden rejects a room request with note
// @route   PATCH /api/allocations/:id/reject
// @access  Private (Warden, Admin)
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason, wardenNotes } = req.body;

    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation request not found',
      });
    }

    if (allocation.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with current status: ${allocation.status}`,
      });
    }

    allocation.status = 'rejected';
    allocation.rejectionReason = rejectionReason || 'Request rejected by warden';
    if (wardenNotes) allocation.wardenNotes = wardenNotes;
    await allocation.save();

    await allocation.populate('student', 'name email phone avatar');
    await allocation.populate('room');

    res.status(200).json({
      success: true,
      message: 'Room request rejected.',
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Warden/Admin forces vacating a student
// @route   POST /api/allocations/:id/admin-vacate
// @access  Private (Warden, Admin)
const adminVacate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocation = await Allocation.findById(id);

    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation record not found',
      });
    }

    if (allocation.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved allocations can be vacated',
      });
    }

    // Atomically decrement room occupancy
    await Room.findOneAndUpdate(
      { _id: allocation.room, occupied: { $gt: 0 } },
      { $inc: { occupied: -1 } }
    );

    allocation.status = 'vacated';
    allocation.vacatedDate = new Date();
    await allocation.save();

    await User.findByIdAndUpdate(allocation.student, { room: null });

    res.status(200).json({
      success: true,
      message: 'Student room vacated successfully by warden/admin.',
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestRoom,
  getMyAllocation,
  vacateMyRoom,
  getAllAllocations,
  approveRequest,
  rejectRequest,
  adminVacate,
};
