import { createTheme, alpha } from '@mui/material/styles';

// MUI Theme - Eski projedeki tasarım sistemine birebir uyumlu
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#fff',
    },
    success: {
      main: '#4caf50',
      light: alpha('#4caf50', 0.2),
    },
    error: {
      main: '#f44336',
      light: alpha('#f44336', 0.1),
    },
    warning: {
      main: '#ff9800',
      light: alpha('#ff9800', 0.2),
    },
    info: {
      main: '#2196f3',
      light: alpha('#2196f3', 0.2),
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2.125rem', // 34px
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.5rem', // 24px
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem', // 20px
    },
    body1: {
      fontSize: '1rem', // 16px
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: 24,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

// Gradient renkleri (export için)
export const gradients = {
  login: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  navbar: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
  cardLight: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%)',
  cardMedium: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
  button: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
};

