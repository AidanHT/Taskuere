const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// Simple global search across user's appointments
router.get('/', auth, async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const regex = new RegExp(String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const query = {
      $and: [
        {
          $or: [
            { creator: req.user._id },
            { 'attendees.user': req.user._id },
          ],
        },
        {
          $or: [
            { title: regex },
            { description: regex },
            { location: regex },
          ],
        },
      ],
    };

    const appointments = await Appointment.find(query)
      .sort({ startTime: -1 })
      .limit(Number(limit))
      .select('title description startTime endTime type status');

    res.json({ success: true, data: { appointments } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
});

module.exports = router;

