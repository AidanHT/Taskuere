const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');

// GET /api/stats/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const accessibleQuery = {
      $or: [{ creator: userId }, { 'attendees.user': userId }],
    };

    // Totals
    const [total, upcoming, completed, pending] = await Promise.all([
      Appointment.countDocuments(accessibleQuery),
      Appointment.countDocuments({
        ...accessibleQuery,
        status: 'scheduled',
        startTime: { $gt: now },
      }),
      Appointment.countDocuments({ ...accessibleQuery, status: 'completed' }),
      Appointment.countDocuments({ ...accessibleQuery, status: 'scheduled' }),
    ]);

    // Team members: unique participants across all accessible appointments (include creators and attendees; exclude self)
    const appts = await Appointment.find(accessibleQuery).select('creator attendees.user');
    const participantSet = new Set();
    appts.forEach((a) => {
      if (String(a.creator) !== String(userId)) participantSet.add(String(a.creator));
      (a.attendees || []).forEach((t) => {
        if (String(t.user) !== String(userId)) participantSet.add(String(t.user));
      });
    });
    const teamMembers = participantSet.size;

    // Weekly activity for current week
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = (day + 6) % 7; // 0 => Monday
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyAppts = await Appointment.find({
      ...accessibleQuery,
      startTime: { $lte: endOfWeek },
      endTime: { $gte: startOfWeek },
    }).select('startTime status');

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyActivity = weekDays.map((label, i) => ({ day: label, meetings: 0, completion: 0 }));
    const dayStats = weekDays.map(() => ({ total: 0, completed: 0 }));

    weeklyAppts.forEach((a) => {
      const d = new Date(a.startTime);
      const idx = (d.getDay() + 6) % 7; // Monday = 0
      dayStats[idx].total += 1;
      if (a.status === 'completed') dayStats[idx].completed += 1;
    });
    dayStats.forEach((s, idx) => {
      weeklyActivity[idx].meetings = s.total;
      weeklyActivity[idx].completion = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
    });

    // Trends (last 7 days vs previous 7 days)
    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 7);
    last7Start.setHours(0, 0, 0, 0);
    const last7End = new Date(now);
    const prev7Start = new Date(last7Start);
    prev7Start.setDate(prev7Start.getDate() - 7);
    const prev7End = new Date(last7Start);

    const [lastTotal, prevTotal, lastUpcoming, prevUpcoming, lastCompleted, prevCompleted] = await Promise.all([
      Appointment.countDocuments({ ...accessibleQuery, startTime: { $gte: last7Start, $lte: last7End } }),
      Appointment.countDocuments({ ...accessibleQuery, startTime: { $gte: prev7Start, $lte: prev7End } }),
      Appointment.countDocuments({ ...accessibleQuery, status: 'scheduled', startTime: { $gte: last7Start, $lte: last7End } }),
      Appointment.countDocuments({ ...accessibleQuery, status: 'scheduled', startTime: { $gte: prev7Start, $lte: prev7End } }),
      Appointment.countDocuments({ ...accessibleQuery, status: 'completed', startTime: { $gte: last7Start, $lte: last7End } }),
      Appointment.countDocuments({ ...accessibleQuery, status: 'completed', startTime: { $gte: prev7Start, $lte: prev7End } }),
    ]);

    const pct = (a, b) => {
      if (b === 0) return a > 0 ? 100 : 0;
      return Math.round(((a - b) / Math.max(1, b)) * 100);
    };

    const trends = {
      total: pct(lastTotal, prevTotal),
      upcoming: pct(lastUpcoming, prevUpcoming),
      completed: pct(lastCompleted, prevCompleted),
      teamMembers: 0, // optional: compute over windows; return 0 for now
    };

    res.json({
      success: true,
      data: {
        totals: { total, upcoming, completed, pending },
        teamMembers,
        weeklyActivity,
        trends,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to compute dashboard stats' });
  }
});

module.exports = router;

