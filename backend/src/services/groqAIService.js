const Groq = require('groq-sdk');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AISettings = require('../models/AISettings');
const MeetingPatterns = require('../models/MeetingPatterns');
const ConflictResolutions = require('../models/ConflictResolutions');

class GroqAIService {
    constructor() {
        // Check if Groq API key is available
        if (!process.env.GROQ_API_KEY) {
            console.warn('Warning: GROQ_API_KEY environment variable not set. AI features will be disabled.');
            this.groq = null;
            this.isEnabled = false;
        } else {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });
            this.isEnabled = true;
        }
        this.model = 'llama3-70b-8192'; // High-performance model for complex reasoning
    }

    /**
     * Check if AI service is enabled
     */
    isAIEnabled() {
        return this.isEnabled;
    }

    /**
     * Parse natural language input to extract scheduling intent
     */
    async parseNaturalLanguage(text, userId) {
        if (!this.isEnabled) {
            // Fallback to basic pattern matching when AI is not available
            return this.fallbackParseNaturalLanguage(text, userId);
        }

        try {
            const user = await User.findById(userId);
            const aiSettings = await AISettings.findOne({ user: userId });
            const patterns = await MeetingPatterns.findOne({ user: userId });

            const systemPrompt = `You are an expert scheduling assistant. Parse the natural language input and extract structured scheduling information.

User Context:
- Name: ${user.username}
- Email: ${user.email}
- Timezone: ${aiSettings?.timeZone || 'America/New_York'}
- Working Hours: ${aiSettings?.workingHours?.start || '09:00'} - ${aiSettings?.workingHours?.end || '17:00'}
- Default Meeting Duration: ${aiSettings?.defaultMeetingDuration || 60} minutes

Common patterns for this user:
${patterns ? JSON.stringify(patterns.commonMeetingTitles?.slice(0, 5) || [], null, 2) : 'No patterns available'}

Parse the following text and respond ONLY with valid JSON:

{
  "confidence": 0.0-1.0,
  "intent": {
    "title": "string",
    "datetime": "ISO 8601 datetime or null if unclear",
    "duration": "number in minutes",
    "attendees": ["email@example.com"],
    "location": "string or null",
    "type": "meeting|appointment|reminder",
    "description": "string or null",
    "isRecurring": "boolean",
    "recurringPattern": "daily|weekly|monthly|none"
  },
  "ambiguities": ["list of unclear elements"],
  "suggestions": ["clarifying questions if needed"]
}

Current date/time: ${new Date().toISOString()}`;

            const response = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                model: this.model,
                temperature: 0.3,
                max_tokens: 1000
            });

            const result = JSON.parse(response.choices[0].message.content);
            
            // Validate and enhance the result
            return this.validateAndEnhanceParsedIntent(result, userId);

        } catch (error) {
            console.error('Error parsing natural language:', error);
            throw new Error('Failed to parse natural language input');
        }
    }

    /**
     * Fallback natural language parsing when AI is not available
     */
    async fallbackParseNaturalLanguage(text, userId) {
        try {
            const user = await User.findById(userId);
            const aiSettings = await AISettings.findOne({ user: userId });
            
            // Simple pattern matching for basic scheduling
            const lowerText = text.toLowerCase();
            
            // Extract title (before time indicators)
            let title = text;
            const timeIndicators = ['at', 'on', 'tomorrow', 'today', 'next', 'this'];
            for (const indicator of timeIndicators) {
                const index = lowerText.indexOf(indicator);
                if (index !== -1) {
                    title = text.substring(0, index).trim();
                    break;
                }
            }
            
            // Clean up title
            title = title.replace(/^(schedule|book|set up|create|plan)\s+/i, '').trim();
            if (!title) title = 'Meeting';
            
            // Try to extract time information
            let datetime = null;
            let confidence = 0.3; // Low confidence for fallback
            
            // Simple time pattern matching
            const timePatterns = [
                /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
                /tomorrow/i,
                /today/i,
                /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
                /next\s+(week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
            ];
            
            let foundTime = false;
            for (const pattern of timePatterns) {
                if (pattern.test(lowerText)) {
                    foundTime = true;
                    confidence = 0.6;
                    break;
                }
            }
            
            // If we found time indicators, try to parse a reasonable datetime
            if (foundTime) {
                const now = new Date();
                if (lowerText.includes('tomorrow')) {
                    datetime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    datetime.setHours(14, 0, 0, 0); // Default 2 PM
                } else if (lowerText.includes('today')) {
                    datetime = new Date();
                    datetime.setHours(datetime.getHours() + 1, 0, 0, 0); // Next hour
                } else {
                    // Default to next business day at 2 PM
                    datetime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    while (datetime.getDay() === 0 || datetime.getDay() === 6) {
                        datetime.setDate(datetime.getDate() + 1);
                    }
                    datetime.setHours(14, 0, 0, 0);
                }
                datetime = datetime.toISOString();
            }
            
            // Determine meeting type
            let type = 'meeting';
            if (lowerText.includes('appointment')) type = 'appointment';
            if (lowerText.includes('reminder')) type = 'reminder';
            if (lowerText.includes('call')) type = 'meeting';
            
            // Extract duration
            let duration = aiSettings?.defaultMeetingDuration || 60;
            const durationMatch = lowerText.match(/(\d+)\s*(hour|hr|minute|min)/i);
            if (durationMatch) {
                const num = parseInt(durationMatch[1]);
                const unit = durationMatch[2].toLowerCase();
                if (unit.startsWith('hour') || unit.startsWith('hr')) {
                    duration = num * 60;
                } else {
                    duration = num;
                }
                confidence += 0.1;
            }
            
            const result = {
                confidence,
                intent: {
                    title,
                    datetime,
                    duration,
                    attendees: [],
                    location: null,
                    type,
                    description: null,
                    isRecurring: false,
                    recurringPattern: 'none'
                },
                ambiguities: datetime ? [] : ['Specific time not provided'],
                suggestions: datetime ? [] : ['Please specify when you would like to schedule this']
            };
            
            return this.validateAndEnhanceParsedIntent(result, userId);
            
        } catch (error) {
            console.error('Error in fallback parsing:', error);
            throw new Error('Failed to parse scheduling request');
        }
    }

    /**
     * Suggest optimal time slots based on user patterns and constraints
     */
    async suggestTimeSlots(parsedIntent, userId, numberOfSuggestions = 5) {
        if (!this.isEnabled) {
            throw new Error('AI service is not available. Please configure GROQ_API_KEY.');
        }

        try {
            const user = await User.findById(userId);
            const aiSettings = await AISettings.findOne({ user: userId });
            const patterns = await MeetingPatterns.findOne({ user: userId });
            
            // Get existing appointments for conflict checking
            const existingAppointments = await Appointment.find({
                $or: [
                    { creator: userId },
                    { 'attendees.user': userId }
                ],
                startTime: {
                    $gte: new Date(),
                    $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
            });

            const systemPrompt = `You are an expert scheduling optimization AI. Suggest ${numberOfSuggestions} optimal time slots for a meeting.

User Preferences:
- Working Hours: ${aiSettings?.workingHours?.start || '09:00'} - ${aiSettings?.workingHours?.end || '17:00'}
- Timezone: ${aiSettings?.timeZone || 'America/New_York'}
- Default Duration: ${aiSettings?.defaultMeetingDuration || 60} minutes
- Buffer Time: ${aiSettings?.bufferTime || 15} minutes
- Allow Weekends: ${aiSettings?.preferences?.allowWeekends || false}
- Max Daily Meetings: ${aiSettings?.maxDailyMeetings || 8}

Existing Appointments:
${JSON.stringify(existingAppointments.map(apt => ({
    title: apt.title,
    start: apt.startTime,
    end: apt.endTime
})), null, 2)}

User Patterns:
${patterns ? JSON.stringify({
    preferredTimeSlots: patterns.preferredTimeSlots?.slice(0, 5) || [],
    commonMeetingTypes: patterns.meetingTypes?.slice(0, 3) || []
}, null, 2) : 'No patterns available'}

Meeting Request:
${JSON.stringify(parsedIntent, null, 2)}

Current date/time: ${new Date().toISOString()}

Respond ONLY with valid JSON:

{
  "suggestions": [
    {
      "startTime": "ISO 8601 datetime",
      "endTime": "ISO 8601 datetime",
      "confidence": 0.0-1.0,
      "reason": "Brief explanation why this slot is optimal",
      "pros": ["advantage 1", "advantage 2"],
      "cons": ["potential issue 1"],
      "conflictLevel": "none|low|medium|high"
    }
  ],
  "reasoning": "Overall strategy for these suggestions"
}`;

            const response = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Please suggest time slots for this meeting request.` }
                ],
                model: this.model,
                temperature: 0.4,
                max_tokens: 1500
            });

            return JSON.parse(response.choices[0].message.content);

        } catch (error) {
            console.error('Error suggesting time slots:', error);
            throw new Error('Failed to suggest optimal time slots');
        }
    }

    /**
     * Detect and analyze scheduling conflicts
     *
     * Important: This method performs deterministic server-side checks for
     * conflicts and only uses the LLM for optional reasoning and suggestions.
     * The final hasConflicts flag is decided by deterministic logic to avoid
     * false positives that would block creation.
     */
    async detectConflicts(proposedAppointment, userId) {
        if (!this.isEnabled) {
            throw new Error('AI service is not available. Please configure GROQ_API_KEY.');
        }

        try {
            const aiSettings = await AISettings.findOne({ user: userId });

            const start = new Date(proposedAppointment.startTime);
            const end = new Date(proposedAppointment.endTime);

            // 1) Find overlapping appointments for the user
            const overlappingAppointments = await Appointment.find({
                $or: [
                    { creator: userId },
                    { 'attendees.user': userId }
                ],
                $and: [
                    {
                        $or: [
                            { startTime: { $lt: end, $gte: start } },
                            { endTime: { $gt: start, $lte: end } },
                            { $and: [ { startTime: { $lte: start } }, { endTime: { $gte: end } } ] }
                        ]
                    }
                ]
            });

            // 2) Deterministic conflict checks
            const deterministicConflicts = [];

            // Overlap conflicts
            for (const apt of overlappingAppointments) {
                deterministicConflicts.push({
                    type: 'time_overlap',
                    severity: 'high',
                    description: `Overlaps with "${apt.title}" from ${apt.startTime.toISOString()} to ${apt.endTime.toISOString()}`,
                    conflictingAppointmentId: apt._id,
                    suggestedResolutions: [
                        {
                            type: 'reschedule',
                            description: 'Move this appointment to a free slot that does not overlap.',
                            newTimeSlot: null,
                            confidence: 0.9,
                            pros: ['Avoids direct overlap'],
                            cons: []
                        }
                    ]
                });
            }

            // Buffer time conflict
            const requiredBufferMinutes = aiSettings?.bufferTime ?? 15;
            // Define day bounds once for reuse
            const startOfDay = new Date(start);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(start);
            endOfDay.setHours(23, 59, 59, 999);
            if (requiredBufferMinutes > 0) {
                const bufferMillis = requiredBufferMinutes * 60 * 1000;
                // Get same-day appointments to evaluate buffers before/after

                const sameDayAppointments = await Appointment.find({
                    $or: [
                        { creator: userId },
                        { 'attendees.user': userId }
                    ],
                    startTime: { $lte: endOfDay },
                    endTime: { $gte: startOfDay }
                });

                for (const apt of sameDayAppointments) {
                    const gapBefore = start.getTime() - apt.endTime.getTime();
                    const gapAfter = apt.startTime.getTime() - end.getTime();
                    if ((gapBefore >= 0 && gapBefore < bufferMillis) || (gapAfter >= 0 && gapAfter < bufferMillis)) {
                        deterministicConflicts.push({
                            type: 'buffer_violation',
                            severity: 'medium',
                            description: `Less than ${requiredBufferMinutes} minutes buffer near "${apt.title}"`,
                            conflictingAppointmentId: apt._id,
                            suggestedResolutions: [
                                {
                                    type: 'reschedule',
                                    description: `Shift by at least ${requiredBufferMinutes} minutes to satisfy buffer requirements.`,
                                    newTimeSlot: null,
                                    confidence: 0.7,
                                    pros: ['Respects recovery/travel time'],
                                    cons: []
                                }
                            ]
                        });
                    }
                }
            }

            // Working hours and weekend conflicts
            const workingStartStr = aiSettings?.workingHours?.start ?? '09:00';
            const workingEndStr = aiSettings?.workingHours?.end ?? '17:00';
            const [workStartHour] = workingStartStr.split(':').map(Number);
            const [workEndHour] = workingEndStr.split(':').map(Number);
            const startHour = start.getHours();
            const endHour = end.getHours();
            const allowWeekends = aiSettings?.preferences?.allowWeekends ?? false;
            const isWeekend = [0, 6].includes(start.getDay());

            if (!allowWeekends && isWeekend) {
                deterministicConflicts.push({
                    type: 'weekend_conflict',
                    severity: 'low',
                    description: 'User preferences do not allow weekend meetings.',
                    conflictingAppointmentId: null,
                    suggestedResolutions: [
                        {
                            type: 'reschedule',
                            description: 'Move to a weekday within working hours.',
                            newTimeSlot: null,
                            confidence: 0.6,
                            pros: ['Aligns with preferences'],
                            cons: []
                        }
                    ]
                });
            }

            if (startHour < workStartHour || endHour > workEndHour) {
                deterministicConflicts.push({
                    type: 'outside_working_hours',
                    severity: 'low',
                    description: `Proposed time is outside working hours (${workingStartStr}-${workingEndStr}).`,
                    conflictingAppointmentId: null,
                    suggestedResolutions: [
                        {
                            type: 'reschedule',
                            description: 'Move inside stated working hours.',
                            newTimeSlot: null,
                            confidence: 0.6,
                            pros: ['Higher availability'],
                            cons: []
                        }
                    ]
                });
            }

            // Max daily meetings
            const maxDaily = aiSettings?.maxDailyMeetings ?? 8;
            const dailyCount = await Appointment.countDocuments({
                $or: [
                    { creator: userId },
                    { 'attendees.user': userId }
                ],
                startTime: { $gte: new Date(startOfDay) },
                endTime: { $lte: new Date(endOfDay) }
            });
            if (dailyCount + 1 > maxDaily) {
                deterministicConflicts.push({
                    type: 'too_many_meetings',
                    severity: 'medium',
                    description: `Daily meeting limit (${maxDaily}) would be exceeded.`,
                    conflictingAppointmentId: null,
                    suggestedResolutions: [
                        {
                            type: 'decline',
                            description: 'Reduce number of meetings on this day or move to another day.',
                            newTimeSlot: null,
                            confidence: 0.5,
                            pros: ['Keeps workload manageable'],
                            cons: []
                        }
                    ]
                });
            }

            // Only treat blocking conflicts as true conflicts; other policy-based issues are warnings
            const nonBlockingTypes = new Set(['outside_working_hours', 'weekend_conflict']);
            const hasDeterministicConflicts = deterministicConflicts.some(c => !nonBlockingTypes.has(c.type));
            const nonBlockingWarnings = deterministicConflicts.filter(c => nonBlockingTypes.has(c.type));

            // Ask LLM for reasoning/suggestions, but DO NOT trust its hasConflicts boolean
            let aiAugmentation = { conflicts: [], reasoning: '', overallRecommendation: hasDeterministicConflicts ? 'reschedule' : 'accept' };
            try {
                const systemPrompt = `You are an expert scheduling assistant. Given the proposed appointment, user settings and existing events, provide reasoning and suggestions. Do not invent conflicts if none are present. Respond only with JSON.`;
                const llmPayload = {
                    proposedAppointment,
                    userSettings: {
                        bufferTime: aiSettings?.bufferTime ?? 15,
                        maxDailyMeetings: aiSettings?.maxDailyMeetings ?? 8,
                        workingHours: aiSettings?.workingHours ?? { start: '09:00', end: '17:00' },
                        allowWeekends
                    },
                    overlappingAppointments: overlappingAppointments.map(a => ({
                        id: a._id,
                        title: a.title,
                        start: a.startTime,
                        end: a.endTime
                    })),
                    deterministicConflicts
                };

                const response = await this.groq.chat.completions.create({
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: JSON.stringify(llmPayload) }
                    ],
                    model: this.model,
                    temperature: 0.2,
                    max_tokens: 1400
                });

                const parsed = JSON.parse(response.choices[0].message.content || '{}');
                aiAugmentation = {
                    conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
                    reasoning: parsed.reasoning || '',
                    overallRecommendation: parsed.overallRecommendation || (hasDeterministicConflicts ? 'reschedule' : 'accept')
                };
            } catch (llmError) {
                // If LLM augmentation fails, proceed with deterministic output only
                console.warn('LLM augmentation failed, falling back to deterministic conflicts:', llmError.message);
            }

            return {
                hasConflicts: hasDeterministicConflicts,
                conflicts: [...deterministicConflicts, ...aiAugmentation.conflicts],
                warnings: nonBlockingWarnings,
                overallRecommendation: aiAugmentation.overallRecommendation,
                reasoning: aiAugmentation.reasoning
            };

        } catch (error) {
            console.error('Error detecting conflicts:', error);
            throw new Error('Failed to detect scheduling conflicts');
        }
    }

    /**
     * Generate meeting agenda using AI
     */
    async generateAgenda(appointmentDetails, userId) {
        if (!this.isEnabled) {
            throw new Error('AI service is not available. Please configure GROQ_API_KEY.');
        }

        try {
            const user = await User.findById(userId);
            const patterns = await MeetingPatterns.findOne({ user: userId });

            const systemPrompt = `You are an expert meeting facilitator AI. Generate a professional meeting agenda based on the appointment details.

User Context:
- Name: ${user.username}
- Common Meeting Types: ${patterns?.meetingTypes?.map(mt => mt.type).join(', ') || 'Various'}

Meeting Details:
${JSON.stringify(appointmentDetails, null, 2)}

Create a structured agenda that includes:
1. Pre-meeting preparation
2. Main agenda items
3. Time allocations
4. Action items framework
5. Follow-up suggestions

Respond ONLY with valid JSON:

{
  "agenda": {
    "title": "Meeting Title",
    "duration": "duration in minutes",
    "preMeeting": {
      "preparation": ["item 1", "item 2"],
      "materialsNeeded": ["material 1", "material 2"]
    },
    "mainAgenda": [
      {
        "item": "Agenda item title",
        "timeAllocation": "minutes",
        "description": "Brief description",
        "presenter": "presenter name or TBD",
        "type": "discussion|presentation|decision|brainstorming"
      }
    ],
    "actionItems": {
      "template": ["Action item template 1", "Action item template 2"]
    },
    "followUp": {
      "nextSteps": ["step 1", "step 2"],
      "nextMeetingRecommendation": "suggestion for follow-up meeting if needed"
    }
  },
  "tips": ["meeting tip 1", "meeting tip 2"],
  "estimatedOutcomes": ["expected outcome 1", "expected outcome 2"]
}`;

            const response = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Please generate a professional agenda for this meeting.' }
                ],
                model: this.model,
                temperature: 0.5,
                max_tokens: 2000
            });

            return JSON.parse(response.choices[0].message.content);

        } catch (error) {
            console.error('Error generating agenda:', error);
            throw new Error('Failed to generate meeting agenda');
        }
    }

    /**
     * Validate and enhance parsed intent
     */
    async validateAndEnhanceParsedIntent(result, userId) {
        const aiSettings = await AISettings.findOne({ user: userId });
        
        // Apply user-specific defaults and validations
        if (result.intent) {
            // Set default duration if not specified
            if (!result.intent.duration && result.confidence > (aiSettings?.nlpConfidenceThreshold || 0.7)) {
                result.intent.duration = aiSettings?.defaultMeetingDuration || 60;
            }

            // Validate datetime is in the future
            if (result.intent.datetime) {
                const proposedTime = new Date(result.intent.datetime);
                if (proposedTime <= new Date()) {
                    result.ambiguities = result.ambiguities || [];
                    result.ambiguities.push('Proposed time is in the past');
                    result.confidence = Math.max(0, result.confidence - 0.3);
                }
            }

            // Check working hours compliance
            if (result.intent.datetime && aiSettings?.workingHours) {
                const appointmentTime = new Date(result.intent.datetime);
                const hour = appointmentTime.getHours();
                const workStart = parseInt(aiSettings.workingHours.start.split(':')[0]);
                const workEnd = parseInt(aiSettings.workingHours.end.split(':')[0]);
                
                if (hour < workStart || hour >= workEnd) {
                    result.suggestions = result.suggestions || [];
                    result.suggestions.push('Consider scheduling during working hours for better availability');
                }
            }
        }

        return result;
    }

    /**
     * Learn from user patterns and update ML model
     */
    async updateUserPatterns(userId, appointmentData) {
        try {
            let patterns = await MeetingPatterns.findOne({ user: userId });
            
            if (!patterns) {
                patterns = new MeetingPatterns({ user: userId });
            }

            // Update common meeting titles
            const titleIndex = patterns.commonMeetingTitles.findIndex(
                title => title.title.toLowerCase() === appointmentData.title.toLowerCase()
            );
            
            if (titleIndex >= 0) {
                patterns.commonMeetingTitles[titleIndex].frequency += 1;
                patterns.commonMeetingTitles[titleIndex].avgDuration = 
                    (patterns.commonMeetingTitles[titleIndex].avgDuration + (appointmentData.duration || 60)) / 2;
            } else {
                patterns.commonMeetingTitles.push({
                    title: appointmentData.title,
                    frequency: 1,
                    avgDuration: appointmentData.duration || 60
                });
            }

            // Update preferred time slots
            const appointmentDate = new Date(appointmentData.startTime);
            const hour = appointmentDate.getHours();
            const dayOfWeek = appointmentDate.getDay();
            
            const timeSlotIndex = patterns.preferredTimeSlots.findIndex(
                slot => slot.hour === hour && slot.dayOfWeek === dayOfWeek
            );
            
            if (timeSlotIndex >= 0) {
                patterns.preferredTimeSlots[timeSlotIndex].frequency += 1;
            } else {
                patterns.preferredTimeSlots.push({
                    hour,
                    dayOfWeek,
                    frequency: 1
                });
            }

            // Update meeting types
            const typeIndex = patterns.meetingTypes.findIndex(
                type => type.type === appointmentData.type
            );
            
            if (typeIndex >= 0) {
                patterns.meetingTypes[typeIndex].frequency += 1;
                patterns.meetingTypes[typeIndex].avgDuration = 
                    (patterns.meetingTypes[typeIndex].avgDuration + (appointmentData.duration || 60)) / 2;
            } else {
                patterns.meetingTypes.push({
                    type: appointmentData.type,
                    frequency: 1,
                    avgDuration: appointmentData.duration || 60
                });
            }

            patterns.lastAnalyzed = new Date();
            await patterns.save();

            return patterns;

        } catch (error) {
            console.error('Error updating user patterns:', error);
            throw new Error('Failed to update user learning patterns');
        }
    }
}

module.exports = new GroqAIService();
