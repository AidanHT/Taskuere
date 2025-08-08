import React, { useState, useEffect } from 'react';
import {
    Paper,
    TextField,
    IconButton,
    Box,
    Typography,
    Chip,
    CircularProgress,
    Tooltip,
    Button,
    Alert,
    Collapse,
} from '@mui/material';
import {
    Mic,
    MicOff,
    Send,
    Clear,
    Psychology,
    Lightbulb,
    VolumeUp,
} from '@mui/icons-material';
import { useSpeechSynthesis, useSpeechRecognition } from 'react-speech-kit';
import aiAssistantService from '../services/aiAssistantService';

const NaturalLanguageInput = ({ 
    onResult, 
    onError, 
    placeholder = "Tell me what you'd like to schedule...",
    disabled = false,
    showSuggestions = true 
}) => {
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [confidence, setConfidence] = useState(null);
    const [lastResult, setLastResult] = useState(null);

    // Speech recognition hooks
    const { listen, listening, stop, supported: speechSupported } = useSpeechRecognition({
        onResult: (result) => {
            setInput(result);
        },
        onError: (error) => {
            console.error('Speech recognition error:', error);
            onError?.('Voice recognition failed. Please try typing instead.');
        }
    });

    // Speech synthesis hook
    const { speak, cancel } = useSpeechSynthesis();

    // Suggested prompts for users
    const suggestedPrompts = [
        "Schedule a meeting with John tomorrow at 2 PM",
        "Book a 30-minute call with the team next Tuesday",
        "Set up an interview on Friday morning",
        "Create a reminder for the project deadline",
        "Schedule lunch with Sarah next week"
    ];

    useEffect(() => {
        // Auto-stop listening after 10 seconds
        if (listening) {
            const timer = setTimeout(() => {
                stop();
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [listening, stop]);

    const handleSubmit = async () => {
        if (!input.trim() || isProcessing) return;

        setIsProcessing(true);
        setConfidence(null);

        try {
            const result = await aiAssistantService.processSchedulingRequest(input.trim());
            
            if (result.success) {
                setLastResult(result);
                onResult?.(result);
                
                // Speak the result if user prefers audio feedback
                if (result.stage === 'ready') {
                    if (result.data.conflicts?.appointment) {
                        // Appointment was created successfully
                        speak({ text: `Perfect! I've created your appointment "${result.data.appointment.title}" successfully.` });
                    } else {
                        speak({ text: `I found a time slot for "${result.data.appointment.title}". Would you like me to create this appointment?` });
                    }
                } else if (result.stage === 'conflicts') {
                    speak({ text: `I found some scheduling conflicts. Let me show you the alternatives.` });
                } else if (result.stage === 'suggestions') {
                    speak({ text: `I have some time slot suggestions for you.` });
                }
            } else {
                onError?.(result.message || 'Failed to process request');
                speak({ text: 'I couldn\'t understand that request. Could you please try rephrasing it?' });
            }
        } catch (error) {
            console.error('Processing error:', error);
            onError?.(error.message || 'Failed to process request');
            speak({ text: 'Sorry, there was an error processing your request.' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    const handleClear = () => {
        setInput('');
        setConfidence(null);
        setLastResult(null);
        cancel(); // Stop any ongoing speech
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        setShowHints(false);
    };

    const toggleListening = () => {
        if (listening) {
            stop();
        } else {
            listen();
        }
    };

    const isInputClear = aiAssistantService.isInputClear(input);

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Psychology color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    AI Scheduling Assistant
                </Typography>
                {/* confidence display removed */}
            </Box>

            {/* Main input area */}
            <Box sx={{ position: 'relative' }}>
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    disabled={disabled || isProcessing}
                    variant="outlined"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            pr: 0,
                        }
                    }}
                    InputProps={{
                        endAdornment: (
                            <Box sx={{ display: 'flex', flexDirection: 'column', p: 1 }}>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {/* Voice input button */}
                                    {speechSupported && (
                                        <Tooltip title={listening ? 'Stop listening' : 'Start voice input'}>
                                            <span>
                                                <IconButton
                                                    onClick={toggleListening}
                                                    disabled={disabled || isProcessing}
                                                    color={listening ? 'error' : 'default'}
                                                    size="small"
                                                >
                                                    {listening ? <MicOff /> : <Mic />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    )}
                                    
                                    {/* Clear button */}
                                    {input && (
                                        <Tooltip title="Clear input">
                                            <span>
                                                <IconButton
                                                    onClick={handleClear}
                                                    disabled={disabled || isProcessing}
                                                    size="small"
                                                >
                                                    <Clear />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    )}
                                    
                                    {/* Submit button */}
                                    <Tooltip title="Process request">
                                        <span>
                                            <IconButton
                                                onClick={handleSubmit}
                                                disabled={disabled || !input.trim() || isProcessing}
                                                color="primary"
                                                size="small"
                                            >
                                                {isProcessing ? <CircularProgress size={20} /> : <Send />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>
                        )
                    }}
                />
                
                {/* Voice input indicator */}
                {listening && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'error.main',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            zIndex: 1
                        }}
                    >
                        <VolumeUp sx={{ fontSize: 16, mr: 0.5 }} />
                        Listening...
                    </Box>
                )}
            </Box>

            {/* Input quality indicator */}
            {input && !isProcessing && (
                <Box sx={{ mt: 1 }}>
                    {isInputClear ? (
                        <Alert severity="success" sx={{ py: 0 }}>
                            This looks like a scheduling request I can understand!
                        </Alert>
                    ) : (
                        <Alert severity="warning" sx={{ py: 0 }}>
                            Try including words like "schedule", "meeting", "tomorrow", or specific times
                        </Alert>
                    )}
                </Box>
            )}

            {/* Suggestions */}
            {showSuggestions && (
                <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Button
                            startIcon={<Lightbulb />}
                            onClick={() => setShowHints(!showHints)}
                            size="small"
                            variant="text"
                        >
                            {showHints ? 'Hide' : 'Show'} example requests
                        </Button>
                    </Box>
                    
                    <Collapse in={showHints}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {suggestedPrompts.map((prompt, index) => (
                                <Chip
                                    key={index}
                                    label={prompt}
                                    onClick={() => handleSuggestionClick(prompt)}
                                    clickable
                                    variant="outlined"
                                    size="small"
                                    sx={{ 
                                        mb: 0.5,
                                        '&:hover': {
                                            backgroundColor: 'primary.light',
                                            color: 'white'
                                        }
                                    }}
                                />
                            ))}
                        </Box>
                    </Collapse>
                </Box>
            )}

            {/* Last result summary */}
            {lastResult && !isProcessing && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Status:</strong> {lastResult.message}
                    </Typography>
                    {lastResult.data?.parsedIntent?.intent?.title && (
                        <Typography variant="body2" color="text.secondary">
                            <strong>Understood:</strong> {lastResult.data.parsedIntent.intent.title}
                            {lastResult.data.parsedIntent.intent.datetime && (
                                <> on {new Date(lastResult.data.parsedIntent.intent.datetime).toLocaleString()}</>
                            )}
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default NaturalLanguageInput;
