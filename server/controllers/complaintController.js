const Complaint = require('../models/Complaint');

// @desc    Student registers a new complaint
// @route   POST /api/complaints
// @access  Private (Student)
const createComplaint = async (req, res, next) => {
  try {
    const { title, category, priority, description } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, category, and description',
      });
    }

    const complaint = await Complaint.create({
      title: title.trim(),
      category,
      priority: priority || 'medium',
      description: description.trim(),
      student: req.user._id,
      room: req.user.room || null,
      status: 'open',
    });

    await complaint.populate('room');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Student gets their raised complaints
// @route   GET /api/complaints/my
// @access  Private (Student)
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .populate('room')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Warden/Admin gets all complaints with filters
// @route   GET /api/complaints
// @access  Private (Warden, Admin)
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email phone avatar')
      .populate('room')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Warden/Admin updates complaint status and remarks
// @route   PATCH /api/complaints/:id
// @access  Private (Warden, Admin)
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, wardenRemarks } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found',
      });
    }

    if (status) {
      if (!['open', 'in-progress', 'resolved'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be open, in-progress, or resolved',
        });
      }
      complaint.status = status;
    }

    if (wardenRemarks !== undefined) {
      complaint.wardenRemarks = wardenRemarks.trim();
    }

    await complaint.save();

    await complaint.populate('student', 'name email phone avatar');
    await complaint.populate('room');

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
};
