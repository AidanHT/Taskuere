const express = require('express');
const { auth } = require('../middleware/auth');
const CollaborationRoom = require('../models/CollaborationRoom');
const SharedDocument = require('../models/SharedDocument');
const WhiteboardSnapshot = require('../models/WhiteboardSnapshot');
const CollaborationMessage = require('../models/CollaborationMessage');

const router = express.Router();

// Create or get a collaboration room for an appointment
router.post('/rooms', auth, async (req, res) => {
  try {
    const { appointmentId, title } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ message: 'appointmentId is required' });
    }
    let room = await CollaborationRoom.findOne({ appointment: appointmentId });
    if (!room) {
      room = await CollaborationRoom.create({
        appointment: appointmentId,
        title: title || 'Collaboration Room',
        createdBy: req.user._id,
        ydocName: `doc-${appointmentId}`,
      });
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create/get room', error: err.message });
  }
});

router.get('/rooms/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const room = await CollaborationRoom.findOne({ appointment: appointmentId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve room', error: err.message });
  }
});

// Whiteboard snapshots
router.post('/whiteboard', auth, async (req, res) => {
  try {
    const { appointmentId, strokes, thumbnailPngBase64 } = req.body;
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });
    const snapshot = await WhiteboardSnapshot.create({ appointment: appointmentId, strokes, thumbnailPngBase64 });
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save snapshot', error: err.message });
  }
});

router.get('/whiteboard/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const snapshots = await WhiteboardSnapshot.find({ appointment: appointmentId }).sort({ createdAt: -1 }).limit(10);
    res.json(snapshots);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get snapshots', error: err.message });
  }
});

// Shared document metadata (optional – Yjs content is synced via websocket)
router.post('/documents', auth, async (req, res) => {
  try {
    const { appointmentId, type } = req.body;
    if (!appointmentId) return res.status(400).json({ message: 'appointmentId is required' });
    let doc = await SharedDocument.findOne({ appointment: appointmentId });
    if (!doc) {
      doc = await SharedDocument.create({ appointment: appointmentId, ydocName: `doc-${appointmentId}`, type: type || 'tiptap' });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create/get document', error: err.message });
  }
});

router.get('/documents/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doc = await SharedDocument.findOne({ appointment: appointmentId });
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get document', error: err.message });
  }
});

// Chat history
router.get('/chat/:appointmentId', auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const messages = await CollaborationMessage.find({ appointment: appointmentId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Failed to get chat history', error: err.message });
  }
});

module.exports = router;

