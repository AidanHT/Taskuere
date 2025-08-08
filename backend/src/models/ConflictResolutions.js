const mongoose = require('mongoose');

// Nested schema for parsed intent
const parsedIntentSchema = new mongoose.Schema({
    title: String,
    datetime: Date,
    duration: Number,
    attendees: [String],
    location: String,
    type: String
}, { _id: false });

// Schema for storing conflict resolutions and AI decisions
const conflictResolutionsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    originalRequest: {
        rawText: String,
        parsedIntent: parsedIntentSchema,
        confidence: Number
    },
    conflicts: [{
        conflictType: {
            type: String,
            enum: ['time_overlap', 'too_many_meetings', 'outside_working_hours', 'weekend_conflict', 'buffer_violation']
        },
        conflictingAppointment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment'
        },
        severity: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical']
        },
        description: String
    }],
    suggestedResolutions: [{
        type: {
            type: String,
            enum: ['reschedule', 'shorten', 'move_other', 'decline', 'accept_anyway']
        },
        newTimeSlot: {
            startTime: Date,
            endTime: Date
        },
        reason: String,
        confidence: Number,
        pros: [String],
        cons: [String]
    }],
    chosenResolution: {
        type: Number, // index of chosen resolution
        default: null
    },
    aiReasoning: String,
    status: {
        type: String,
        enum: ['pending', 'resolved', 'rejected', 'manual_override'],
        default: 'pending'
    },
    resolvedAt: Date
}, {
    timestamps: true
});

// Indexes for performance
conflictResolutionsSchema.index({ user: 1 });
conflictResolutionsSchema.index({ status: 1 });
conflictResolutionsSchema.index({ createdAt: -1 });

const ConflictResolutions = mongoose.model('ConflictResolutions', conflictResolutionsSchema);

module.exports = ConflictResolutions;
