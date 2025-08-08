import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    RadioGroup,
    FormControlLabel,
    Radio,
    Box,
    Chip,
    Alert,
    Card,
    CardContent,
    Divider,
} from '@mui/material';
import {
    Warning,
    Schedule,
    CheckCircle,
    Error,
    AccessTime,
    EventBusy,
    Lightbulb,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const ConflictResolutionDialog = ({ open, onClose, conflictData, onResolve }) => {
    const [selectedResolution, setSelectedResolution] = useState(0);
    const [processing, setProcessing] = useState(false);

    if (!conflictData) return null;

    const { conflicts, suggestedResolutions, aiReasoning } = conflictData;

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'low': return 'info';
            case 'medium': return 'warning';
            case 'high': return 'error';
            case 'critical': return 'error';
            default: return 'info';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'low': return <CheckCircle />;
            case 'medium': return <Warning />;
            case 'high': return <Error />;
            case 'critical': return <EventBusy />;
            default: return <Schedule />;
        }
    };

    const getResolutionTypeIcon = (type) => {
        switch (type) {
            case 'reschedule': return <Schedule />;
            case 'shorten': return <AccessTime />;
            case 'move_other': return <EventBusy />;
            case 'decline': return <Error />;
            case 'accept_anyway': return <CheckCircle />;
            default: return <Lightbulb />;
        }
    };

    const handleResolve = async () => {
        setProcessing(true);
        try {
            await onResolve(selectedResolution);
            onClose();
        } catch (error) {
            console.error('Failed to resolve conflict:', error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" />
                    Scheduling Conflicts Detected
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {/* AI Reasoning */}
                {aiReasoning && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <strong>AI Analysis:</strong> {aiReasoning}
                    </Alert>
                )}

                {/* Conflicts List */}
                <Typography variant="h6" gutterBottom>
                    Detected Conflicts
                </Typography>
                <List dense>
                    {conflicts.map((conflict, index) => (
                        <ListItem key={index}>
                            <ListItemIcon>
                                {getSeverityIcon(conflict.severity)}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1">
                                            {conflict.description}
                                        </Typography>
                                        <Chip
                                            label={conflict.severity}
                                            color={getSeverityColor(conflict.severity)}
                                            size="small"
                                        />
                                    </Box>
                                }
                                secondary={conflict.impact}
                            />
                        </ListItem>
                    ))}
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Resolution Options */}
                <Typography variant="h6" gutterBottom>
                    Suggested Resolutions
                </Typography>
                
                <RadioGroup
                    value={selectedResolution}
                    onChange={(e) => setSelectedResolution(parseInt(e.target.value))}
                >
                    {suggestedResolutions.map((resolution, index) => (
                        <FormControlLabel
                            key={index}
                            value={index}
                            control={<Radio />}
                            label={
                                <Card sx={{ width: '100%', ml: 1 }} variant="outlined">
                                    <CardContent sx={{ py: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            {getResolutionTypeIcon(resolution.type)}
                                            <Typography variant="subtitle1" sx={{ ml: 1, flexGrow: 1 }}>
                                                {resolution.type.replace('_', ' ').toUpperCase()}
                                            </Typography>
                                            <Chip
                                                label={`${Math.round(resolution.confidence * 100)}% confident`}
                                                color={resolution.confidence > 0.8 ? 'success' : 'warning'}
                                                size="small"
                                            />
                                        </Box>
                                        
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            {resolution.reason}
                                        </Typography>

                                        {resolution.newTimeSlot && (
                                            <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                                                <strong>New Time:</strong> {format(parseISO(resolution.newTimeSlot.startTime), 'PPP p')} - {format(parseISO(resolution.newTimeSlot.endTime), 'p')}
                                            </Typography>
                                        )}

                                        {resolution.pros && resolution.pros.length > 0 && (
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="caption" color="success.main">
                                                    <strong>Pros:</strong>
                                                </Typography>
                                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                    {resolution.pros.map((pro, i) => (
                                                        <li key={i}>
                                                            <Typography variant="caption" color="success.main">
                                                                {pro}
                                                            </Typography>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Box>
                                        )}

                                        {resolution.cons && resolution.cons.length > 0 && (
                                            <Box>
                                                <Typography variant="caption" color="error.main">
                                                    <strong>Cons:</strong>
                                                </Typography>
                                                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                                    {resolution.cons.map((con, i) => (
                                                        <li key={i}>
                                                            <Typography variant="caption" color="error.main">
                                                                {con}
                                                            </Typography>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            }
                            sx={{ alignItems: 'flex-start', mb: 1 }}
                        />
                    ))}
                </RadioGroup>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button
                    onClick={handleResolve}
                    variant="contained"
                    disabled={processing || selectedResolution === null}
                >
                    {processing ? 'Applying...' : 'Apply Resolution'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConflictResolutionDialog;
