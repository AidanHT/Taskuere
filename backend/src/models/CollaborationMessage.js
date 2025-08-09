const mongoose = require('mongoose');

const collaborationMessageSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderDisplayName: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  { timestamps: true }
);

collaborationMessageSchema.index({ appointment: 1, createdAt: -1 });

const CollaborationMessage = mongoose.model('CollaborationMessage', collaborationMessageSchema);
module.exports = CollaborationMessage;

