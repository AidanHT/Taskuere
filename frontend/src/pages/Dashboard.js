import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    Chip,
    CircularProgress,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Event,
    CheckCircle,
    Schedule,
    PendingActions,
    MoreVert as MoreVertIcon,
    Done as DoneIcon,
    Cancel as CancelIcon,
    Groups,
    PlayCircleFilled,
} from '@mui/icons-material';
import { format, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// Using CSS transitions to avoid anime.js default export issues in build

const Dashboard = () => {
    useEffect(() => {
        const cards = Array.from(document.querySelectorAll('.stat-card'));
        cards.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            el.style.transition = `opacity 400ms ease ${i * 80}ms, transform 400ms ease ${i * 80}ms`;
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });
    }, []);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedAppointment, setSelectedAppointment] = React.useState(null);
    const [tabValue, setTabValue] = useState(0);

    // Fetch all appointments (both upcoming and past)
    const { data: appointments, isLoading } = useQuery(
        'all-appointments',
        async () => {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/appointments`
            );
            return response.data;
        }
    );

    // Update appointment status mutation
    const updateStatus = useMutation(
        async ({ id, status }) => {
            const response = await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/appointments/${id}/status`,
                { status }
            );
            return response.data;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries('all-appointments');
                toast.success('Appointment status updated');
                handleMenuClose();
            },
            onError: (error) => {
                toast.error(error.response?.data?.message || 'Failed to update status');
            },
        }
    );

    const now = new Date();
    const upcomingAppointments = appointments?.filter(apt =>
        isAfter(new Date(apt.startTime), now)
    ) || [];
    const pastAppointments = appointments?.filter(apt =>
        !isAfter(new Date(apt.startTime), now)
    ) || [];

    const stats = {
        total: appointments?.length || 0,
        upcoming: upcomingAppointments.filter(apt => apt.status === 'scheduled').length || 0,
        completed: appointments?.filter(apt => apt.status === 'completed').length || 0,
        pending: appointments?.filter(apt => apt.status === 'scheduled').length || 0,
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleMenuClick = (event, appointment) => {
        setAnchorEl(event.currentTarget);
        setSelectedAppointment(appointment);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedAppointment(null);
    };

    const handleStatusChange = (status) => {
        if (selectedAppointment) {
            updateStatus.mutate({
                id: selectedAppointment._id,
                status,
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            case 'scheduled':
                return 'info';
            default:
                return 'default';
        }
    };

    const renderAppointmentList = (appointmentsList) => (
        <List>
            {appointmentsList
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .map((appointment, index) => (
                    <React.Fragment key={appointment._id}>
                        {index > 0 && <Divider />}
                        <ListItem>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {appointment.title}
                                        <Chip
                                            size="small"
                                            label={appointment.status}
                                            color={getStatusColor(appointment.status)}
                                        />
                                    </Box>
                                }
                                secondary={
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            {format(
                                                new Date(appointment.startTime),
                                                'PPP p'
                                            )}
                                        </Typography>
                                        {appointment.location && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Location: {appointment.location}
                                            </Typography>
                                        )}
                                    </>
                                }
                                sx={{ cursor: 'pointer' }}
                                onClick={() => navigate('/calendar')}
                            />
                            <ListItemSecondaryAction>
                                <Tooltip title="Manage appointment">
                                    <IconButton
                                        edge="end"
                                        onClick={(e) => handleMenuClick(e, appointment)}
                                    >
                                        <MoreVertIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Open collaboration">
                                    <IconButton edge="end" onClick={() => navigate(`/collaboration/${appointment._id}`)}>
                                        <Schedule />
                                    </IconButton>
                                </Tooltip>
                            </ListItemSecondaryAction>
                        </ListItem>
                    </React.Fragment>
                ))}
            {appointmentsList.length === 0 && (
                <ListItem>
                    <ListItemText primary="No appointments found" />
                </ListItem>
            )}
        </List>
    );

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', borderRadius: 3, background: 'linear-gradient(180deg, rgba(45,70,185,0.06), rgba(245,0,87,0.04))' }}>
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box>
                        <Typography variant="h6" color="text.secondary">
                            {title}
                        </Typography>
                        <Typography variant="h4">{value}</Typography>
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}.light`,
                            borderRadius: '50%',
                            p: 1,
                            display: 'flex',
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3} className="stat-card">
                    <StatCard
                        title="Total Appointments"
                        value={stats.total}
                        icon={<Event sx={{ color: 'primary.main' }} />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} className="stat-card">
                    <StatCard
                        title="Upcoming"
                        value={stats.upcoming}
                        icon={<Schedule sx={{ color: 'info.main' }} />}
                        color="info"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} className="stat-card">
                    <StatCard
                        title="Completed"
                        value={stats.completed}
                        icon={<CheckCircle sx={{ color: 'success.main' }} />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3} className="stat-card">
                    <StatCard
                        title="Pending"
                        value={stats.pending}
                        icon={<PendingActions sx={{ color: 'warning.main' }} />}
                        color="warning"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Real-time Collaboration</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Meet with your team in a shared space: video, whiteboard, and live document editing.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <IconButton color="primary" onClick={() => navigate('/calendar')}>
                                <Groups />
                            </IconButton>
                            <IconButton color="secondary" onClick={() => navigate('/calendar?instantMeeting=true')}>
                                <PlayCircleFilled />
                            </IconButton>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>Start an Instant Meeting</Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Create a meeting for now with a custom duration and jump right in.
                        </Typography>
                        <Box>
                            <IconButton color="primary" onClick={() => navigate('/calendar?instantMeeting=true')}>
                                <PlayCircleFilled />
                            </IconButton>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container justifyContent="center">
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={tabValue} onChange={handleTabChange} centered>
                                <Tab label="Upcoming Appointments" />
                                <Tab label="Past Appointments" />
                            </Tabs>
                        </Box>
                        {tabValue === 0 ? (
                            renderAppointmentList(upcomingAppointments)
                        ) : (
                            renderAppointmentList(pastAppointments)
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Status Update Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleStatusChange('completed')}>
                    <DoneIcon sx={{ mr: 1, color: 'success.main' }} />
                    Mark as Completed
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('cancelled')}>
                    <CancelIcon sx={{ mr: 1, color: 'error.main' }} />
                    Cancel Appointment
                </MenuItem>
                <MenuItem onClick={() => handleStatusChange('scheduled')}>
                    <Schedule sx={{ mr: 1, color: 'info.main' }} />
                    Mark as Scheduled
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default Dashboard; 