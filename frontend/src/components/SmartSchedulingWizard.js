import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
    Alert,
    CircularProgress,
    Grid,
} from '@mui/material';
import {
    Schedule,
    CheckCircle,
    Warning,
    Error,
    EventAvailable,
    Psychology,
    AutoFixHigh,
    AccessTime,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import NaturalLanguageInput from './NaturalLanguageInput';
import ConflictResolutionDialog from './ConflictResolutionDialog';
import AIInsightsPanel from './AIInsightsPanel';
import aiAssistantService from '../services/aiAssistantService';
import toast from 'react-hot-toast';

const SmartSchedulingWizard = ({ open, onClose, onScheduleCreated }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [conflictResolution, setConflictResolution] = useState(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [showInsights, setShowInsights] = useState(false);

    const steps = [
        'Natural Language Input',
        'Time Slot Selection', 
        'Conflict Resolution',
        'Confirmation'
    ];

    const handleAIResult = (result) => {
        setAiResult(result);
        
        switch (result.stage) {
            case 'suggestions':
                setActiveStep(1); // Go to time slot selection
                break;
            case 'conflicts':
                setConflictResolution(result.data.conflicts);
                setActiveStep(2); // Go to conflict resolution
                break;
            case 'ready':
                setActiveStep(3); // Go to confirmation
                break;
            case 'error':
                toast.error(result.message);
                break;
            default:
                break;
        }
    };

    const handleAIError = (error) => {
        toast.error(error);
    };

    const handleTimeSlotSelection = async (timeSlot) => {
        setProcessing(true);

        try {
            // Create appointment object with selected time slot
            const appointment = {
                title: aiResult.data.parsedIntent.intent.title,
                description: aiResult.data.parsedIntent.intent.description || '',
                location: aiResult.data.parsedIntent.intent.location || '',
                type: aiResult.data.parsedIntent.intent.type || 'appointment',
                startTime: timeSlot.startTime,
                endTime: timeSlot.endTime
            };

            // Check for conflicts with the selected time slot
            const conflictResult = await aiAssistantService.detectConflicts(appointment);
            
            if (conflictResult.success && conflictResult.data.hasConflicts) {
                setConflictResolution(conflictResult.data);
                setActiveStep(2); // Go to conflict resolution
            } else {
                // Update AI result with the selected appointment
                setAiResult({
                    ...aiResult,
                    stage: 'ready',
                    data: {
                        ...aiResult.data,
                        appointment,
                        conflicts: conflictResult.data
                    }
                });
                setActiveStep(3); // Go to confirmation
            }
        } catch (error) {
            toast.error('Failed to check for conflicts');
            console.error('Conflict check error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleConflictResolution = (resolution) => {
        if (resolution.createAppointment) {
            // Appointment was created through conflict resolution
            onScheduleCreated?.(resolution.createdAppointment);
            handleClose();
            toast.success('Appointment created successfully with conflict resolution!');
        } else {
            // Show the resolved time slot
            const resolvedTimeSlot = resolution.conflictResolution.suggestedResolutions[
                resolution.conflictResolution.chosenResolution
            ];
            
            if (resolvedTimeSlot?.newTimeSlot) {
                setAiResult({
                    ...aiResult,
                    stage: 'ready',
                    data: {
                        ...aiResult.data,
                        appointment: {
                            ...aiResult.data.appointment,
                            startTime: resolvedTimeSlot.newTimeSlot.startTime,
                            endTime: resolvedTimeSlot.newTimeSlot.endTime
                        }
                    }
                });
                setActiveStep(3); // Go to confirmation
            }
        }
        setShowConflictDialog(false);
    };

    const handleFinalConfirmation = async () => {
        setProcessing(true);
        
        try {
            const appointment = aiResult.data.appointment;
            
            // Create the appointment through the regular API
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(appointment)
            });

            if (response.ok) {
                const createdAppointment = await response.json();
                onScheduleCreated?.(createdAppointment);
                handleClose();
                toast.success('Appointment created successfully!');
            } else {
                throw new Error('Failed to create appointment');
            }
        } catch (error) {
            toast.error('Failed to create appointment');
            console.error('Appointment creation error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setActiveStep(0);
        setAiResult(null);
        setConflictResolution(null);
        setShowConflictDialog(false);
        setShowInsights(false);
        onClose();
    };

    const getStepIcon = (step) => {
        switch (step) {
            case 0: return <Psychology />;
            case 1: return <Schedule />;
            case 2: return <Warning />;
            case 3: return <CheckCircle />;
            default: return <Schedule />;
        }
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <Box>
                        <NaturalLanguageInput
                            onResult={handleAIResult}
                            onError={handleAIError}
                            placeholder="Describe what you'd like to schedule... (e.g., 'Meeting with John tomorrow at 2 PM')"
                            showSuggestions={true}
                        />
                        
                        {aiResult && (
                            <Box sx={{ mt: 2 }}>
                                <Button
                                    startIcon={<AutoFixHigh />}
                                    onClick={() => setShowInsights(true)}
                                    variant="outlined"
                                    size="small"
                                >
                                    View AI Analysis
                                </Button>
                            </Box>
                        )}
                    </Box>
                );

            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            AI-Suggested Time Slots
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Select a time slot that works best for you:
                        </Typography>
                        
                        {processing ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <List>
                                {aiResult?.data?.suggestions?.suggestions?.map((suggestion, index) => (
                                    <ListItem key={index} divider>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <AccessTime color="primary" fontSize="small" />
                                                    {format(parseISO(suggestion.startTime), 'PPP p')} - 
                                                    {format(parseISO(suggestion.endTime), 'p')}
                                                    {/* confidence chip removed */}
                                                </Box>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                                        {suggestion.reason}
                                                    </Typography>
                                                    {suggestion.conflictLevel !== 'none' && (
                                                        <Alert severity="warning" sx={{ py: 0 }}>
                                                            Conflict Level: {suggestion.conflictLevel}
                                                        </Alert>
                                                    )}
                                                </Box>
                                            }
                                        />
                                        <ListItemSecondaryAction>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handleTimeSlotSelection(suggestion)}
                                                disabled={processing}
                                            >
                                                Select
                                            </Button>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Scheduling Conflicts Detected
                        </Typography>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            The AI found some conflicts with your requested time. Please review the suggested resolutions.
                        </Alert>
                        
                        <Button
                            variant="contained"
                            onClick={() => setShowConflictDialog(true)}
                            startIcon={<Warning />}
                        >
                            Resolve Conflicts
                        </Button>
                    </Box>
                );

            case 3:
                const appointment = aiResult?.data?.appointment;
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Confirm Your Appointment
                        </Typography>
                        
                        {appointment && (
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="h6" color="primary">
                                                {appointment.title}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                Start Time
                                            </Typography>
                                            <Typography variant="body1">
                                                {format(parseISO(appointment.startTime), 'PPP p')}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="text.secondary">
                                                End Time
                                            </Typography>
                                            <Typography variant="body1">
                                                {format(parseISO(appointment.endTime), 'PPP p')}
                                            </Typography>
                                        </Grid>
                                        {appointment.description && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Description
                                                </Typography>
                                                <Typography variant="body1">
                                                    {appointment.description}
                                                </Typography>
                                            </Grid>
                                        )}
                                        {appointment.location && (
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Location
                                                </Typography>
                                                <Typography variant="body1">
                                                    {appointment.location}
                                                </Typography>
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">
                                                Type
                                            </Typography>
                                            <Chip label={appointment.type} size="small" />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        )}
                        
                        <Alert severity="success">
                            <EventAvailable sx={{ mr: 1 }} />
                            Everything looks good! Ready to create your appointment.
                        </Alert>
                    </Box>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { minHeight: '60vh' }
                }}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Psychology color="primary" />
                        Smart Scheduling Assistant
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                        {steps.map((label, index) => (
                            <Step key={label}>
                                <StepLabel icon={getStepIcon(index)}>
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    
                    {renderStepContent()}
                </DialogContent>
                
                <DialogActions>
                    <Button onClick={handleClose}>
                        Cancel
                    </Button>
                    
                    {activeStep > 0 && (
                        <Button 
                            onClick={() => setActiveStep(activeStep - 1)}
                            disabled={processing}
                        >
                            Back
                        </Button>
                    )}
                    
                    {activeStep === 3 && (
                        <Button
                            variant="contained"
                            onClick={handleFinalConfirmation}
                            disabled={processing}
                            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
                        >
                            {processing ? 'Creating...' : 'Create Appointment'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Conflict Resolution Dialog */}
            {conflictResolution && (
                <ConflictResolutionDialog
                    open={showConflictDialog}
                    onClose={() => setShowConflictDialog(false)}
                    conflictData={conflictResolution}
                    onResolve={handleConflictResolution}
                />
            )}

            {/* AI Insights Panel */}
            {aiResult && (
                <AIInsightsPanel
                    open={showInsights}
                    onClose={() => setShowInsights(false)}
                    data={aiResult}
                />
            )}
        </>
    );
};

export default SmartSchedulingWizard;
