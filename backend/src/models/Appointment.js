const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'],
            default: 'pending'
        },
        notificationSent: {
            type: Boolean,
            default: false
        }
    }],
    location: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['meeting', 'appointment', 'reminder'],
        default: 'appointment'
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'],
        default: 'scheduled'
    },
    recurringPattern: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'],
        default: 'none'
    },
    googleCalendarEventId: {
        type: String
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
appointmentSchema.index({ startTime: 1, endTime: 1 });
appointmentSchema.index({ creator: 1 });
appointmentSchema.index({ 'attendees.user': 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 