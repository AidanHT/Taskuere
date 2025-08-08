const mongoose = require('mongoose');

const collaborationRoomSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
      unique: true,
    },
    title: {
      type: String,
      trim: true,
    },
    ydocName: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participantLimit: {
      type: Number,
      default: 12,
      min: 2,
      max: 32,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  { timestamps: true }
);

const CollaborationRoom = mongoose.model('CollaborationRoom', collaborationRoomSchema);
module.exports = CollaborationRoom;

