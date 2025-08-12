import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
    alpha,
    useTheme,
} from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
    username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .required('Username is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required'),
});

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const theme = useTheme();

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                const result = await register(
                    values.username,
                    values.email,
                    values.password
                );
                if (result.success) {
                    toast.success('Registration successful!');
                    navigate('/');
                } else {
                    toast.error(result.error);
                }
            } catch (error) {
                toast.error('An error occurred during registration');
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <Box sx={{
            background: theme.customGradients.primary,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
        }}>
            <Container component="main" maxWidth="sm">
                <Paper
                    elevation={8}
                    sx={{
                        p: { xs: 3, md: 5 },
                        borderRadius: 4,
                        background: theme.customGradients.cardGlass,
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                m: 1,
                                width: 64,
                                height: 64,
                                background: theme.customGradients.secondary,
                            }}
                        >
                            <PersonAddOutlined />
                        </Avatar>
                        <Typography
                            component="h1"
                            variant="h4"
                            sx={{
                                mb: 2,
                                fontWeight: 800,
                                background: theme.customGradients.primary,
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                color: 'transparent',
                                textAlign: 'center'
                            }}
                        >
                            Create your account
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                            Join Taskuere to experience AI-powered scheduling and collaboration.
                        </Typography>
                        <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
                            <TextField
                                margin="normal"
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={formik.values.username}
                                onChange={formik.handleChange}
                                error={formik.touched.username && Boolean(formik.errors.username)}
                                helperText={formik.touched.username && formik.errors.username}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: alpha('#fff', 0.9) } }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: alpha('#fff', 0.9) } }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: alpha('#fff', 0.9) } }}
                            />
                            <TextField
                                margin="normal"
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={formik.values.confirmPassword}
                                onChange={formik.handleChange}
                                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: alpha('#fff', 0.9) } }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2, py: 1.5, background: theme.customGradients.primary }}
                                disabled={formik.isSubmitting}
                            >
                                Sign Up
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link component={RouterLink} to="/login" variant="body1" sx={{ fontWeight: 600 }}>
                                    Already have an account? Sign In
                                </Link>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Register; 