import React, { useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Paper,
    Avatar,
    Grid,
    Card,
    CardContent,
    useTheme,
    alpha,
    IconButton,
    Divider,
} from '@mui/material';
import {
    LockOutlined,
    CalendarMonth,
    NotificationsActive,
    Security,
    Speed,
    DeviceHub,
    GroupAdd,
    KeyboardArrowDown,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { keyframes } from '@mui/system';
import HeroCanvas from '../components/HeroCanvas';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shine = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`;

const validationSchema = Yup.object({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

const features = [
    {
        icon: <CalendarMonth fontSize="large" />,
        title: 'Smart Scheduling',
        description: 'Intelligent calendar management with intuitive scheduling interface',
        gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
    },
    {
        icon: <NotificationsActive fontSize="large" />,
        title: 'Real-time Notifications',
        description: 'Stay updated with instant notifications and reminders',
        gradient: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    },
    {
        icon: <Security fontSize="large" />,
        title: 'Secure Access',
        description: 'Role-based access control with enterprise-grade security',
        gradient: 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
    },
    {
        icon: <Speed fontSize="large" />,
        title: 'Fast & Responsive',
        description: 'Lightning-fast performance with mobile-first design',
        gradient: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
    },
    {
        icon: <DeviceHub fontSize="large" />,
        title: 'Integration Ready',
        description: 'Seamless integration with Google Calendar and other platforms',
        gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    },
    {
        icon: <GroupAdd fontSize="large" />,
        title: 'Team Management',
        description: 'Efficient team coordination and resource management',
        gradient: 'linear-gradient(135deg, #F761A1 0%, #8C1BAB 100%)',
    },
];

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const theme = useTheme();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
        // Hero elements
        const title = document.querySelector('.hero-title');
        const subtitle = document.querySelector('.hero-subtitle');
        const cta = document.querySelector('.hero-cta');
        [title, subtitle, cta].forEach((el, i) => {
            if (!el) return;
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px) scale(0.98)';
            el.style.transition = `opacity 700ms ${ease} ${i * 120}ms, transform 700ms ${ease} ${i * 120}ms`;
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Feature cards stagger
        const cards = Array.from(document.querySelectorAll('.feature-card'));
        cards.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(16px)';
            el.style.transition = `opacity 700ms ${ease} ${200 + i * 90}ms, transform 700ms ${ease} ${200 + i * 90}ms`;
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            });
        });
    }, []);

    // Progressive enhancement if anime.js v3 is available
    useEffect(() => {
        try {
            // eslint-disable-next-line global-require
            const anime = require('animejs');
            if (anime && anime.timeline) {
                anime.timeline()
                    .add({ targets: '.feature-card', opacity: [0, 1], translateY: [12, 0], delay: anime.stagger(80, { start: 200 }), easing: 'easeOutQuad', duration: 600 });
            }
        } catch (_) {
            // not installed or SSR, ignore
        }
    }, []);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const result = await login(values.email, values.password);
                if (result.success) {
                    toast.success('Login successful!');
                    const from = location.state?.from?.pathname || '/';
                    navigate(from);
                } else {
                    toast.error(result.error);
                }
            } catch (error) {
                toast.error('An error occurred during login');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const scrollToFeatures = () => {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Box sx={{ overflow: 'hidden' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: theme.customGradients.primary,
                    color: 'white',
                    py: 15,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                        animation: `${pulse} 10s ease-in-out infinite`,
                    },
                }}
            >
                <HeroCanvas />
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center', position: 'relative' }}>
                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: { xs: '3rem', md: '5rem' },
                                fontWeight: 800,
                                mb: 2,
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 40%, rgba(245,0,87,0.9) 100%)',
                                backgroundSize: '200% auto',
                                color: 'transparent',
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                animation: `${shine} 5s linear infinite`,
                                position: 'relative',
                                zIndex: 1,
                            }}
                            className="hero-title"
                        >
                            Taskuere
                        </Typography>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: '1.5rem', md: '2.5rem' },
                                mb: 4,
                                color: alpha('#fff', 0.95),
                                fontWeight: 600,
                                position: 'relative',
                                zIndex: 1,
                            }}
                            className="hero-subtitle"
                        >
                            AI Scheduling and Real-Time Collaboration — Supercharged
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            component={RouterLink}
                            to="/register"
                            sx={{
                                backgroundColor: 'white',
                                color: theme.palette.primary.main,
                                '&:hover': {
                                    backgroundColor: alpha('#fff', 0.9),
                                    transform: 'translateY(-4px)',
                                },
                                px: 6,
                                py: 2,
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                position: 'relative',
                                zIndex: 1,
                            }}
                            className="hero-cta"
                        >
                            Get Started
                        </Button>
                        <IconButton
                            onClick={scrollToFeatures}
                            sx={{
                                position: 'absolute',
                                bottom: -90,
                                left: '47%',
                                transform: 'translate(-50%, 0)',
                                color: 'white',
                                animation: `${float} 2s ease-in-out infinite`,
                                width: 48,
                                height: 48,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(4px)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                },
                                zIndex: 1,
                            }}
                        >
                            <KeyboardArrowDown fontSize="large" />
                        </IconButton>
                    </Box>
                </Container>
            </Box>

            {/* Features Section (expanded to highlight AI Assistant and Collaboration) */}
            <Box
                id="features"
                sx={{
                    py: 12,
                    background: 'linear-gradient(180deg, #F8F9FE 0%, #FFFFFF 100%)',
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h3"
                        align="center"
                        sx={{
                            mb: 8,
                            fontWeight: 800,
                            background: 'linear-gradient(to right, #2D46B9, #F50057)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                            textAlign: 'center',
                        }}
                    >
                        Why Choose Taskuere?
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((feature, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    className="feature-card"
                                    sx={{
                                        height: '100%',
                                        background: '#ffffff',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                        transition: 'all 0.3s ease-in-out',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        opacity: 0,
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: feature.gradient,
                                            opacity: 0.05,
                                            transition: 'opacity 0.3s ease-in-out',
                                        },
                                        '&:hover': {
                                            transform: 'translateY(-8px) scale(1.02)',
                                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
                                            '&::before': {
                                                opacity: 0.1,
                                            },
                                            '& .feature-icon': {
                                                transform: 'scale(1.1) rotate(5deg)',
                                            },
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                        <Box
                                            className="feature-icon"
                                            sx={{
                                                background: feature.gradient,
                                                borderRadius: '50%',
                                                width: 80,
                                                height: 80,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 24px',
                                                transition: 'transform 0.3s ease-in-out',
                                                color: 'white',
                                            }}
                                        >
                                            {feature.icon}
                                        </Box>
                                        <Typography
                                            variant="h5"
                                            component="h2"
                                            sx={{
                                                mb: 2,
                                                fontWeight: 700,
                                                background: feature.gradient,
                                                WebkitBackgroundClip: 'text',
                                                backgroundClip: 'text',
                                                color: 'transparent',
                                            }}
                                        >
                                            {feature.title}
                                        </Typography>
                                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                            {feature.description}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                        {/* AI Scheduler Highlight */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 4 }}>
                                <CardContent>
                                    <Grid container spacing={3} alignItems="center">
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                                                Meet your AI Scheduling Assistant
                                            </Typography>
                                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                                Describe your meeting in plain language and get smart time suggestions, conflict detection, and one-click scheduling.
                                            </Typography>
                                            <Button variant="contained" size="large" component={RouterLink} to="/ai-assistant">
                                                Try the Assistant
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ position: 'relative', height: 220, borderRadius: 2, overflow: 'hidden', background: 'linear-gradient(135deg, #eef2ff, #fff0f6)' }}>
                                                <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 30%, rgba(102,126,234,0.2), transparent 40%), radial-gradient(circle at 70% 70%, rgba(245,0,87,0.15), transparent 40%)' }} />
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Collaboration Highlight */}
                        <Grid item xs={12}>
                            <Card sx={{ p: 4 }}>
                                <CardContent>
                                    <Grid container spacing={3} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ position: 'relative', height: 220, borderRadius: 2, overflow: 'hidden', background: 'linear-gradient(135deg, #f0fff4, #f0f5ff)' }}>
                                                <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 30%, rgba(16,185,129,0.2), transparent 40%), radial-gradient(circle at 30% 70%, rgba(59,130,246,0.15), transparent 40%)' }} />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                                                Real-Time Collaboration Suite
                                            </Typography>
                                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                                Video conferencing, shared documents, and a collaborative whiteboard — all in one workspace.
                                            </Typography>
                                            <Button variant="outlined" size="large" component={RouterLink} to="/calendar">
                                                Start a Meeting
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* Login Section */}
            <Box
                sx={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FE 100%)',
                    py: 12,
                }}
            >
                <Container component="main" maxWidth="xs">
                    <Paper
                        elevation={24}
                        sx={{
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: theme.customGradients.card,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid',
                            borderColor: alpha('#fff', 0.2),
                        }}
                    >
                        <Avatar
                            sx={{
                                m: 1,
                                width: 56,
                                height: 56,
                                background: theme.customGradients.primary,
                            }}
                        >
                            <LockOutlined />
                        </Avatar>
                        <Typography
                            component="h1"
                            variant="h4"
                            sx={{
                                mb: 4,
                                fontWeight: 700,
                                background: theme.customGradients.primary,
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                            }}
                        >
                            Sign in to your account
                        </Typography>
                        <Box
                            component="form"
                            onSubmit={formik.handleSubmit}
                            sx={{ width: '100%' }}
                        >
                            <TextField
                                margin="normal"
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: alpha('#fff', 0.9),
                                    },
                                }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: alpha('#fff', 0.9),
                                    },
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 4,
                                    mb: 2,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    background: theme.customGradients.primary,
                                }}
                                disabled={formik.isSubmitting}
                            >
                                Sign In
                            </Button>
                            <Divider sx={{ my: 3 }}>
                                <Typography color="text.secondary">New to Taskuere?</Typography>
                            </Divider>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link
                                    component={RouterLink}
                                    to="/register"
                                    variant="body1"
                                    sx={{
                                        color: theme.palette.primary.main,
                                        textDecoration: 'none',
                                        fontWeight: 600,
                                        '&:hover': {
                                            textDecoration: 'underline',
                                        },
                                    }}
                                >
                                    Create an account
                                </Link>
                            </Box>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default Login; 