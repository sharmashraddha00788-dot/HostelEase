const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a complaint title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a complaint category'],
      enum: {
        values: ['plumbing', 'electrical', 'cleaning', 'internet', 'furniture', 'other'],
        message: '{VALUE} is not a valid category',
      },
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority',
      },
      default: 'medium',
    },
    description: {
      type: String,
      required: [true, 'Please describe your complaint in detail'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'in-progress', 'resolved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'open',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    wardenRemarks: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Remarks cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// MANDATORY REQUIREMENT: Compound index on complaint status + priority
complaintSchema.index({ status: 1, priority: 1 });

// Student index for fast query of individual complaint history
complaintSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
