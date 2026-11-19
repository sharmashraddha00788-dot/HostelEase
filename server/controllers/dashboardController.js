const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Allocation = require('../models/Allocation');
const User = require('../models/User');

// @desc    Get dashboard metrics, aggregations, and room map
// @route   GET /api/dashboard/stats
// @access  Private (Warden, Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. MANDATORY AGGREGATION PIPELINE: Block-wise Occupancy Statistics
    const occupancyByBlock = await Room.aggregate([
      {
        $group: {
          _id: '$block',
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          totalOccupied: { $sum: '$occupied' },
          maintenanceRooms: {
            $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] },
          },
          vacantRooms: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'available'] },
                    { $lt: ['$occupied', '$capacity'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          block: '$_id',
          totalRooms: 1,
          totalCapacity: 1,
          totalOccupied: 1,
          maintenanceRooms: 1,
          vacantRooms: 1,
          freeBeds: { $subtract: ['$totalCapacity', '$totalOccupied'] },
          occupancyPercentage: {
            $cond: [
              { $gt: ['$totalCapacity', 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ['$totalOccupied', '$totalCapacity'] },
                      100,
                    ],
                  },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { block: 1 } },
    ]);

    // 2. MANDATORY AGGREGATION PIPELINE: Complaints by Status
    const complaintsByStatus = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { status: 1 } },
    ]);

    // 3. MANDATORY AGGREGATION PIPELINE: Complaints by Category
    const complaintsByCategory = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    // 4. Quick KPI Counts
    const [openComplaints, pendingRequests, totalStudents, totalRoomsList] =
      await Promise.all([
        Complaint.countDocuments({ status: 'open' }),
        Allocation.countDocuments({ status: 'requested' }),
        User.countDocuments({ role: 'student' }),
        Room.find().sort({ block: 1, floor: 1, roomNumber: 1 }),
      ]);

    // Calculate overall stats
    let totalCapacity = 0;
    let totalOccupied = 0;
    let vacantRoomsCount = 0;

    // Room Map with colour-code state:
    // 'maintenance' -> Orange/Gray
    // 'full' -> Red
    // 'partial' -> Yellow/Indigo (has students)
    // 'empty' -> Green
    const roomMap = totalRoomsList.map((room) => {
      totalCapacity += room.capacity;
      totalOccupied += room.occupied;

      let state = 'empty';
      if (room.status === 'maintenance') {
        state = 'maintenance';
      } else if (room.occupied >= room.capacity) {
        state = 'full';
      } else if (room.occupied > 0) {
        state = 'has_students';
        vacantRoomsCount += 1;
      } else {
        state = 'empty';
        vacantRoomsCount += 1;
      }

      return {
        _id: room._id,
        block: room.block,
        floor: room.floor,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        occupied: room.occupied,
        freeBeds: Math.max(0, room.capacity - room.occupied),
        status: room.status,
        state, // colour-coding state
      };
    });

    const overallOccupancyRate =
      totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          openComplaints,
          vacantRooms: vacantRoomsCount,
          pendingRequests,
          totalStudents,
          totalCapacity,
          totalOccupied,
          occupancyPercentage: Number(overallOccupancyRate),
        },
        occupancyByBlock,
        complaintsByStatus,
        complaintsByCategory,
        roomMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
