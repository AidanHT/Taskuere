const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateAppointment = [
    body('title').trim().notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('type').isIn(['meeting', 'appointment', 'reminder']).optional(),
    body('location').trim().optional(),
    body('description').trim().optional(),
    body('attendees').isArray().optional(),
    body('recurringPattern').isIn(['none', 'daily', 'weekly', 'monthly']).optional()
];

// Create appointment
router.post('/', auth, validateAppointment, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const appointment = new Appointment({
            ...req.body,
            creator: req.user._id,
            attendees: req.body.attendees?.map(userId => ({
                user: userId,
                status: 'pending'
            })) || []
        });

        await appointment.save();

        // Populate creator and attendees information
        await appointment.populate('creator', 'username email');
        await appointment.populate('attendees.user', 'username email');

        res.status(201).json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all appointments for a user
router.get('/', auth, async (req, res) => {
    try {
        const { start, end } = req.query;
        const query = {
            $or: [
                { creator: req.user._id },
                { 'attendees.user': req.user._id }
            ]
        };

        // Add date range filter if provided
        if (start && end) {
            query.startTime = { $gte: new Date(start) };
            query.endTime = { $lte: new Date(end) };
        }

        const appointments = await Appointment.find(query)
            .populate('creator', 'username email')
            .populate('attendees.user', 'username email')
            .sort({ startTime: 1 });

        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get specific appointment
router.get('/:id', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('creator', 'username email')
            .populate('attendees.user', 'username email');

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check if user has access to this appointment
        const hasAccess = appointment.creator.equals(req.user._id) ||
            appointment.attendees.some(a => a.user.equals(req.user._id));

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update appointment status
router.patch('/:id/status', auth, [
    body('status').isIn(['scheduled', 'cancelled', 'completed']).withMessage('Invalid status')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check if user has access to update this appointment
        const hasAccess = appointment.creator.equals(req.user._id) ||
            appointment.attendees.some(a => a.user.equals(req.user._id));

        if (!hasAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }

        appointment.status = req.body.status;
        await appointment.save();

        // Populate creator and attendees information
        await appointment.populate('creator', 'username email');
        await appointment.populate('attendees.user', 'username email');

        res.json(appointment);
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update appointment
router.put('/:id', auth, validateAppointment, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (!appointment.creator.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        )
            .populate('creator', 'username email')
            .populate('attendees.user', 'username email');

        res.json(updatedAppointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (!appointment.creator.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await appointment.deleteOne();
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update appointment response (accept/decline)
router.patch('/:id/response', auth, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const attendee = appointment.attendees.find(
            a => a.user.equals(req.user._id)
        );

        if (!attendee) {
            return res.status(403).json({ message: 'Not an attendee' });
        }

        attendee.status = status;
        await appointment.save();

        await appointment.populate('creator', 'username email');
        await appointment.populate('attendees.user', 'username email');

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 