const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { body, validationResult } = require('express-validator');

// Get current user profile
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/me', auth, [
    body('username').trim().isLength({ min: 3 }).optional(),
    body('email').isEmail().normalizeEmail().optional(),
    body('notifications.email').isBoolean().optional(),
    body('notifications.push').isBoolean().optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, notifications } = req.body;
        const updateData = {};

        if (username) {
            // Check if username is already taken
            const existingUser = await User.findOne({
                username,
                _id: { $ne: req.user._id }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            updateData.username = username;
        }

        if (email) {
            // Check if email is already taken
            const existingUser = await User.findOne({
                email,
                _id: { $ne: req.user._id }
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already taken' });
            }
            updateData.email = email;
        }

        if (notifications) {
            updateData.notifications = {
                ...req.user.notifications,
                ...notifications
            };
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/me/password', auth, [
    body('currentPassword').exists(),
    body('newPassword').isLength({ min: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete user account
router.delete('/me', auth, async (req, res) => {
    try {
        // Delete all appointments associated with the user
        await Appointment.deleteMany({
            $or: [
                { creator: req.user._id },
                { 'attendees.user': req.user._id }
            ]
        });

        // Delete the user
        await User.findByIdAndDelete(req.user._id);

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin routes
// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user role (admin only)
router.patch('/:id/role', auth, isAdmin, [
    body('role').isIn(['user', 'admin'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role: req.body.role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 