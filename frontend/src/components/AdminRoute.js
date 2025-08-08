import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth(); // Get user authentication state
    const location = useLocation(); // Get current location for potential redirection

    // Show loading spinner while authentication is in progress
    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    // Redirect to home page if the user is not logged in or not an admin
    if (!user || user.role !== 'admin') {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return children; // Render the protected content for admin users
};

export default AdminRoute;
