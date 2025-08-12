import { createTheme } from '@mui/material';

// Advanced design tokens
const designTokens = {
    // Color palette inspired by leading tech companies
    colors: {
        primary: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#6366F1',
            600: '#4F46E5',
            700: '#4338CA',
            800: '#3730A3',
            900: '#312E81',
            main: '#4F46E5',
        },
        secondary: {
            50: '#FDF2F8',
            100: '#FCE7F3',
            200: '#FBCFE8',
            300: '#F9A8D4',
            400: '#F472B6',
            500: '#EC4899',
            600: '#DB2777',
            700: '#BE185D',
            800: '#9D174D',
            900: '#831843',
            main: '#EC4899',
        },
        accent: {
            50: '#F0FDF4',
            100: '#DCFCE7',
            200: '#BBF7D0',
            300: '#86EFAC',
            400: '#4ADE80',
            500: '#22C55E',
            600: '#16A34A',
            700: '#15803D',
            800: '#166534',
            900: '#14532D',
            main: '#22C55E',
        },
        warning: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
            main: '#F59E0B',
        },
        surface: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
        }
    },
    // Advanced gradients
    gradients: {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        danger: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        dark: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        light: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        aurora: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        cardGlass: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
        heroOverlay: 'linear-gradient(135deg, rgba(102,126,234,0.9) 0%, rgba(118,75,162,0.8) 100%)',
    },
    // Shadow system for depth
    shadows: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        glow: '0 0 15px rgba(102, 126, 234, 0.4)',
        coloredGlow: '0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.4)',
    },
    // Animation easings
    transitions: {
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
    },
};

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: designTokens.colors.primary.main,
            light: designTokens.colors.primary[400],
            dark: designTokens.colors.primary[700],
            contrastText: '#ffffff',
            50: designTokens.colors.primary[50],
            100: designTokens.colors.primary[100],
            200: designTokens.colors.primary[200],
            300: designTokens.colors.primary[300],
            400: designTokens.colors.primary[400],
            500: designTokens.colors.primary[500],
            600: designTokens.colors.primary[600],
            700: designTokens.colors.primary[700],
            800: designTokens.colors.primary[800],
            900: designTokens.colors.primary[900],
        },
        secondary: {
            main: designTokens.colors.secondary.main,
            light: designTokens.colors.secondary[400],
            dark: designTokens.colors.secondary[700],
            contrastText: '#ffffff',
            50: designTokens.colors.secondary[50],
            100: designTokens.colors.secondary[100],
            200: designTokens.colors.secondary[200],
            300: designTokens.colors.secondary[300],
            400: designTokens.colors.secondary[400],
            500: designTokens.colors.secondary[500],
            600: designTokens.colors.secondary[600],
            700: designTokens.colors.secondary[700],
            800: designTokens.colors.secondary[800],
            900: designTokens.colors.secondary[900],
        },
        success: {
            main: designTokens.colors.accent.main,
            light: designTokens.colors.accent[400],
            dark: designTokens.colors.accent[700],
            contrastText: '#ffffff',
        },
        warning: {
            main: designTokens.colors.warning.main,
            light: designTokens.colors.warning[400],
            dark: designTokens.colors.warning[700],
            contrastText: '#ffffff',
        },
        background: {
            default: '#FAFBFF',
            paper: '#ffffff',
            gradient: designTokens.gradients.primary,
            card: 'rgba(255, 255, 255, 0.95)',
            glass: 'rgba(255, 255, 255, 0.25)',
            surface: designTokens.colors.surface[50],
        },
        text: {
            primary: '#1F2937',
            secondary: '#6B7280',
            disabled: '#9CA3AF',
        },
        grey: designTokens.colors.surface,
    },
    typography: {
        fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.025em',
            fontSize: '3.5rem',
            lineHeight: 1.1,
            '@media (max-width:600px)': {
                fontSize: '2.5rem',
            },
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.0125em',
            fontSize: '2.25rem',
            lineHeight: 1.2,
            '@media (max-width:600px)': {
                fontSize: '1.75rem',
            },
        },
        h3: {
            fontWeight: 700,
            letterSpacing: '-0.0125em',
            fontSize: '1.875rem',
            lineHeight: 1.3,
        },
        h4: {
            fontWeight: 600,
            letterSpacing: '-0.005em',
            fontSize: '1.5rem',
            lineHeight: 1.3,
        },
        h5: {
            fontWeight: 600,
            fontSize: '1.25rem',
            lineHeight: 1.4,
        },
        h6: {
            fontWeight: 600,
            fontSize: '1.125rem',
            lineHeight: 1.4,
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
            letterSpacing: '0.025em',
        },
        caption: {
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
        },
    },
    shape: {
        borderRadius: 16,
    },
    spacing: 8,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    padding: '12px 32px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: designTokens.shadows.sm,
                    transition: `all 0.3s ${designTokens.transitions.spring}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transition: 'left 0.5s',
                    },
                    '&:hover': {
                        transform: 'translateY(-3px) scale(1.02)',
                        boxShadow: designTokens.shadows.lg,
                        '&:before': {
                            left: '100%',
                        },
                    },
                    '&:active': {
                        transform: 'translateY(-1px) scale(0.98)',
                    },
                },
                contained: {
                    background: designTokens.gradients.primary,
                    color: '#ffffff',
                    '&:hover': {
                        background: designTokens.gradients.aurora,
                        boxShadow: designTokens.shadows.glow,
                    },
                },
                outlined: {
                    borderWidth: '2px',
                    borderColor: 'transparent',
                    background: designTokens.gradients.cardGlass,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                        borderColor: 'transparent',
                        background: designTokens.gradients.glass,
                        boxShadow: designTokens.shadows.glow,
                    },
                },
                text: {
                    '&:hover': {
                        background: 'rgba(102, 126, 234, 0.08)',
                    },
                },
                sizeLarge: {
                    padding: '16px 40px',
                    fontSize: '1.125rem',
                },
                sizeSmall: {
                    padding: '8px 20px',
                    fontSize: '0.875rem',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '24px',
                    background: designTokens.gradients.cardGlass,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: designTokens.shadows.lg,
                    transition: `all 0.4s ${designTokens.transitions.spring}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                    },
                    '&:hover': {
                        transform: 'translateY(-12px) rotateX(5deg)',
                        boxShadow: designTokens.shadows['2xl'],
                        '&:before': {
                            background: designTokens.gradients.aurora,
                            height: '2px',
                        },
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '20px',
                    background: designTokens.gradients.cardGlass,
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: designTokens.shadows.md,
                },
                elevation1: {
                    boxShadow: designTokens.shadows.sm,
                },
                elevation2: {
                    boxShadow: designTokens.shadows.md,
                },
                elevation3: {
                    boxShadow: designTokens.shadows.lg,
                },
                elevation4: {
                    boxShadow: designTokens.shadows.xl,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(10px)',
                        transition: `all 0.3s ${designTokens.transitions.smooth}`,
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: designTokens.shadows.md,
                            '& fieldset': {
                                borderColor: designTokens.colors.primary.main,
                            },
                        },
                        '&.Mui-focused': {
                            transform: 'translateY(-2px)',
                            boxShadow: designTokens.shadows.glow,
                            '& fieldset': {
                                borderWidth: '2px',
                                borderColor: designTokens.colors.primary.main,
                            },
                        },
                        '& fieldset': {
                            borderWidth: '1px',
                            borderColor: 'rgba(102, 126, 234, 0.2)',
                        },
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: designTokens.gradients.glass,
                    backdropFilter: 'blur(20px)',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: designTokens.gradients.cardGlass,
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                },
            },
        },
        MuiListItem: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    margin: '4px 8px',
                    transition: `all 0.2s ${designTokens.transitions.smooth}`,
                    '&:hover': {
                        background: 'rgba(102, 126, 234, 0.08)',
                        transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                        background: designTokens.gradients.primary,
                        color: '#ffffff',
                        '&:hover': {
                            background: designTokens.gradients.primary,
                        },
                        '& .MuiListItemIcon-root': {
                            color: '#ffffff',
                        },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    fontWeight: 500,
                    backdropFilter: 'blur(10px)',
                },
                filled: {
                    background: designTokens.gradients.cardGlass,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    minHeight: '48px',
                    transition: `all 0.2s ${designTokens.transitions.smooth}`,
                    '&:hover': {
                        color: designTokens.colors.primary.main,
                        background: 'rgba(102, 126, 234, 0.08)',
                    },
                    '&.Mui-selected': {
                        color: designTokens.colors.primary.main,
                        fontWeight: 700,
                    },
                },
            },
        },
        MuiTabs: {
            styleOverrides: {
                indicator: {
                    height: '3px',
                    borderRadius: '3px',
                    background: designTokens.gradients.primary,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    transition: `all 0.2s ${designTokens.transitions.smooth}`,
                    '&:hover': {
                        transform: 'scale(1.1)',
                        background: 'rgba(102, 126, 234, 0.08)',
                    },
                },
            },
        },
        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    color: designTokens.colors.primary.main,
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: '4px',
                    backgroundColor: designTokens.colors.surface[200],
                },
                bar: {
                    borderRadius: '4px',
                    background: designTokens.gradients.primary,
                },
            },
        },
    },
    // Custom design system extensions
    customGradients: designTokens.gradients,
    customShadows: designTokens.shadows,
    customTransitions: designTokens.transitions,
    designTokens: designTokens,
});

export default theme; 