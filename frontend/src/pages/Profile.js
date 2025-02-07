import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Switch,
    FormControlLabel,
    Divider,
    Alert,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateProfile, changePassword, deleteAccount } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const profileFormik = useFormik({
        initialValues: {
            username: user?.username || '',
            email: user?.email || '',
            notifications: {
                email: user?.notifications?.email ?? true,
                push: user?.notifications?.push ?? false,
            },
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, 'Username must be at least 3 characters')
                .required('Username is required'),
            email: Yup.string()
                .email('Invalid email address')
                .required('Email is required'),
        }),
        onSubmit: async (values) => {
            try {
                const result = await updateProfile(values);
                if (result.success) {
                    toast.success('Profile updated successfully');
                    setIsEditing(false);
                } else {
                    toast.error(result.error);
                }
            } catch (error) {
                toast.error('Failed to update profile');
            }
        },
    });

    const emailSettingsFormik = useFormik({
        initialValues: {
            smtpPassword: '',
        },
        validationSchema: Yup.object({
            smtpPassword: Yup.string()
                .required('App Password is required')
                .min(16, 'App Password should be 16 characters'),
        }),
        onSubmit: async (values) => {
            try {
                const result = await updateProfile({
                    emailSettings: {
                        isConfigured: true,
                        smtpPassword: values.smtpPassword,
                    },
                });
                if (result.success) {
                    toast.success('Email settings updated successfully');
                    setShowEmailDialog(false);
                } else {
                    toast.error(result.error);
                }
            } catch (error) {
                toast.error('Failed to update email settings');
            }
        },
    });

    const passwordFormik = useFormik({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            currentPassword: Yup.string().required('Current password is required'),
            newPassword: Yup.string()
                .min(6, 'Password must be at least 6 characters')
                .required('New password is required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                .required('Confirm password is required'),
        }),
        onSubmit: async (values, { resetForm }) => {
            try {
                const result = await changePassword(
                    values.currentPassword,
                    values.newPassword
                );
                if (result.success) {
                    toast.success('Password changed successfully');
                    resetForm();
                } else {
                    toast.error(result.error);
                }
            } catch (error) {
                toast.error('Failed to change password');
            }
        },
    });

    const handleNotificationChange = (type) => (event) => {
        profileFormik.setFieldValue(`notifications.${type}`, event.target.checked);
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== user.email) {
            toast.error('Please enter your email correctly to confirm deletion');
            return;
        }

        try {
            const result = await deleteAccount();
            if (result.success) {
                toast.success('Account deleted successfully');
                navigate('/login');
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to delete account');
        }
        setShowDeleteDialog(false);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Profile Settings
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Personal Information
                        </Typography>
                        <form onSubmit={profileFormik.handleSubmit}>
                            <TextField
                                fullWidth
                                margin="normal"
                                name="username"
                                label="Username"
                                disabled={!isEditing}
                                value={profileFormik.values.username}
                                onChange={profileFormik.handleChange}
                                error={
                                    profileFormik.touched.username &&
                                    Boolean(profileFormik.errors.username)
                                }
                                helperText={
                                    profileFormik.touched.username && profileFormik.errors.username
                                }
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="email"
                                label="Email"
                                disabled={!isEditing}
                                value={profileFormik.values.email}
                                onChange={profileFormik.handleChange}
                                error={
                                    profileFormik.touched.email &&
                                    Boolean(profileFormik.errors.email)
                                }
                                helperText={
                                    profileFormik.touched.email && profileFormik.errors.email
                                }
                            />

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Notification Settings
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={profileFormik.values.notifications.email}
                                            onChange={handleNotificationChange('email')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="Email Notifications"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={profileFormik.values.notifications.push}
                                            onChange={handleNotificationChange('push')}
                                            disabled={!isEditing}
                                        />
                                    }
                                    label="Push Notifications"
                                />
                            </Box>

                            <Box sx={{ mt: 3 }}>
                                {!isEditing ? (
                                    <Button
                                        variant="contained"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                            disabled={!profileFormik.dirty}
                                        >
                                            Save Changes
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setIsEditing(false);
                                                profileFormik.resetForm();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        </form>
                    </Paper>

                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Email Settings for Notifications
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            To enable email notifications, you need to configure your Gmail App Password.
                            This is different from your regular Gmail password and is more secure.
                        </Alert>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                Current Status:{' '}
                                <strong>
                                    {user?.emailSettings?.isConfigured
                                        ? 'Configured'
                                        : 'Not Configured'}
                                </strong>
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="body2" gutterBottom>
                                To get your Gmail App Password:
                            </Typography>
                            <ol>
                                <li>
                                    Go to your{' '}
                                    <Link
                                        href="https://myaccount.google.com/security"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Google Account Security settings
                                    </Link>
                                </li>
                                <li>Enable 2-Step Verification if not already enabled</li>
                                <li>
                                    Go to{' '}
                                    <Link
                                        href="https://myaccount.google.com/apppasswords"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        App passwords
                                    </Link>
                                </li>
                                <li>Select 'Mail' and your device</li>
                                <li>Click Generate</li>
                            </ol>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => setShowEmailDialog(true)}
                            sx={{ mt: 2 }}
                        >
                            Configure Email Settings
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Change Password
                        </Typography>
                        <form onSubmit={passwordFormik.handleSubmit}>
                            <TextField
                                fullWidth
                                margin="normal"
                                name="currentPassword"
                                label="Current Password"
                                type="password"
                                value={passwordFormik.values.currentPassword}
                                onChange={passwordFormik.handleChange}
                                error={
                                    passwordFormik.touched.currentPassword &&
                                    Boolean(passwordFormik.errors.currentPassword)
                                }
                                helperText={
                                    passwordFormik.touched.currentPassword &&
                                    passwordFormik.errors.currentPassword
                                }
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="newPassword"
                                label="New Password"
                                type="password"
                                value={passwordFormik.values.newPassword}
                                onChange={passwordFormik.handleChange}
                                error={
                                    passwordFormik.touched.newPassword &&
                                    Boolean(passwordFormik.errors.newPassword)
                                }
                                helperText={
                                    passwordFormik.touched.newPassword &&
                                    passwordFormik.errors.newPassword
                                }
                            />
                            <TextField
                                fullWidth
                                margin="normal"
                                name="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                value={passwordFormik.values.confirmPassword}
                                onChange={passwordFormik.handleChange}
                                error={
                                    passwordFormik.touched.confirmPassword &&
                                    Boolean(passwordFormik.errors.confirmPassword)
                                }
                                helperText={
                                    passwordFormik.touched.confirmPassword &&
                                    passwordFormik.errors.confirmPassword
                                }
                            />
                            <Box sx={{ mt: 3 }}>
                                <Button
                                    variant="contained"
                                    type="submit"
                                    disabled={!passwordFormik.dirty}
                                >
                                    Change Password
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <Paper sx={{
                        p: 3,
                        mt: 3,
                        bgcolor: 'rgba(211, 47, 47, 0.1)',  // Lighter red background
                        border: '1px solid rgba(211, 47, 47, 0.3)',  // Subtle border
                        borderRadius: 1
                    }}>
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                color: 'error.dark',  // Darker red for better contrast
                                opacity: 0.9  // Slightly reduced opacity
                            }}
                        >
                            Danger Zone
                        </Typography>
                        <Typography
                            variant="body2"
                            paragraph
                            sx={{
                                color: 'error.dark',
                                opacity: 0.7  // More reduced opacity for body text
                            }}
                        >
                            Once you delete your account, there is no going back. Please be certain.
                        </Typography>
                        <Button
                            variant="outlined"  // Changed to outlined for softer appearance
                            color="error"
                            onClick={() => setShowDeleteDialog(true)}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'error.light',
                                }
                            }}
                        >
                            Delete Account
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Email Settings Dialog */}
            <Dialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)}>
                <DialogTitle>Configure Email Settings</DialogTitle>
                <form onSubmit={emailSettingsFormik.handleSubmit}>
                    <DialogContent>
                        <DialogContentText>
                            Please enter your Gmail App Password. This is a 16-character password
                            generated specifically for this application.
                        </DialogContentText>
                        <TextField
                            fullWidth
                            margin="normal"
                            name="smtpPassword"
                            label="Gmail App Password"
                            type="password"
                            value={emailSettingsFormik.values.smtpPassword}
                            onChange={emailSettingsFormik.handleChange}
                            error={
                                emailSettingsFormik.touched.smtpPassword &&
                                Boolean(emailSettingsFormik.errors.smtpPassword)
                            }
                            helperText={
                                emailSettingsFormik.touched.smtpPassword &&
                                emailSettingsFormik.errors.smtpPassword
                            }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowEmailDialog(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!emailSettingsFormik.dirty}
                        >
                            Save Settings
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Delete Account Confirmation Dialog */}
            <Dialog
                open={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Delete Account</DialogTitle>
                <DialogContent>
                    <DialogContentText color="error" paragraph>
                        Warning: This action cannot be undone. This will permanently delete your
                        account and remove all associated data.
                    </DialogContentText>
                    <DialogContentText paragraph>
                        Please type your email <strong>{user?.email}</strong> to confirm deletion:
                    </DialogContentText>
                    <TextField
                        fullWidth
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Enter your email to confirm"
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeleteAccount}
                        color="error"
                        variant="contained"
                        disabled={deleteConfirmText !== user?.email}
                    >
                        Delete My Account
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Profile; 