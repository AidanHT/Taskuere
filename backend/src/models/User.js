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
        enum: ['user', 'admin'],  // Restricts role to either "user" or "admin"
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
            select: false  // Ensures this field is not included in normal queries for security
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
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

// Middleware: Hashes the password before saving the user document
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('emailSettings.smtpPassword')) return next();

    try {
        const salt = await bcrypt.genSalt(10);

        // Hash the password if modified
        if (this.isModified('password')) {
            this.password = await bcrypt.hash(this.password, salt);
        }

        // Hash the email SMTP password if modified
        if (this.isModified('emailSettings.smtpPassword')) {
            this.emailSettings.smtpPassword = await bcrypt.hash(this.emailSettings.smtpPassword, salt);
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Method: Compares the entered password with the stored hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
