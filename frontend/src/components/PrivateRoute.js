import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth(); // Get authentication state
    const location = useLocation(); // Get current route location

    // Display a loading spinner if authentication state is being fetched
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

    // Redirect unauthenticated users to login page, preserving their intended destination
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children; // Render protected content if the user is authenticated
};

export default PrivateRoute;
