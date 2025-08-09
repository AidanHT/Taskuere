require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const http = require('http');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
// y-websocket util to attach Yjs collaborative doc syncing
// eslint-disable-next-line import/no-extraneous-dependencies
const { setupWSConnection } = require('y-websocket/bin/utils');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = 'localhost';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

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
        app.use('/api/collaboration', require('./routes/collaboration'));

        // Create HTTP server and attach Socket.IO and y-websocket providers
        const server = http.createServer(app);

        // Socket.IO setup with JWT auth and room-based collaboration
        const { Server } = require('socket.io');
        const io = new Server(server, {
            cors: {
                origin: CLIENT_ORIGIN,
                credentials: true,
            },
        });

        // In-memory participant registry per room to broadcast presence
        const roomIdToParticipants = new Map();

        const collabNamespace = io.of('/collab');
        // Middleware to authenticate socket connections using JWT
        collabNamespace.use((socket, next) => {
            try {
                const token = socket.handshake.auth?.token;
                if (!token) return next(new Error('Authentication required'));
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.user = { userId: decoded.userId };
                return next();
            } catch (err) {
                return next(new Error('Invalid authentication token'));
            }
        });

        collabNamespace.on('connection', (socket) => {
            const { userId } = socket.user;
            const Appointment = require('./models/Appointment');
            const CollaborationRoom = require('./models/CollaborationRoom');

            socket.on('room:join', async ({ appointmentId, displayName }) => {
                if (!appointmentId) return;
                const roomId = String(appointmentId);

                // Authorization: ensure user is attendee or creator of appointment
                try {
                    const appt = await Appointment.findById(appointmentId).select('creator attendees');
                    if (!appt) {
                        socket.emit('room:error', { message: 'Appointment not found' });
                        return;
                    }
                    const isCreator = String(appt.creator) === String(userId);
                    const isAttendee = (appt.attendees || []).some((a) => String(a.user) === String(userId));
                    if (!isCreator && !isAttendee) {
                        socket.emit('room:error', { message: 'Not authorized for this appointment' });
                        return;
                    }
                } catch (e) {
                    socket.emit('room:error', { message: 'Authorization failed' });
                    return;
                }

                // Limit participant count for scalability (default from room or env)
                let limit = Number(process.env.COLLAB_ROOM_LIMIT || 12);
                try {
                    const room = await CollaborationRoom.findOne({ appointment: appointmentId }).select('participantLimit');
                    if (room && room.participantLimit) limit = room.participantLimit;
                } catch (_) { /* noop */ }
                const participants = roomIdToParticipants.get(roomId) || new Map();
                if (!participants.has(socket.id) && participants.size >= limit) {
                    socket.emit('room:full');
                    return;
                }

                socket.join(roomId);
                participants.set(socket.id, {
                    socketId: socket.id,
                    userId,
                    displayName: displayName || 'Guest',
                });
                roomIdToParticipants.set(roomId, participants);
                collabNamespace.to(roomId).emit('participants:update', Array.from(participants.values()));
            });

            socket.on('room:leave', ({ appointmentId }) => {
                const roomId = String(appointmentId);
                socket.leave(roomId);
                const participants = roomIdToParticipants.get(roomId);
                if (participants) {
                    participants.delete(socket.id);
                    collabNamespace.to(roomId).emit('participants:update', Array.from(participants.values()));
                }
            });

            // Whiteboard drawing events (batched points)
            socket.on('whiteboard:draw', ({ appointmentId, strokes }) => {
                const roomId = String(appointmentId);
                socket.to(roomId).emit('whiteboard:draw', { strokes });
            });

            socket.on('whiteboard:clear', ({ appointmentId }) => {
                const roomId = String(appointmentId);
                collabNamespace.to(roomId).emit('whiteboard:clear');
            });

            // WebRTC signaling via simple-peer
            socket.on('webrtc:signal', ({ appointmentId, targetSocketId, signal }) => {
                collabNamespace.to(targetSocketId).emit('webrtc:signal', {
                    from: socket.id,
                    signal,
                    appointmentId,
                });
            });

            // In-room chat
            const CollaborationMessage = require('./models/CollaborationMessage');
            socket.on('chat:message', async ({ appointmentId, content, displayName }) => {
                try {
                    if (!content || !appointmentId) return;
                    const message = await CollaborationMessage.create({
                        appointment: appointmentId,
                        sender: userId,
                        senderDisplayName: displayName,
                        content,
                        type: 'text',
                    });
                    const payload = {
                        _id: String(message._id),
                        appointment: String(message.appointment),
                        sender: String(message.sender),
                        senderDisplayName: message.senderDisplayName,
                        content: message.content,
                        type: message.type,
                        createdAt: message.createdAt,
                    };
                    const roomId = String(appointmentId);
                    collabNamespace.to(roomId).emit('chat:message', payload);
                } catch (err) {
                    // swallow
                }
            });

            socket.on('disconnect', () => {
                // Clean up from all rooms
                roomIdToParticipants.forEach((participants, roomId) => {
                    if (participants.delete(socket.id)) {
                        collabNamespace.to(roomId).emit('participants:update', Array.from(participants.values()));
                    }
                });
            });
        });

        // y-websocket server mounted at /collab-sync for Yjs documents
        const wss = new WebSocketServer({ noServer: true });
        wss.on('connection', (ws, req) => {
            setupWSConnection(ws, req);
        });

        server.on('upgrade', (request, socket, head) => {
            const { url } = request;
            if (url && url.startsWith('/collab-sync')) {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });

        // Start the server
        server.listen(PORT, HOST, () => {
            console.log(`Server is running at http://${HOST}:${PORT}`);
            console.log(`Test endpoint available at http://${HOST}:${PORT}/api/test`);
            console.log(`Email test endpoint available at http://${HOST}:${PORT}/api/test-email`);
            console.log(`Yjs websocket endpoint at ws://${HOST}:${PORT}/collab-sync`);
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
