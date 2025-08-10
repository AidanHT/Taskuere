import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
// Use CSS transitions to avoid bundling issues with default exports

const drawerWidth = 240; // Sidebar width

const Layout = () => {
    const [mobileOpen, setMobileOpen] = useState(false); // State for mobile drawer
    const { user, logout } = useAuth(); // Get user authentication data
    const navigate = useNavigate(); // Hook for navigation
    const location = useLocation(); // Get current route location
    const theme = useTheme(); // Get MUI theme
    const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Check if screen is mobile

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

    // Menu items for navigation
    const menuItems = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/' },
        { text: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
        { text: 'AI Assistant', icon: <Psychology />, path: '/ai-assistant' },
        { text: 'Profile', icon: <Person />, path: '/profile' },
        { text: 'Collaboration', icon: <Groups />, path: '/calendar' },
    ];

    // Add Admin Panel option if user is an admin
    if (user?.role === 'admin') {
        menuItems.push({
            text: 'Admin Panel',
            icon: <AdminPanelSettings />,
            path: '/admin',
        });
    }

    // Define the sidebar drawer
    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Taskuere
                </Typography>
            </Toolbar>
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        className="nav-item"
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
                <ListItem button onClick={handleLogout}>
                    <ListItemIcon>
                        <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </div>
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
    }, [mobileOpen]);

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {/* Top AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    {/* Menu button for mobile */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    {/* Display page title dynamically based on route */}
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find((item) => location.pathname.startsWith(item.path))?.text || 'Taskuere'}
                    </Typography>
                    {/* Show username in AppBar */}
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button color="inherit" onClick={() => handleNavigation('/profile')}>
                            {user?.username}
                        </Button>
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
            {/* Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: '64px',
                }}
            >
                <div key={location.pathname} className="route-view">
                    <Outlet /> {/* Render child components */}
                </div>
            </Box>
        </Box>
    );
};

export default Layout;
