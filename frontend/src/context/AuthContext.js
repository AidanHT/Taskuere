import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Create authentication context
const AuthContext = createContext(null);

// Custom hook to use authentication context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Store authenticated user data
    const [loading, setLoading] = useState(true); // Loading state while checking authentication

    useEffect(() => {
        const token = localStorage.getItem('token'); // Retrieve token from local storage
        if (token) {
            try {
                const decoded = jwtDecode(token); // Decode the JWT token
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    localStorage.removeItem('token'); // Remove expired token
                    setUser(null);
                } else {
                    // Set axios default header for authorization
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    fetchUserData(); // Fetch user data from the server
                }
            } catch (error) {
                localStorage.removeItem('token'); // Handle invalid token
                setUser(null);
            }
        }
        setLoading(false); // Set loading to false after checking authentication
    }, []);

    // Fetch user data from API
    const fetchUserData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/me`);
            setUser(response.data);
        } catch (error) {
            localStorage.removeItem('token'); // Handle error by clearing token
            setUser(null);
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
                email,
                password,
            });

            const { token, user } = response.data;
            localStorage.setItem('token', token); // Store token
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user); // Set user data
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed',
            };
        }
    };

    // Register function
    const register = async (username, email, password) => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
                username,
                email,
                password,
            });

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('token'); // Remove token from local storage
        delete axios.defaults.headers.common['Authorization']; // Remove auth header
        setUser(null); // Reset user state
    };

    // Update user profile function
    const updateProfile = async (data) => {
        try {
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/users/me`, data);
            setUser(response.data); // Update user state with new data
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Profile update failed',
            };
        }
    };

    // Change password function
    const changePassword = async (currentPassword, newPassword) => {
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/users/me/password`, {
                currentPassword,
                newPassword,
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Password change failed',
            };
        }
    };

    // Delete account function
    const deleteAccount = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/users/me`);
            logout(); // Logout user after account deletion
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete account',
            };
        }
    };

    // Provide authentication functions and state to the application
    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
