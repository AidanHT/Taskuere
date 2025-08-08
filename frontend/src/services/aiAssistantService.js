import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AIAssistantService {
    constructor() {
        this.baseURL = `${API_BASE_URL}/api/ai`;
    }

    // Get authorization header with JWT token
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }

    // Parse natural language input
    async parseNaturalLanguage(text, context = {}) {
        try {
            const response = await axios.post(
                `${this.baseURL}/parse-natural-language`,
                { text, context },
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Get time slot suggestions
    async suggestTimeSlots(parsedIntent, numberOfSuggestions = 5) {
        try {
            const response = await axios.post(
                `${this.baseURL}/suggest-times`,
                { parsedIntent, numberOfSuggestions },
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Detect scheduling conflicts
    async detectConflicts(appointment) {
        try {
            const response = await axios.post(
                `${this.baseURL}/detect-conflicts`,
                { appointment },
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Generate meeting agenda
    async generateAgenda(appointment) {
        try {
            const response = await axios.post(
                `${this.baseURL}/generate-agenda`,
                { appointment },
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Get AI settings
    async getSettings() {
        try {
            const response = await axios.get(
                `${this.baseURL}/settings`,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Update AI settings
    async updateSettings(settings) {
        try {
            const response = await axios.put(
                `${this.baseURL}/settings`,
                settings,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Resolve conflict
    async resolveConflict(resolutionId, chosenResolution, createAppointment = false) {
        try {
            const response = await axios.post(
                `${this.baseURL}/resolve-conflict/${resolutionId}`,
                { chosenResolution, createAppointment },
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Get conflict history
    async getConflictHistory(page = 1, limit = 10, status = null) {
        try {
            const params = new URLSearchParams({ page, limit });
            if (status) params.append('status', status);

            const response = await axios.get(
                `${this.baseURL}/conflicts?${params}`,
                this.getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Process complete scheduling flow
    async processSchedulingRequest(text, context = {}) {
        try {
            // Step 1: Parse natural language
            const parseResult = await this.parseNaturalLanguage(text, context);
            
            if (!parseResult.success || parseResult.data.confidence < 0.5) {
                return {
                    success: false,
                    stage: 'parsing',
                    message: 'Could not understand the scheduling request',
                    data: parseResult.data
                };
            }

            // Step 2: Check for conflicts
            const intent = parseResult.data.intent;
            if (intent.datetime && intent.title) {
                const appointment = {
                    title: intent.title,
                    description: intent.description || '',
                    location: intent.location || '',
                    type: intent.type || 'appointment',
                    startTime: intent.datetime,
                    endTime: new Date(new Date(intent.datetime).getTime() + (intent.duration || 60) * 60000).toISOString()
                };

                const conflictResult = await this.detectConflicts(appointment);
                
                if (conflictResult.success && conflictResult.data.hasConflicts) {
                    return {
                        success: true,
                        stage: 'conflicts',
                        message: 'Conflicts detected',
                        data: {
                            parsedIntent: parseResult.data,
                            conflicts: conflictResult.data,
                            appointment
                        }
                    };
                }

                // Step 3: If no conflicts, suggest it's ready to create
                return {
                    success: true,
                    stage: 'ready',
                    message: 'Ready to create appointment',
                    data: {
                        parsedIntent: parseResult.data,
                        appointment,
                        conflicts: conflictResult.data
                    }
                };
            }

            // Step 4: If no specific time, suggest time slots
            const suggestions = await this.suggestTimeSlots(parseResult.data);
            
            return {
                success: true,
                stage: 'suggestions',
                message: 'Time slot suggestions generated',
                data: {
                    parsedIntent: parseResult.data,
                    suggestions: suggestions.data
                }
            };

        } catch (error) {
            return {
                success: false,
                stage: 'error',
                message: error.message || 'Failed to process scheduling request',
                error
            };
        }
    }

    // Helper method to handle API errors
    handleError(error) {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;
            const message = data?.message || data?.error || `HTTP ${status} Error`;
            
            return new Error(message);
        } else if (error.request) {
            // Request was made but no response received
            return new Error('Network error - please check your connection');
        } else {
            // Something else happened
            return new Error(error.message || 'An unexpected error occurred');
        }
    }

    // Utility method to format confidence as percentage
    formatConfidence(confidence) {
        return `${Math.round(confidence * 100)}%`;
    }

    // Utility method to check if AI is likely to understand the input
    isInputClear(text) {
        if (!text || text.trim().length < 3) return false;
        
        // Check for common scheduling keywords
        const schedulingKeywords = [
            'meeting', 'appointment', 'schedule', 'book', 'reserve',
            'call', 'session', 'conference', 'discussion', 'interview',
            'tomorrow', 'today', 'next week', 'monday', 'tuesday',
            'at', 'on', 'from', 'to', 'with', 'pm', 'am'
        ];
        
        const lowerText = text.toLowerCase();
        return schedulingKeywords.some(keyword => lowerText.includes(keyword));
    }

    // Utility method to extract suggested questions for unclear inputs
    getSuggestedQuestions() {
        return [
            "Schedule a meeting with John tomorrow at 2 PM",
            "Book a 30-minute call with the team next Tuesday",
            "Set up an interview on Friday morning",
            "Create a reminder for the project deadline",
            "Schedule a lunch meeting with Sarah next week"
        ];
    }
}

const aiAssistantService = new AIAssistantService();
export default aiAssistantService;
