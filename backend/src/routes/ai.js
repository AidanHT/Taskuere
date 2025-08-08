const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const groqAIService = require('../services/groqAIService');
const AISettings = require('../models/AISettings');
const ConflictResolutions = require('../models/ConflictResolutions');
const Appointment = require('../models/Appointment');
const winston = require('winston');

// Logger for AI operations
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'ai-operations.log' })
    ]
});

// Input validation middleware for natural language parsing
const validateNLPInput = [
    body('text')
        .trim()
        .isLength({ min: 3, max: 1000 })
        .withMessage('Text must be between 3 and 1000 characters'),
    body('context')
        .optional()
        .isObject()
        .withMessage('Context must be an object'),
];

// Input validation for time suggestions
const validateTimeSuggestions = [
    body('parsedIntent')
        .isObject()
        .withMessage('Parsed intent is required'),
    body('numberOfSuggestions')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Number of suggestions must be between 1 and 10'),
];

// Input validation for conflict detection
const validateConflictDetection = [
    body('appointment')
        .isObject()
        .withMessage('Appointment object is required'),
    body('appointment.title')
        .trim()
        .notEmpty()
        .withMessage('Appointment title is required'),
    body('appointment.startTime')
        .isISO8601()
        .withMessage('Valid start time is required'),
    body('appointment.endTime')
        .isISO8601()
        .withMessage('Valid end time is required'),
];

// Route: Parse natural language input to extract scheduling intent
router.post('/parse-natural-language', auth, validateNLPInput, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { text, context = {} } = req.body;
        const userId = req.user._id;

        logger.info('NLP parsing request', {
            userId: userId.toString(),
            textLength: text.length,
            hasContext: Object.keys(context).length > 0
        });

        // Check if AI is enabled for user
        const aiSettings = await AISettings.findOne({ user: userId });
        if (aiSettings && !aiSettings.enabled) {
            return res.status(403).json({
                success: false,
                message: 'AI assistant is disabled for this user'
            });
        }

        // Create default AI settings if they don't exist
        if (!aiSettings) {
            const newSettings = new AISettings({ user: userId });
            await newSettings.save();
        }

        const result = await groqAIService.parseNaturalLanguage(text, userId);

        logger.info('NLP parsing completed', {
            userId: userId.toString(),
            confidence: result.confidence,
            hasDateTime: !!result.intent?.datetime,
            ambiguities: result.ambiguities?.length || 0
        });

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('NLP parsing error', {
            userId: req.user._id.toString(),
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Failed to parse natural language input',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Route: Suggest optimal time slots
router.post('/suggest-times', auth, validateTimeSuggestions, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { parsedIntent, numberOfSuggestions = 5 } = req.body;
        const userId = req.user._id;

        logger.info('Time suggestions request', {
            userId: userId.toString(),
            numberOfSuggestions,
            hasTitle: !!parsedIntent.intent?.title
        });

        // Validate parsed intent structure
        if (!parsedIntent.intent || !parsedIntent.intent.title) {
            return res.status(400).json({
                success: false,
                message: 'Valid parsed intent with title is required'
            });
        }

        const suggestions = await groqAIService.suggestTimeSlots(
            parsedIntent.intent,
            userId,
            numberOfSuggestions
        );

        logger.info('Time suggestions completed', {
            userId: userId.toString(),
            suggestionsCount: suggestions.suggestions?.length || 0
        });

        res.json({
            success: true,
            data: suggestions,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Time suggestions error', {
            userId: req.user._id.toString(),
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Failed to suggest optimal time slots',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Route: Detect scheduling conflicts
router.post('/detect-conflicts', auth, validateConflictDetection, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { appointment } = req.body;
        const userId = req.user._id;

        logger.info('Conflict detection request', {
            userId: userId.toString(),
            appointmentTitle: appointment.title,
            startTime: appointment.startTime
        });

        // Validate appointment times
        const startTime = new Date(appointment.startTime);
        const endTime = new Date(appointment.endTime);
        
        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        if (startTime <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Start time must be in the future'
            });
        }

        const conflictAnalysis = await groqAIService.detectConflicts(appointment, userId);

        // Store conflict resolution data if conflicts exist
        if (conflictAnalysis.hasConflicts) {
            const conflictResolution = new ConflictResolutions({
                user: userId,
                originalRequest: {
                    rawText: req.body.rawText || '', // Include raw text if provided
                    parsedIntent: {
                        title: appointment.title,
                        datetime: new Date(appointment.startTime),
                        duration: appointment.endTime ? 
                            Math.round((new Date(appointment.endTime) - new Date(appointment.startTime)) / (1000 * 60)) : 
                            60, // default 60 minutes
                        attendees: appointment.attendees || [],
                        location: appointment.location || '',
                        type: appointment.type || 'meeting'
                    },
                    confidence: req.body.confidence || 1.0 // Include confidence if provided
                },
                conflicts: conflictAnalysis.conflicts,
                suggestedResolutions: conflictAnalysis.conflicts.flatMap(c => c.suggestedResolutions || []),
                aiReasoning: conflictAnalysis.reasoning,
                status: 'pending'
            });
            await conflictResolution.save();
            
            // Add resolution ID to response
            conflictAnalysis.resolutionId = conflictResolution._id;
        }

        // If no conflicts, create the appointment directly
        let createdAppointment = null;
        if (!conflictAnalysis.hasConflicts) {
            try {
                const appointmentData = {
                    title: appointment.title,
                    description: appointment.description || '',
                    location: appointment.location || '',
                    type: appointment.type || 'appointment',
                    startTime: appointment.startTime,
                    endTime: appointment.endTime,
                    attendees: appointment.attendees || [],
                    creator: userId
                };

                createdAppointment = new Appointment(appointmentData);
                await createdAppointment.save();

                // Update user patterns with successful appointment
                await groqAIService.updateUserPatterns(userId, appointmentData);

                logger.info('Appointment created successfully', {
                    userId: userId.toString(),
                    appointmentId: createdAppointment._id.toString(),
                    title: appointment.title
                });

                // Add appointment data to response
                conflictAnalysis.appointment = createdAppointment;

            } catch (appointmentError) {
                logger.error('Failed to create appointment', {
                    userId: userId.toString(),
                    error: appointmentError.message
                });
                
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create appointment',
                    error: process.env.NODE_ENV === 'development' ? appointmentError.message : 'Internal server error'
                });
            }
        }

        logger.info('Conflict detection completed', {
            userId: userId.toString(),
            hasConflicts: conflictAnalysis.hasConflicts,
            conflictsCount: conflictAnalysis.conflicts?.length || 0,
            appointmentCreated: !!createdAppointment
        });

        res.json({
            success: true,
            data: conflictAnalysis,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Conflict detection error', {
            userId: req.user._id.toString(),
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Failed to detect scheduling conflicts',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Route: Generate meeting agenda
router.post('/generate-agenda', auth, [
    body('appointment')
        .isObject()
        .withMessage('Appointment details are required'),
    body('appointment.title')
        .trim()
        .notEmpty()
        .withMessage('Appointment title is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { appointment } = req.body;
        const userId = req.user._id;

        logger.info('Agenda generation request', {
            userId: userId.toString(),
            appointmentTitle: appointment.title,
            appointmentType: appointment.type
        });

        const agenda = await groqAIService.generateAgenda(appointment, userId);

        logger.info('Agenda generation completed', {
            userId: userId.toString(),
            agendaItemsCount: agenda.agenda?.mainAgenda?.length || 0
        });

        res.json({
            success: true,
            data: agenda,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Agenda generation error', {
            userId: req.user._id.toString(),
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            message: 'Failed to generate meeting agenda',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Route: Get user AI settings
router.get('/settings', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        let aiSettings = await AISettings.findOne({ user: userId });
        
        if (!aiSettings) {
            // Create default settings
            aiSettings = new AISettings({ user: userId });
            await aiSettings.save();
        }

        res.json({
            success: true,
            data: aiSettings,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('AI settings retrieval error', {
            userId: req.user._id.toString(),
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve AI settings'
        });
    }
});

// Route: Update user AI settings
router.put('/settings', auth, [
    body('enabled').optional().isBoolean(),
    body('workingHours.start').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('workingHours.end').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('defaultMeetingDuration').optional().isInt({ min: 15, max: 480 }),
    body('bufferTime').optional().isInt({ min: 0, max: 60 }),
    body('maxDailyMeetings').optional().isInt({ min: 1, max: 20 }),
    body('timeZone').optional().isString(),
    body('nlpConfidenceThreshold').optional().isFloat({ min: 0, max: 1 }),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const userId = req.user._id;
        const updateData = req.body;

        logger.info('AI settings update request', {
            userId: userId.toString(),
            updateFields: Object.keys(updateData)
        });

        let aiSettings = await AISettings.findOne({ user: userId });
        
        if (!aiSettings) {
            aiSettings = new AISettings({ user: userId, ...updateData });
        } else {
            Object.keys(updateData).forEach(key => {
                if (key.includes('.')) {
                    // Handle nested updates
                    const [parent, child] = key.split('.');
                    if (!aiSettings[parent]) aiSettings[parent] = {};
                    aiSettings[parent][child] = updateData[key];
                } else {
                    aiSettings[key] = updateData[key];
                }
            });
        }

        await aiSettings.save();

        logger.info('AI settings updated successfully', {
            userId: userId.toString()
        });

        res.json({
            success: true,
            data: aiSettings,
            message: 'AI settings updated successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('AI settings update error', {
            userId: req.user._id.toString(),
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to update AI settings'
        });
    }
});

// Route: Resolve conflict
router.post('/resolve-conflict/:resolutionId', auth, [
    body('chosenResolution').isInt({ min: 0 }),
    body('createAppointment').optional().isBoolean(),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { resolutionId } = req.params;
        const { chosenResolution, createAppointment = false } = req.body;
        const userId = req.user._id;

        const conflictResolution = await ConflictResolutions.findOne({
            _id: resolutionId,
            user: userId
        });

        if (!conflictResolution) {
            return res.status(404).json({
                success: false,
                message: 'Conflict resolution not found'
            });
        }

        if (conflictResolution.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Conflict resolution already processed'
            });
        }

        // Update resolution status
        conflictResolution.chosenResolution = chosenResolution;
        conflictResolution.status = 'resolved';
        conflictResolution.resolvedAt = new Date();
        await conflictResolution.save();

        // Optionally create the appointment based on chosen resolution
        let createdAppointment = null;
        if (createAppointment && conflictResolution.suggestedResolutions[chosenResolution]) {
            const resolution = conflictResolution.suggestedResolutions[chosenResolution];
            const originalIntent = conflictResolution.originalRequest.parsedIntent;

            const appointmentData = {
                title: originalIntent.title,
                description: originalIntent.description || '',
                location: originalIntent.location || '',
                type: originalIntent.type || 'appointment',
                startTime: resolution.newTimeSlot?.startTime || originalIntent.startTime,
                endTime: resolution.newTimeSlot?.endTime || originalIntent.endTime,
                creator: userId
            };

            createdAppointment = new Appointment(appointmentData);
            await createdAppointment.save();

            // Update user patterns with successful resolution
            await groqAIService.updateUserPatterns(userId, appointmentData);
        }

        logger.info('Conflict resolved', {
            userId: userId.toString(),
            resolutionId,
            chosenResolution,
            appointmentCreated: !!createdAppointment
        });

        res.json({
            success: true,
            data: {
                conflictResolution,
                createdAppointment
            },
            message: 'Conflict resolved successfully',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Conflict resolution error', {
            userId: req.user._id.toString(),
            resolutionId: req.params.resolutionId,
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to resolve conflict'
        });
    }
});

// Route: Get conflict history
router.get('/conflicts', auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        const conflicts = await ConflictResolutions.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('originalRequest.parsedIntent');

        const total = await ConflictResolutions.countDocuments(query);

        res.json({
            success: true,
            data: {
                conflicts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Conflict history retrieval error', {
            userId: req.user._id.toString(),
            error: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve conflict history'
        });
    }
});

module.exports = router;
