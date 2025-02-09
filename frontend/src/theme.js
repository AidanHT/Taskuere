import { createTheme } from '@mui/material';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2D46B9',
            light: '#5C6BC0',
            dark: '#1A237E',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#F50057',
            light: '#FF4081',
            dark: '#C51162',
            contrastText: '#ffffff',
        },
        background: {
            default: '#F8F9FE',
            paper: '#ffffff',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            card: 'rgba(255, 255, 255, 0.9)',
        },
        text: {
            primary: '#2D3748',
            secondary: '#4A5568',
        },
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.025em',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.0125em',
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.0125em',
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '50px',
                    padding: '10px 24px',
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                },
                contained: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                    backdropFilter: 'blur(10px)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                        },
                    },
                },
            },
        },
    },
    customGradients: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #F50057 0%, #FF4081 100%)',
        card: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
    },
});

export default theme; 