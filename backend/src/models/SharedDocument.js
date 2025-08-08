const mongoose = require('mongoose');

const sharedDocumentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    ydocName: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['tiptap', 'quill', 'plaintext'],
      default: 'tiptap',
    },
    // Optional server-side snapshotting
    snapshot: {
      type: Buffer,
    },
  },
  { timestamps: true }
);

const SharedDocument = mongoose.model('SharedDocument', sharedDocumentSchema);
module.exports = SharedDocument;

