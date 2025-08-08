import React, { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    Chip,
    Button,
    Card,
    CardContent,
    Grid,
    Alert,
    Divider,
} from '@mui/material';
import {
    ExpandMore,
    Psychology,
    TrendingUp,
    Schedule,
    Event,
    AccessTime,
    Groups,
    Lightbulb,
    Analytics,
    AutoFixHigh,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const AIInsightsPanel = ({ 
    aiData, 
    userPatterns, 
    suggestions, 
    onAcceptSuggestion,
    showPatterns = true,
    showSuggestions = true 
}) => {
    const [expandedPanels, setExpandedPanels] = useState({
        patterns: false,
        suggestions: false,
        insights: true
    });

    if (!aiData && !userPatterns && !suggestions) {
        return (
            <Paper sx={{ p: 3 }}>
                <Typography color="text.secondary">
                    No AI insights available yet. Schedule some appointments to see personalized recommendations!
                </Typography>
            </Paper>
        );
    }

    const handlePanelChange = (panel) => (event, isExpanded) => {
        setExpandedPanels(prev => ({
            ...prev,
            [panel]: isExpanded
        }));
    };

    // confidence UI removed

    return (
        <Paper elevation={2} sx={{ mt: 2 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Psychology color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">AI Insights & Recommendations</Typography>
            </Box>

            {/* AI Processing Results */}
            {aiData && (
                <Accordion 
                    expanded={expandedPanels.insights} 
                    onChange={handlePanelChange('insights')}
                    defaultExpanded
                >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Analytics />
                            <Typography variant="subtitle1">Processing Results</Typography>
                {/* confidence chip removed */}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {/* Parsed Intent */}
                            {aiData.intent && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                <Event sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                Understood Request
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Title:</strong> {aiData.intent.title}
                                            </Typography>
                                            {aiData.intent.datetime && (
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Time:</strong> {format(parseISO(aiData.intent.datetime), 'PPP p')}
                                                </Typography>
                                            )}
                                            {aiData.intent.duration && (
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Duration:</strong> {aiData.intent.duration} minutes
                                                </Typography>
                                            )}
                                            {aiData.intent.type && (
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Type:</strong> {aiData.intent.type}
                                                </Typography>
                                            )}
                                            {aiData.intent.location && (
                                                <Typography variant="body2">
                                                    <strong>Location:</strong> {aiData.intent.location}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Ambiguities & Suggestions */}
                            {(aiData.ambiguities || aiData.suggestions) && (
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            {aiData.ambiguities && aiData.ambiguities.length > 0 && (
                                                <>
                                                    <Typography variant="subtitle2" gutterBottom color="warning.main">
                                                        <AutoFixHigh sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                        Clarifications Needed
                                                    </Typography>
                                                    <List dense>
                                                        {aiData.ambiguities.map((ambiguity, index) => (
                                                            <ListItem key={index} disablePadding>
                                                                <ListItemText 
                                                                    primary={ambiguity}
                                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </>
                                            )}

                                            {aiData.suggestions && aiData.suggestions.length > 0 && (
                                                <>
                                                    {aiData.ambiguities && aiData.ambiguities.length > 0 && <Divider sx={{ my: 1 }} />}
                                                    <Typography variant="subtitle2" gutterBottom color="info.main">
                                                        <Lightbulb sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                        AI Suggestions
                                                    </Typography>
                                                    <List dense>
                                                        {aiData.suggestions.map((suggestion, index) => (
                                                            <ListItem key={index} disablePadding>
                                                                <ListItemText 
                                                                    primary={suggestion}
                                                                    primaryTypographyProps={{ variant: 'body2' }}
                                                                />
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* User Patterns */}
            {showPatterns && userPatterns && (
                <Accordion 
                    expanded={expandedPanels.patterns} 
                    onChange={handlePanelChange('patterns')}
                >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUp />
                            <Typography variant="subtitle1">Your Scheduling Patterns</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {/* Common Meeting Types */}
                            {userPatterns.meetingTypes && userPatterns.meetingTypes.length > 0 && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        <Event sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                        Common Meeting Types
                                    </Typography>
                                    <List dense>
                                        {userPatterns.meetingTypes.slice(0, 5).map((type, index) => (
                                            <ListItem key={index} disablePadding>
                                                <ListItemText 
                                                    primary={type.type}
                                                    secondary={`${type.frequency} times, avg ${type.avgDuration}min`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            )}

                            {/* Preferred Time Slots */}
                            {userPatterns.preferredTimeSlots && userPatterns.preferredTimeSlots.length > 0 && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                        Preferred Times
                                    </Typography>
                                    <List dense>
                                        {userPatterns.preferredTimeSlots
                                            .sort((a, b) => b.frequency - a.frequency)
                                            .slice(0, 5)
                                            .map((slot, index) => {
                                                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                                return (
                                                    <ListItem key={index} disablePadding>
                                                        <ListItemText 
                                                            primary={`${days[slot.dayOfWeek]} ${slot.hour}:00`}
                                                            secondary={`${slot.frequency} times`}
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                    </List>
                                </Grid>
                            )}

                            {/* Common Titles */}
                            {userPatterns.commonMeetingTitles && userPatterns.commonMeetingTitles.length > 0 && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        <Groups sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                        Common Titles
                                    </Typography>
                                    <List dense>
                                        {userPatterns.commonMeetingTitles.slice(0, 5).map((title, index) => (
                                            <ListItem key={index} disablePadding>
                                                <ListItemText 
                                                    primary={title.title}
                                                    secondary={`${title.frequency} times`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                            )}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Time Slot Suggestions */}
            {showSuggestions && suggestions && suggestions.suggestions && suggestions.suggestions.length > 0 && (
                <Accordion 
                    expanded={expandedPanels.suggestions} 
                    onChange={handlePanelChange('suggestions')}
                >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule />
                            <Typography variant="subtitle1">
                                Suggested Time Slots ({suggestions.suggestions.length})
                            </Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        {suggestions.reasoning && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <strong>AI Strategy:</strong> {suggestions.reasoning}
                            </Alert>
                        )}
                        
                        <Grid container spacing={2}>
                            {suggestions.suggestions.map((suggestion, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <Card 
                                        variant="outlined"
                                        sx={{ 
                                            cursor: onAcceptSuggestion ? 'pointer' : 'default',
                                            '&:hover': onAcceptSuggestion ? { boxShadow: 3 } : {}
                                        }}
                                        onClick={() => onAcceptSuggestion?.(suggestion)}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2">
                                                    {format(parseISO(suggestion.startTime), 'PPP')}
                                                </Typography>
                                                {/* confidence chip removed */}
                                            </Box>
                                            
                                            <Typography variant="body1" sx={{ mb: 1 }}>
                                                {format(parseISO(suggestion.startTime), 'p')} - {format(parseISO(suggestion.endTime), 'p')}
                                            </Typography>
                                            
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {suggestion.reason}
                                            </Typography>

                                            {suggestion.conflictLevel !== 'none' && (
                                                <Chip 
                                                    label={`${suggestion.conflictLevel} conflict risk`}
                                                    color={suggestion.conflictLevel === 'low' ? 'warning' : 'error'}
                                                    size="small"
                                                    sx={{ mt: 1 }}
                                                />
                                            )}

                                            {onAcceptSuggestion && (
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ mt: 1 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAcceptSuggestion(suggestion);
                                                    }}
                                                >
                                                    Select This Time
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            )}
        </Paper>
    );
};

export default AIInsightsPanel;
