const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room ID is required'],
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'vacated'],
      default: 'requested',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    allottedDate: {
      type: Date,
      default: null,
    },
    vacatedDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    wardenNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// MANDATORY REQUIREMENT: A student can only have ONE active request or room at a time.
// We enforce this at the database level with a unique partial index on status in ('requested', 'approved').
allocationSchema.index(
  { student: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['requested', 'approved'] },
    },
  }
);

// Helpful index to quickly query allocations by room and status
allocationSchema.index({ room: 1, status: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);
