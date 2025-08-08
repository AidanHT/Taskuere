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
    // Important: use nested { type: String } to avoid Mongoose treating the array as [String]
    meetingTypes: [{
        type: { type: String }, // 'meeting', 'appointment', 'reminder'
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

// Provide safe defaults for array fields to avoid undefined access
meetingPatternsSchema.path('commonMeetingTitles').default([]);
meetingPatternsSchema.path('preferredTimeSlots').default([]);
meetingPatternsSchema.path('commonAttendees').default([]);
meetingPatternsSchema.path('meetingTypes').default([]);
meetingPatternsSchema.path('locationPatterns').default([]);

// Indexes for performance
meetingPatternsSchema.index({ user: 1 });
meetingPatternsSchema.index({ lastAnalyzed: 1 });

const MeetingPatterns = mongoose.model('MeetingPatterns', meetingPatternsSchema);

module.exports = MeetingPatterns;
