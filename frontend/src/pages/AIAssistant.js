import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import {
    Box,
    Typography,
    Container,
    Grid,
    Paper,
    Button,
    Card,
    CardContent,
    CardActions,
    Switch,
    FormControlLabel,
    Fab,
    Alert,
    Skeleton,
} from '@mui/material';
import {
    Psychology,
    AutoFixHigh,
    Schedule,
    TrendingUp,
    Settings,
    Add,
    CheckCircle,
    Warning,
    Info,
} from '@mui/icons-material';
import { useMutation, useQuery } from 'react-query';
import NaturalLanguageInput from '../components/NaturalLanguageInput';
import SmartSchedulingWizard from '../components/SmartSchedulingWizard';
import AIInsightsPanel from '../components/AIInsightsPanel';
import aiAssistantService from '../services/aiAssistantService';
import toast from 'react-hot-toast';

const AIAssistant = () => {
    const [wizardOpen, setWizardOpen] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const queryClient = useQueryClient();

    // Fetch AI settings
    const { isLoading: settingsLoading } = useQuery(
        'aiSettings',
        () => aiAssistantService.getSettings(),
        {
            onSuccess: (data) => {
                if (data.success) {
                    setAiEnabled(data.data.enabled);
                }
            },
            onError: (error) => {
                console.error('Failed to load AI settings:', error);
            }
        }
    );

    // Fetch conflict history for insights
    const { data: conflictHistory } = useQuery(
        'conflictHistory',
        () => aiAssistantService.getConflictHistory(1, 5),
        {
            enabled: aiEnabled,
            onError: (error) => {
                console.error('Failed to load conflict history:', error);
            }
        }
    );

    // Update AI settings mutation
    const updateSettingsMutation = useMutation(
        (settings) => aiAssistantService.updateSettings(settings),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('aiSettings');
                toast.success('AI settings updated successfully');
            },
            onError: (error) => {
                toast.error(error.message || 'Failed to update AI settings');
            }
        }
    );

    const handleAIToggle = (event) => {
        const enabled = event.target.checked;
        setAiEnabled(enabled);
        updateSettingsMutation.mutate({ enabled });
    };

    const handleSchedulingResult = (result) => {
        if (result.success) {
            // Add to recent activity
            setRecentActivity(prev => [
                {
                    id: Date.now(),
                    type: result.stage,
                    message: result.message,
                    timestamp: new Date(),
                    confidence: result.data?.parsedIntent?.confidence
                },
                ...prev.slice(0, 4) // Keep only last 5 items
            ]);

            if (result.stage === 'ready') {
                toast.success('Appointment suggestion ready!');
            } else if (result.stage === 'conflicts') {
                toast('Conflicts detected - please review options', { icon: '⚠️' });
            } else if (result.stage === 'suggestions') {
                toast('Time slot suggestions generated', { icon: 'ℹ️' });
            }
        }
    };

    const handleSchedulingError = (error) => {
        setRecentActivity(prev => [
            {
                id: Date.now(),
                type: 'error',
                message: error,
                timestamp: new Date()
            },
            ...prev.slice(0, 4)
        ]);
    };

    const handleWizardSuccess = (appointment) => {
        setWizardOpen(false);
        queryClient.invalidateQueries('appointments');
        toast.success(`Appointment "${appointment.title}" created successfully!`);
        
        // Add to recent activity
        setRecentActivity(prev => [
            {
                id: Date.now(),
                type: 'success',
                message: `Created appointment: ${appointment.title}`,
                timestamp: new Date()
            },
            ...prev.slice(0, 4)
        ]);
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'ready': return <CheckCircle color="success" />;
            case 'conflicts': return <Warning color="warning" />;
            case 'suggestions': return <Schedule color="info" />;
            case 'error': return <Warning color="error" />;
            case 'success': return <CheckCircle color="success" />;
            default: return <Info color="info" />;
        }
    };

    if (settingsLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Skeleton variant="rectangular" height={400} />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Psychology fontSize="large" color="primary" />
                        <Typography variant="h4" component="h1">
                            AI Scheduling Assistant
                        </Typography>
                    </Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={aiEnabled}
                                onChange={handleAIToggle}
                                disabled={updateSettingsMutation.isLoading}
                            />
                        }
                        label="AI Assistant Enabled"
                    />
                </Box>
                <Typography variant="body1" color="text.secondary">
                    Let AI help you schedule meetings and appointments using natural language.
                    Just describe what you want to schedule, and I'll handle the rest!
                </Typography>
            </Box>

            {!aiEnabled && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    AI Assistant is currently disabled. Enable it to start using intelligent scheduling features.
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Main Input Section */}
                <Grid item xs={12} lg={8}>
                    <NaturalLanguageInput
                        onResult={handleSchedulingResult}
                        onError={handleSchedulingError}
                        disabled={!aiEnabled}
                        showSuggestions={true}
                        placeholder="Try: 'Schedule a team meeting tomorrow at 2 PM' or 'Book a 30-minute call with John next Tuesday'"
                    />

                    {/* AI Insights */}
                    <AIInsightsPanel
                        userPatterns={conflictHistory?.data?.conflicts?.[0]?.userPatterns}
                        showPatterns={true}
                        showSuggestions={false}
                    />
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} lg={4}>
                    {/* Quick Actions */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <AutoFixHigh sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setWizardOpen(true)}
                                disabled={!aiEnabled}
                                fullWidth
                            >
                                Smart Scheduling Wizard
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Schedule />}
                                disabled={!aiEnabled}
                                fullWidth
                                onClick={() => {
                                    // Trigger time suggestion flow
                                    const sampleInput = "Schedule a meeting next week";
                                    aiAssistantService.processSchedulingRequest(sampleInput)
                                        .then(handleSchedulingResult)
                                        .catch(handleSchedulingError);
                                }}
                            >
                                Suggest Meeting Times
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Settings />}
                                disabled
                                fullWidth
                            >
                                AI Settings (Coming Soon)
                            </Button>
                        </Box>
                    </Paper>

                    {/* Recent Activity */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Recent Activity
                        </Typography>
                        {recentActivity.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No recent AI assistant activity
                            </Typography>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {recentActivity.map((activity) => (
                                    <Card key={activity.id} variant="outlined" size="small">
                                        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {getActivityIcon(activity.type)}
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="body2">
                                                        {activity.message}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {activity.timestamp.toLocaleTimeString()}
                                                    </Typography>
                                                </Box>
                                                {activity.confidence && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {Math.round(activity.confidence * 100)}%
                                                    </Typography>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        )}
                    </Paper>

                    {/* Stats Card */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                AI Performance
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Requests Processed:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {recentActivity.length}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Success Rate:</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                        {recentActivity.length > 0 
                                            ? Math.round((recentActivity.filter(a => a.type !== 'error').length / recentActivity.length) * 100)
                                            : 0}%
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Conflicts Resolved:</Typography>
                                    <Typography variant="body2" fontWeight="bold">
                                        {recentActivity.filter(a => a.type === 'conflicts').length}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                        <CardActions>
                            <Button size="small" disabled>
                                View Detailed Analytics
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>

            {/* Floating Action Button */}
            <Fab
                color="primary"
                aria-label="open smart scheduling wizard"
                sx={{ position: 'fixed', bottom: 16, right: 16 }}
                onClick={() => setWizardOpen(true)}
                disabled={!aiEnabled}
            >
                <AutoFixHigh />
            </Fab>

            {/* Smart Scheduling Wizard */}
            <SmartSchedulingWizard
                open={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onScheduleCreated={handleWizardSuccess}
            />
        </Container>
    );
};

export default AIAssistant;
