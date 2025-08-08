const mongoose = require('mongoose');

// Schema for AI assistant settings per user
const aiSettingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    enabled: {
        type: Boolean,
        default: true
    },
    preferredTimeSlots: [{
        dayOfWeek: {
            type: Number, // 0-6 (Sunday-Saturday)
            required: true
        },
        startHour: {
            type: Number, // 0-23
            required: true
        },
        endHour: {
            type: Number, // 0-23
            required: true
        }
    }],
    workingHours: {
        start: {
            type: String,
            default: '09:00'
        },
        end: {
            type: String,
            default: '17:00'
        }
    },
    timeZone: {
        type: String,
        default: 'America/New_York'
    },
    defaultMeetingDuration: {
        type: Number, // in minutes
        default: 60
    },
    bufferTime: {
        type: Number, // minutes between meetings
        default: 15
    },
    maxDailyMeetings: {
        type: Number,
        default: 8
    },
    preferences: {
        allowWeekends: {
            type: Boolean,
            default: false
        },
        allowEarlyMornings: {
            type: Boolean,
            default: false
        },
        allowLateEvenings: {
            type: Boolean,
            default: false
        },
        preferBackToBack: {
            type: Boolean,
            default: false
        }
    },
    nlpConfidenceThreshold: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 1
    }
}, {
    timestamps: true
});

// Indexes for performance
aiSettingsSchema.index({ user: 1 });

const AISettings = mongoose.model('AISettings', aiSettingsSchema);

module.exports = AISettings;
