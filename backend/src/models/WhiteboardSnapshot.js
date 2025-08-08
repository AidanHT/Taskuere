const mongoose = require('mongoose');

const whiteboardSnapshotSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    strokes: {
      type: Array,
      default: [],
    },
    // Optional image data for previews
    thumbnailPngBase64: {
      type: String,
    },
  },
  { timestamps: true }
);

const WhiteboardSnapshot = mongoose.model('WhiteboardSnapshot', whiteboardSnapshotSchema);
module.exports = WhiteboardSnapshot;

