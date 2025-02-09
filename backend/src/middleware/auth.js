const jwt = require('jsonwebtoken'); // Importing the JSON Web Token (JWT) library for token generation and verification
const User = require('../models/User'); // Importing the User model to interact with the database

/**
 * Middleware function to authenticate users.
 * Checks if a valid JWT token is provided in the Authorization header.
 * If valid, attaches the authenticated user to the request object.
 */
const auth = async (req, res, next) => {
    try {
        // Extract the token from the Authorization header (if present)
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // If no token is provided, return an authentication error
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify the token using the secret key stored in environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the user from the database using the decoded userId from the token
        const user = await User.findById(decoded.userId);

        // If user is not found, return an authentication error
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach the authenticated user and token to the request object for further use
        req.user = user;
        req.token = token;

        // Proceed to the next middleware function
        next();
    } catch (error) {
        // If any error occurs (e.g., invalid token), return an authentication error
        res.status(401).json({ message: 'Invalid authentication token' });
    }
};

/**
 * Middleware function to check if the authenticated user is an admin.
 * This function should be used after the `auth` middleware.
 */
const isAdmin = async (req, res, next) => {
    try {
        // Check if the user's role is not 'admin'
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        // If the user is an admin, proceed to the next middleware function
        next();
    } catch (error) {
        // Handle any unexpected server errors
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Function to generate a JWT token for a given user ID.
 * The token is valid for 7 days.
 * @param {string} userId - The ID of the user for whom the token is generated.
 * @returns {string} - The generated JWT token.
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId }, // Payload containing the user ID
        process.env.JWT_SECRET, // Secret key for signing the token
        { expiresIn: '7d' } // Token expiration time set to 7 days
    );
};

// Export the middleware functions and token generator function for use in other parts of the application
module.exports = {
    auth,
    isAdmin,
    generateToken
};
