import { createTheme, alpha } from '@mui/material/styles';

// MUI Theme - Normal çözünürlük için standart değerler
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
      fontSize: '2rem', // 32px
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.75rem', // 28px
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem', // 24px
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem', // 20px
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.125rem', // 18px
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem', // 16px
    },
    body1: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
    },
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500,
          fontSize: '0.875rem', // 14px
          minHeight: '36px',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem', // 13px
          minHeight: '32px',
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: '0.875rem', // 14px
          minHeight: '36px',
        },
        sizeLarge: {
          padding: '10px 20px',
          fontSize: '0.9375rem', // 15px
          minHeight: '42px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            fontSize: '0.875rem', // 14px
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.875rem', // 14px
          },
          '& .MuiInputBase-input': {
            fontSize: '0.875rem', // 14px
            padding: '12px 14px',
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontSize: '0.875rem', // 14px
            padding: '12px 16px',
          },
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.875rem', // 14px
            padding: '14px 16px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // 14px
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.875rem', // 14px
          padding: '14px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem', // 13px
          height: '28px',
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: '0.75rem', // 12px
          height: '24px',
        },
        sizeMedium: {
          fontSize: '0.8125rem', // 13px
          height: '28px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem', // 20px
          fontWeight: 600,
          padding: '16px 24px',
          paddingBottom: '12px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          fontSize: '0.875rem', // 14px
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 24px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          minHeight: '48px',
          '& .MuiListItemIcon-root': {
            minWidth: '40px',
            fontSize: '24px',
          },
          '& .MuiListItemText-primary': {
            fontSize: '0.875rem', // 14px
          },
          '& .MuiListItemText-secondary': {
            fontSize: '0.75rem', // 12px
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '40px',
          fontSize: '24px',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem', // 14px
        },
        secondary: {
          fontSize: '0.75rem', // 12px
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: '40px',
          height: '40px',
          fontSize: '1rem', // 16px
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // 14px
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // 14px
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // 14px
          padding: '8px 16px',
          minHeight: '40px',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.875rem', // 14px
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // 14px
          fontWeight: 500,
          padding: '12px 16px',
          minHeight: '48px',
          textTransform: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '8px',
          '& svg': {
            fontSize: '24px',
          },
        },
        sizeSmall: {
          padding: '6px',
          '& svg': {
            fontSize: '20px',
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          width: '40px',
          height: '40px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '16px 0',
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          '&.MuiGrid-container': {
            margin: '0 -12px',
            '& > .MuiGrid-item': {
              padding: '0 12px',
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
