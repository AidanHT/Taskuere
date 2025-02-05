const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    emailSettings: {
        isConfigured: {
            type: Boolean,
            default: false
        },
        smtpHost: {
            type: String,
            default: 'smtp.gmail.com'
        },
        smtpPort: {
            type: String,
            default: '587'
        },
        smtpPassword: {
            type: String,
            select: false  // Don't include in normal queries
        }
    },
    googleCalendarConnected: {
        type: Boolean,
        default: false
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('emailSettings.smtpPassword')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, salt);
        }
        if (this.isModified('emailSettings.smtpPassword')) {
            this.emailSettings.smtpPassword = await bcrypt.hash(this.emailSettings.smtpPassword, salt);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 