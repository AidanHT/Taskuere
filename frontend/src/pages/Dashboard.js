import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
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
    Button,
    LinearProgress,
    alpha,
    useTheme,
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
    TrendingUp,
    Insights,
    CalendarToday,
    Timer,
    VideoCall,
    Analytics,
    PersonAdd,
    Notifications,
} from '@mui/icons-material';
import { format, isAfter, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
// Using CSS transitions to avoid anime.js default export issues in build

const Dashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedAppointment, setSelectedAppointment] = React.useState(null);
    const [tabValue, setTabValue] = useState(0);
    // Removed mock weekly data; now driven by backend `/api/stats/dashboard`

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
    const upcomingAppointments = appointments?.filter(apt => isAfter(new Date(apt.startTime), now)) || [];
    const pastAppointments = appointments?.filter(apt => !isAfter(new Date(apt.startTime), now)) || [];

    // Fetch dynamic dashboard stats
    const { data: dashboardStats } = useQuery('dashboard-stats', async () => {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/stats/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.data?.data;
    });

    const stats = {
        total: dashboardStats?.totals?.total ?? 0,
        upcoming: dashboardStats?.totals?.upcoming ?? 0,
        completed: dashboardStats?.totals?.completed ?? 0,
        pending: dashboardStats?.totals?.pending ?? 0,
        teamMembers: dashboardStats?.teamMembers ?? 0,
        trends: dashboardStats?.trends ?? { total: 0, upcoming: 0, completed: 0, teamMembers: 0 },
        weeklyActivity: dashboardStats?.weeklyActivity ?? [],
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

    // Enhanced StatCard with modern animations and gradients
    const StatCard = ({ title, value, icon, color, gradient, trend, trendValue, delay = 0 }) => (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
            className="stat-card"
        >
            <Card
                sx={{
                    height: '100%',
                    background: gradient || theme.customGradients.cardGlass,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: theme.customShadows.glow,
                        '& .stat-icon': {
                            transform: 'scale(1.1) rotate(5deg)',
                        },
                        '& .trend-indicator': {
                            transform: 'translateX(4px)',
                        },
                    },
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: gradient || theme.customGradients.primary,
                    },
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {title}
                            </Typography>
                            <Typography 
                                variant="h3" 
                                sx={{ 
                                    fontWeight: 800,
                                    background: gradient || theme.customGradients.primary,
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                    mt: 0.5,
                                }}
                            >
                                {value}
                            </Typography>
                        </Box>
                        <Box
                            className="stat-icon"
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: '20px',
                                background: gradient || theme.customGradients.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: theme.customShadows.md,
                                '& .MuiSvgIcon-root': {
                                    fontSize: '2rem',
                                    color: 'white',
                                },
                            }}
                        >
                            {icon}
                        </Box>
                    </Box>
                    
                    {/* Trend Indicator */}
                    <Box 
                        className="trend-indicator"
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <TrendingUp 
                            sx={{ 
                                fontSize: '1rem',
                                color: theme.palette.success.main,
                                mr: 0.5,
                            }} 
                        />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: theme.palette.success.main,
                                fontWeight: 600,
                                mr: 1,
                            }}
                        >
                            +{trendValue || '12'}%
                        </Typography>
                        <Typography 
                            variant="body2" 
                            sx={{ color: theme.palette.text.secondary }}
                        >
                            from last week
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );

    // Mini Chart Component for Weekly Activity
    const WeeklyChart = () => (
        <Card
            sx={{
                background: theme.customGradients.cardGlass,
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                overflow: 'hidden',
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    Weekly Activity
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', height: 120 }}>
                    {(stats.weeklyActivity || []).map((day, index) => (
                        <Box key={day.day} sx={{ textAlign: 'center', flex: 1 }}>
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: `${Math.min(100, Math.max(0, day.completion || 0))}%`, opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.6, ease: 'easeOut' }}
                                style={{
                                    background: theme.customGradients.primary,
                                    borderRadius: '8px 8px 0 0',
                                    marginBottom: 8,
                                    minHeight: 20,
                                    maxHeight: 80,
                                }}
                            />
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {day.day}
                            </Typography>
                        </Box>
                    ))}
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
        <Box sx={{ minHeight: '100vh' }}>
            {/* Enhanced Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <Box sx={{ mb: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Typography 
                                variant="h2" 
                                sx={{ 
                                    fontWeight: 800,
                                    background: theme.customGradients.primary,
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    color: 'transparent',
                                    mb: 1,
                                }}
                            >
                                Welcome Back! 👋
                            </Typography>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: theme.palette.text.secondary,
                                    fontWeight: 400,
                                }}
                            >
                                Here's what's happening with your schedule today
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<CalendarToday />}
                                onClick={() => navigate('/calendar')}
                                sx={{
                                    borderRadius: '16px',
                                    px: 3,
                                    py: 1.5,
                                }}
                            >
                                View Calendar
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<VideoCall />}
                                onClick={() => navigate('/calendar?instantMeeting=true')}
                                sx={{
                                    borderRadius: '16px',
                                    px: 3,
                                    py: 1.5,
                                    background: theme.customGradients.primary,
                                }}
                            >
                                Start Meeting
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </motion.div>

            {/* Enhanced Stats Grid */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Total Meetings"
                        value={stats.total}
                        icon={<Event />}
                        gradient={theme.customGradients.primary}
                        trendValue={String(stats.trends.total)}
                        delay={0.1}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Upcoming Events"
                        value={stats.upcoming}
                        icon={<Schedule />}
                        gradient={theme.customGradients.accent}
                        trendValue={String(stats.trends.upcoming)}
                        delay={0.2}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Completed Today"
                        value={stats.completed}
                        icon={<CheckCircle />}
                        gradient={theme.customGradients.success}
                        trendValue={String(stats.trends.completed)}
                        delay={0.3}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <StatCard
                        title="Team Members"
                        value={stats.teamMembers}
                        icon={<Groups />}
                        gradient={theme.customGradients.secondary}
                        trendValue={String(stats.trends.teamMembers)}
                        delay={0.4}
                    />
                </Grid>
            </Grid>

            {/* Enhanced Feature Cards Grid */}
            <Grid container spacing={4} sx={{ mb: 6 }}>
                <Grid item xs={12} md={8}>
                    <WeeklyChart />
                </Grid>
                <Grid item xs={12} md={4}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <Card
                            sx={{
                                height: '100%',
                                background: theme.customGradients.cardGlass,
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '24px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: theme.customGradients.warning,
                                }}
                            />
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                    Quick Actions
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<PlayCircleFilled />}
                                        onClick={() => navigate('/calendar?instantMeeting=true')}
                                        sx={{
                                            py: 2,
                                            borderRadius: '16px',
                                            background: theme.customGradients.primary,
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: theme.customShadows.lg,
                                            },
                                        }}
                                    >
                                        Start Instant Meeting
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<PersonAdd />}
                                        onClick={() => navigate('/calendar')}
                                        sx={{
                                            py: 2,
                                            borderRadius: '16px',
                                            borderWidth: '2px',
                                            '&:hover': {
                                                borderWidth: '2px',
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        Schedule Meeting
                                    </Button>
                                    <Button
                                        variant="text"
                                        fullWidth
                                        startIcon={<Analytics />}
                                        onClick={() => navigate('/ai-assistant')}
                                        sx={{
                                            py: 2,
                                            borderRadius: '16px',
                                            color: theme.palette.text.primary,
                                            '&:hover': {
                                                background: alpha(theme.palette.primary.main, 0.08),
                                                transform: 'translateY(-2px)',
                                            },
                                        }}
                                    >
                                        AI Insights
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>

            {/* Enhanced Appointments Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
            >
                <Grid container spacing={4}>
                    <Grid item xs={12}>
                        <Card
                            sx={{
                                background: theme.customGradients.cardGlass,
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '24px',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    p: 3,
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: theme.customGradients.glass,
                                }}
                            >
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        fontWeight: 700,
                                        background: theme.customGradients.primary,
                                        WebkitBackgroundClip: 'text',
                                        backgroundClip: 'text',
                                        color: 'transparent',
                                    }}
                                >
                                    Recent Activity
                                </Typography>
                            </Box>
                            <Box sx={{ p: 0 }}>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleTabChange}
                                    sx={{ 
                                        px: 3,
                                        '& .MuiTabs-indicator': {
                                            background: theme.customGradients.primary,
                                            height: '3px',
                                            borderRadius: '3px',
                                        },
                                    }}
                                >
                                    <Tab 
                                        label="Upcoming Meetings" 
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                        }}
                                    />
                                    <Tab 
                                        label="Past Meetings" 
                                        sx={{
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                        }}
                                    />
                                </Tabs>
                                <Box sx={{ p: 3 }}>
                                    {tabValue === 0 ? (
                                        renderAppointmentList(upcomingAppointments)
                                    ) : (
                                        renderAppointmentList(pastAppointments)
                                    )}
                                </Box>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </motion.div>

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