const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Please provide room number (e.g. 101, 202)'],
      trim: true,
    },
    block: {
      type: String,
      required: [true, 'Please specify block name (e.g. A, B)'],
      trim: true,
      uppercase: true,
    },
    floor: {
      type: Number,
      required: [true, 'Please provide floor number'],
      min: [0, 'Floor cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify total bed capacity'],
      min: [1, 'Capacity must be at least 1'],
    },
    occupied: {
      type: Number,
      default: 0,
      min: [0, 'Occupied beds cannot be negative'],
      validate: {
        validator: function (value) {
          // Rule from sheet: occupied beds can never exceed room capacity
          return value <= this.capacity;
        },
        message: 'Occupied beds ({VALUE}) cannot exceed room capacity',
      },
    },
    status: {
      type: String,
      enum: ['available', 'maintenance'],
      default: 'available',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for free beds remaining
roomSchema.virtual('freeBeds').get(function () {
  return Math.max(0, this.capacity - this.occupied);
});

// Compound unique index so no two rooms in the same block have identical room numbers
roomSchema.index({ block: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
