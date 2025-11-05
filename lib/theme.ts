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
    h1: {
      fontWeight: 600,
      fontSize: '1.75rem', // 28px → 24px
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem', // 24px → 20px
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem', // 20px → 18px
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.125rem', // 18px → 16px
    },
    h5: {
      fontWeight: 500,
      fontSize: '1rem', // 16px → 14px
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.9375rem', // 15px → 13px
    },
    body1: {
      fontSize: '0.875rem', // 14px → 12px
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.75rem', // 12px → 11px
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.6875rem', // 11px → 10px
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '0.875rem', // 14px → 12px
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.75rem', // 12px → 11px
      fontWeight: 500,
    },
    button: {
      fontSize: '0.75rem', // 12px → 11px
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          padding: '6px 16px',
          fontWeight: 500,
          fontSize: '0.75rem', // 12px
          minHeight: '32px',
        },
        sizeSmall: {
          padding: '4px 12px',
          fontSize: '0.6875rem', // 11px
          minHeight: '28px',
        },
        sizeMedium: {
          padding: '6px 16px',
          fontSize: '0.75rem', // 12px
          minHeight: '32px',
        },
        sizeLarge: {
          padding: '8px 20px',
          fontSize: '0.8125rem', // 13px
          minHeight: '36px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '12px !important',
          '&:last-child': {
            paddingBottom: '12px !important',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontSize: '0.75rem', // 12px
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.75rem', // 12px
          },
          '& .MuiInputBase-input': {
            fontSize: '0.75rem', // 12px
            padding: '8px 12px',
          },
        },
      },
    },
    MuiTable: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
          fontSize: '0.75rem', // 12px
          padding: '8px 12px',
          },
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem', // 12px
            padding: '10px 12px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem', // 12px
          padding: '8px 12px',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem', // 12px
          padding: '10px 12px',
        },
      },
    },
    MuiChip: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          fontSize: '0.6875rem', // 11px
          height: '20px',
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: '0.625rem', // 10px
          height: '18px',
        },
        sizeMedium: {
          fontSize: '0.6875rem', // 11px
          height: '22px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1rem', // 16px
          fontWeight: 600,
          padding: '12px 16px',
          paddingBottom: '8px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '12px 16px !important',
          fontSize: '0.75rem', // 12px
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '8px 16px 12px !important',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '6px 12px',
          minHeight: '40px',
          '& .MuiListItemIcon-root': {
            minWidth: '32px',
            fontSize: '18px',
          },
          '& .MuiListItemText-primary': {
            fontSize: '0.8125rem', // 13px
          },
          '& .MuiListItemText-secondary': {
            fontSize: '0.6875rem', // 11px
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '32px',
          fontSize: '18px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.8125rem', // 13px
        },
        secondary: {
          fontSize: '0.6875rem', // 11px
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: '32px',
          height: '32px',
          fontSize: '0.875rem', // 14px
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem', // 12px
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          fontSize: '0.75rem', // 12px
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem', // 12px
          padding: '6px 12px',
          minHeight: '36px',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.75rem', // 12px
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '40px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem', // 12px
          fontWeight: 500,
          padding: '8px 16px',
          minHeight: '40px',
          textTransform: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '6px',
          '& svg': {
            fontSize: '18px',
          },
        },
        sizeSmall: {
          padding: '4px',
          '& svg': {
            fontSize: '16px',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          width: '24px !important',
          height: '24px !important',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '8px 0',
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          '&.MuiGrid-container': {
            margin: '0 -8px',
            '& > .MuiGrid-item': {
              padding: '0 8px',
            },
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

