require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';

// Enable CORS for cross-origin requests
app.use(cors());

// Security middleware to protect against vulnerabilities
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting to prevent abuse (100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Function to create email transporter dynamically based on user settings
const createTransporter = async (userId) => {
    try {
        // Retrieve user email settings from the database
        const user = await User.findById(userId).select('+emailSettings.smtpPassword');
        if (!user || !user.emailSettings.isConfigured) {
            throw new Error('Email settings not configured');
        }

        return nodemailer.createTransport({
            host: user.emailSettings.smtpHost,
            port: user.emailSettings.smtpPort,
            secure: false, // Not using SSL
            auth: {
                user: user.email,
                pass: user.emailSettings.smtpPassword
            },
            debug: true,
            logger: true
        });
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw error;
    }
};

// Endpoint to send a test email
app.post('/api/test-email', async (req, res) => {
    console.log('Received email test request:', req.body);
    try {
        const { userId, email } = req.body;
        if (!userId) {
            throw new Error('User ID is required');
        }

        const transporter = await createTransporter(userId);
        console.log('Email transporter created successfully');

        // Verify SMTP connection before sending
        console.log('Verifying SMTP connection...');
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        // Email options
        const testMailOptions = {
            from: email,
            to: email,
            subject: 'Test Email from Taskuere',
            text: 'This is a test email from your scheduling application.',
            html: `
                <h2>Test Email</h2>
                <p>This is a test email from your scheduling application.</p>
                <p>If you received this, the email functionality is working correctly!</p>
                <p>Time sent: ${new Date().toLocaleString()}</p>
            `
        };

        console.log('Sending test email to:', testMailOptions.to);
        const info = await transporter.sendMail(testMailOptions);
        console.log('Test email sent successfully:', info);

        res.json({
            message: 'Test email sent successfully',
            messageId: info.messageId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({
            message: 'Failed to send test email',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Simple test endpoint to check if the backend is running
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit at:', new Date().toISOString());
    res.json({
        message: 'Backend is working!',
        timestamp: new Date().toISOString()
    });
});

console.log('Starting server initialization...');
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Function to start the server with database connection handling
const startServer = async () => {
    try {
        // Connect to MongoDB using Mongoose
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB');

        // Load API routes
        app.use('/api/auth', require('./routes/auth'));
        app.use('/api/appointments', require('./routes/appointments'));
        app.use('/api/users', require('./routes/users'));
        app.use('/api/ai', require('./routes/ai'));

        // Start the server
        const server = app.listen(PORT, HOST, () => {
            console.log(`Server is running at http://${HOST}:${PORT}`);
            console.log(`Test endpoint available at http://${HOST}:${PORT}/api/test`);
            console.log(`Email test endpoint available at http://${HOST}:${PORT}/api/test-email`);
        });

        // Handle unexpected server errors
        server.on('error', (error) => {
            console.error('Server error:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Startup error:', error);
        process.exit(1);
    }
};

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error occurred:', err);
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message,
        timestamp: new Date().toISOString()
    });
});

// Start the server
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
