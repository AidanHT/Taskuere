const mongoose = require('mongoose');

// Define the schema for an appointment
const appointmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // Title is required
        trim: true // Removes extra spaces from the beginning and end
    },
    description: {
        type: String,
        trim: true // Ensures clean text input
    },
    startTime: {
        type: Date,
        required: true // Start time is mandatory
    },
    endTime: {
        type: Date,
        required: true // End time is mandatory
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // References the 'User' model
        required: true // The appointment must have a creator
    },
    attendees: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' // References the 'User' model
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined'], // Tracks invitation status
            default: 'pending'
        },
        notificationSent: {
            type: Boolean, // Indicates if the user has been notified
            default: false
        }
    }],
    location: {
        type: String,
        trim: true // Ensures clean text input
    },
    type: {
        type: String,
        enum: ['meeting', 'appointment', 'reminder'], // Defines the type of appointment
        default: 'appointment'
    },
    status: {
        type: String,
        enum: ['scheduled', 'cancelled', 'completed'], // Tracks appointment status
        default: 'scheduled'
    },
    recurringPattern: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly'], // Defines recurrence pattern
        default: 'none'
    },
    googleCalendarEventId: {
        type: String // Stores an external Google Calendar event ID if linked
    }
}, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt` timestamps
});

// Indexes for faster query performance
appointmentSchema.index({ startTime: 1, endTime: 1 }); // Speeds up queries by start and end time
appointmentSchema.index({ creator: 1 }); // Optimizes queries related to a specific creator
appointmentSchema.index({ 'attendees.user': 1 }); // Optimizes attendee-related queries

// Create the Appointment model using the schema
const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; // Export the model for use in other parts of the application
