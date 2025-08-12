import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Button,
    useTheme,
    useMediaQuery,
    Avatar,
    Badge,
    Tooltip,
    Divider,
    Chip,
    alpha,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    CalendarMonth,
    Person,
    AdminPanelSettings,
    Logout,
    Psychology,
    Groups,
    Notifications,
    Settings,
    Search,
    DarkMode,
    LightMode,
    Analytics,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import notificationsService from '../services/notificationsService';
// Use CSS transitions to avoid bundling issues with default exports

const drawerWidth = 280; // Enhanced sidebar width

const Layout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(0);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Toggle drawer for mobile view
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Handle navigation to different routes
    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false); // Close drawer on mobile after navigation
        }
    };

    // Handle user logout
    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login page
    };

    // Enhanced menu items with gradients and descriptions
    const menuItems = [
        { 
            text: 'Dashboard', 
            icon: <Dashboard />, 
            path: '/', 
            gradient: theme.customGradients.primary,
            description: 'Overview & Analytics'
        },
        { 
            text: 'Calendar', 
            icon: <CalendarMonth />, 
            path: '/calendar',
            gradient: theme.customGradients.accent,
            description: 'Schedule & Events'
        },
        { 
            text: 'AI Assistant', 
            icon: <Psychology />, 
            path: '/ai-assistant',
            gradient: theme.customGradients.warning,
            description: 'Smart Scheduling'
        },
        { 
            text: 'Collaboration', 
            icon: <Groups />, 
            path: '/calendar',
            gradient: theme.customGradients.info,
            description: 'Team Workspace'
        },
        { 
            text: 'Profile', 
            icon: <Person />, 
            path: '/profile',
            gradient: theme.customGradients.secondary,
            description: 'Account Settings'
        },
    ];

    // Add Admin Panel option if user is an admin
    if (user?.role === 'admin') {
        menuItems.push({
            text: 'Admin Panel',
            icon: <AdminPanelSettings />,
            path: '/admin',
            gradient: theme.customGradients.danger,
            description: 'System Management'
        });
    }

    // Enhanced modern sidebar drawer
    const drawer = (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            {/* Enhanced Header */}
            <Box
                sx={{
                    p: 3,
                    background: theme.customGradients.primary,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 50%)',
                    },
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 800,
                            mb: 1,
                            background: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        Taskuere
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        AI-Powered Workspace
                    </Typography>
                </Box>
            </Box>

            {/* User Profile Section */}
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                        sx={{
                            width: 48,
                            height: 48,
                            background: theme.customGradients.secondary,
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                        }}
                    >
                        {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {user?.username || 'User'}
                        </Typography>
                        <Chip
                            label={user?.role || 'User'}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.75rem',
                                background: theme.customGradients.accent,
                                color: 'white',
                                fontWeight: 500,
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Navigation Menu */}
            <Box sx={{ flex: 1, p: 1 }}>
                <List sx={{ pt: 2 }}>
                    {menuItems.map((item, index) => {
                        const isSelected = location.pathname === item.path || 
                            (item.path !== '/' && location.pathname.startsWith(item.path));
                        
                        return (
                            <motion.div
                                key={item.text}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                            >
                                <ListItem
                                    button
                                    className="nav-item"
                                    onClick={() => handleNavigation(item.path)}
                                    selected={isSelected}
                                    sx={{
                                        mb: 1,
                                        borderRadius: '16px',
                                        mx: 1,
                                        py: 1.5,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&.Mui-selected': {
                                            background: `${alpha(theme.palette.primary.main, 0.1)} !important`,
                                            '&::before': {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '4px',
                                                background: item.gradient,
                                                borderRadius: '0 4px 4px 0',
                                            },
                                        },
                                        '&:hover': {
                                            background: `${alpha(theme.palette.primary.main, 0.05)} !important`,
                                            transform: 'translateX(8px)',
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 56,
                                            '& .MuiSvgIcon-root': {
                                                fontSize: '1.5rem',
                                                background: isSelected ? item.gradient : 'transparent',
                                                color: isSelected ? 'white' : theme.palette.text.secondary,
                                                borderRadius: '12px',
                                                p: 1,
                                                width: 40,
                                                height: 40,
                                                transition: 'all 0.3s ease',
                                            },
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    fontWeight: isSelected ? 700 : 500,
                                                    color: isSelected ? theme.palette.primary.main : theme.palette.text.primary,
                                                }}
                                            >
                                                {item.text}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography 
                                                variant="caption" 
                                                sx={{ 
                                                    color: theme.palette.text.secondary,
                                                    fontSize: '0.75rem',
                                                }}
                                            >
                                                {item.description}
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            </motion.div>
                        );
                    })}
                </List>
            </Box>

            {/* Bottom Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <ListItem
                    button
                    onClick={handleLogout}
                    sx={{
                        borderRadius: '12px',
                        mb: 1,
                        py: 1.5,
                        '&:hover': {
                            background: alpha(theme.palette.error.main, 0.1),
                        },
                    }}
                >
                    <ListItemIcon
                        sx={{
                            minWidth: 48,
                            '& .MuiSvgIcon-root': {
                                color: theme.palette.error.main,
                                fontSize: '1.25rem',
                            },
                        }}
                    >
                        <Logout />
                    </ListItemIcon>
                    <ListItemText 
                        primary={
                            <Typography variant="subtitle2" sx={{ color: theme.palette.error.main }}>
                                Sign Out
                            </Typography>
                        }
                    />
                </ListItem>
            </Box>
        </motion.div>
    );

    useEffect(() => {
        const el = document.querySelector('.route-view');
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(8px)';
        el.style.transition = 'opacity 400ms ease, transform 400ms ease';
        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });

        // Optional enhancement with anime.js if available
        try {
            // eslint-disable-next-line global-require
            const anime = require('animejs');
            if (anime && anime.timeline) {
                anime({ targets: '.route-view', opacity: [0, 1], translateY: [10, 0], duration: 450, easing: 'easeOutQuad' });
            }
        } catch (_) { /* ignore */ }
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const items = Array.from(document.querySelectorAll('.nav-item'));
        items.forEach((el, i) => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(-10px)';
            el.style.transition = `opacity 300ms ease ${i * 40}ms, transform 300ms ease ${i * 40}ms`;
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateX(0)';
            });
        });
        try {
            // eslint-disable-next-line global-require
            const anime = require('animejs');
            if (anime && anime.timeline) {
                anime({ targets: '.nav-item', opacity: [0, 1], translateX: [-12, 0], delay: anime.stagger(40), duration: 260, easing: 'easeOutSine' });
            }
        } catch (_) { /* ignore */ }
    }, [mobileOpen]);

    // Fetch unread notification count periodically
    useEffect(() => {
        let mounted = true;
        const fetchCount = async () => {
            try {
                const count = await notificationsService.getUnreadCount();
                if (mounted) setNotifications(count);
            } catch (_) { /* ignore */ }
        };
        fetchCount();
        const id = setInterval(fetchCount, 30000);
        return () => { mounted = false; clearInterval(id); };
    }, []);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {/* Enhanced Modern AppBar */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    background: theme.customGradients.glass,
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: theme.customShadows.sm,
                }}
            >
                <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, sm: 3 } }}>
                    {/* Menu button for mobile */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ 
                            mr: 2, 
                            display: { sm: 'none' },
                            background: alpha(theme.palette.primary.main, 0.1),
                            '&:hover': {
                                background: alpha(theme.palette.primary.main, 0.2),
                                transform: 'scale(1.05)',
                            },
                        }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Search Bar - Hidden on mobile */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', mr: 3 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                background: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(10px)',
                                borderRadius: '24px',
                                px: 2,
                                py: 0.5,
                                minWidth: 300,
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: theme.customShadows.md,
                                    transform: 'translateY(-1px)',
                                },
                            }}
                        >
                            <Search sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                            <input
                                placeholder="Search anything..."
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    flex: 1,
                                    color: theme.palette.text.primary,
                                    fontSize: '0.95rem',
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Page Title */}
                    <Typography 
                        variant="h5" 
                        component="div" 
                        sx={{ 
                            flexGrow: 1, 
                            fontWeight: 700,
                            background: theme.customGradients.primary,
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                            display: { xs: 'block', md: 'none' },
                        }}
                    >
                        {menuItems.find((item) => location.pathname.startsWith(item.path))?.text || 'Taskuere'}
                    </Typography>

                    {/* Action Icons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Notifications */}
                        <Tooltip title="Notifications">
                            <IconButton
                                sx={{
                                    background: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                        background: alpha(theme.palette.primary.main, 0.2),
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            >
                                <Badge badgeContent={notifications} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* Settings */}
                        <Tooltip title="Settings">
                            <IconButton
                                onClick={() => navigate('/profile')}
                                sx={{
                                    background: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                        background: alpha(theme.palette.primary.main, 0.2),
                                        transform: 'scale(1.05)',
                                    },
                                }}
                            >
                                <Settings />
                            </IconButton>
                        </Tooltip>

                        {/* User Avatar - Desktop */}
                        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', ml: 1 }}>
                            <Button
                                onClick={() => handleNavigation('/profile')}
                                sx={{
                                    borderRadius: '24px',
                                    px: 2,
                                    py: 1,
                                    background: alpha(theme.palette.background.paper, 0.8),
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    '&:hover': {
                                        background: alpha(theme.palette.primary.main, 0.1),
                                        transform: 'translateY(-1px)',
                                        boxShadow: theme.customShadows.md,
                                    },
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        mr: 1.5,
                                        background: theme.customGradients.secondary,
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                </Avatar>
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography 
                                        variant="subtitle2" 
                                        sx={{ 
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                            lineHeight: 1.2,
                                        }}
                                    >
                                        {user?.username || 'User'}
                                    </Typography>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ 
                                            color: theme.palette.text.secondary,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {user?.role || 'Member'}
                                    </Typography>
                                </Box>
                            </Button>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
            {/* Sidebar navigation */}
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }} // Improve performance on mobile
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                {/* Permanent drawer for desktop */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            {/* Enhanced Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: '72px',
                    minHeight: 'calc(100vh - 72px)',
                    background: 'linear-gradient(135deg, #FAFBFF 0%, #F8F9FE 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `
                            radial-gradient(circle at 25% 25%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(245, 0, 87, 0.05) 0%, transparent 50%)
                        `,
                        pointerEvents: 'none',
                    }}
                />
                
                {/* Content Container */}
                <Box
                    sx={{
                        position: 'relative',
                        zIndex: 1,
                        p: { xs: 2, sm: 3, md: 4 },
                        height: '100%',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 1.02 }}
                            transition={{ 
                                duration: 0.4, 
                                ease: [0.4, 0.0, 0.2, 1],
                                scale: { duration: 0.3 }
                            }}
                            className="route-view"
                            style={{ height: '100%' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </Box>
            </Box>
        </Box>
    );
};

export default Layout;
