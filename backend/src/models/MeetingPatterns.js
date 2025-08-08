const mongoose = require('mongoose');

// Schema for tracking user meeting patterns for AI learning
const meetingPatternsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    commonMeetingTitles: [{
        title: String,
        frequency: Number,
        avgDuration: Number // in minutes
    }],
    preferredTimeSlots: [{
        hour: Number, // 0-23
        dayOfWeek: Number, // 0-6
        frequency: Number
    }],
    commonAttendees: [{
        email: String,
        frequency: Number,
        lastMeeting: Date
    }],
    meetingTypes: [{
        type: String, // 'meeting', 'appointment', 'reminder'
        frequency: Number,
        avgDuration: Number
    }],
    locationPatterns: [{
        location: String,
        frequency: Number
    }],
    seasonalPatterns: [{
        month: Number, // 1-12
        meetingCount: Number,
        avgDuration: Number
    }],
    lastAnalyzed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
meetingPatternsSchema.index({ user: 1 });
meetingPatternsSchema.index({ lastAnalyzed: 1 });

const MeetingPatterns = mongoose.model('MeetingPatterns', meetingPatternsSchema);

module.exports = MeetingPatterns;
