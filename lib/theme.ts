import { createTheme, alpha } from '@mui/material/styles';

// MUI Theme - %15 büyütülmüş çözünürlük
export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: '#2196F3', // Blue
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#F44336', // Red
      light: '#E57373',
      dark: '#D32F2F',
      contrastText: '#fff',
    },
    success: {
      main: '#10B981', // Emerald green
      light: alpha('#10B981', 0.2),
    },
    error: {
      main: '#EF4444', // Red
      light: alpha('#EF4444', 0.1),
    },
    warning: {
      main: '#F59E0B', // Amber
      light: alpha('#F59E0B', 0.2),
    },
    info: {
      main: '#3B82F6', // Blue
      light: alpha('#3B82F6', 0.2),
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#FFFFFF',
      paper: mode === 'dark' ? '#1E1E1E' : '#FAFAFA',
    },
    text: {
      primary: mode === 'dark' ? '#FFFFFF' : '#000000',
      secondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      disabled: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.38)',
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '1.84rem', // 1.6rem × 1.15 = 1.84rem (≈29.44px)
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.61rem', // 1.4rem × 1.15 = 1.61rem (≈25.76px)
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.38rem', // 1.2rem × 1.15 = 1.38rem (≈22.08px)
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.15rem', // 1rem × 1.15 = 1.15rem (≈18.4px)
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.035rem', // 0.9rem × 1.15 = 1.035rem (≈16.56px)
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.92rem', // 0.8rem × 1.15 = 0.92rem (≈14.72px)
    },
    body1: {
      fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem (≈12.88px)
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem (≈11.04px)
      fontWeight: 400,
    },
    caption: {
      fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem (≈11.04px)
      fontWeight: 400,
    },
    subtitle1: {
      fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem
      fontWeight: 500,
    },
    button: {
      fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 5.888, // 5.12px × 1.15 = 5.888px
          padding: '5.888px 11.776px', // 5.12px 10.24px × 1.15
          fontWeight: 500,
          fontSize: '0.71875rem', // 0.625rem × 1.15 = 0.71875rem (≈11.5px)
          minHeight: '25.3px', // 22px × 1.15 = 25.3px
        },
        sizeSmall: {
          padding: '4.416px 8.832px', // 3.84px 7.68px × 1.15
          fontSize: '0.66125rem', // 0.575rem × 1.15 = 0.66125rem (≈10.58px)
          minHeight: '23px', // 20px × 1.15 = 23px
        },
        sizeMedium: {
          padding: '5.888px 11.776px', // 5.12px 10.24px × 1.15
          fontSize: '0.71875rem', // 0.625rem × 1.15 = 0.71875rem
          minHeight: '25.3px', // 22px × 1.15 = 25.3px
        },
        sizeLarge: {
          padding: '7.36px 14.72px', // 6.4px 12.8px × 1.15
          fontSize: '0.7475rem', // 0.65rem × 1.15 = 0.7475rem (≈11.96px)
          minHeight: '29.9px', // 26px × 1.15 = 29.9px
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 11.04, // 9.6px × 1.15 = 11.04px
          boxShadow: mode === 'dark' 
            ? '0 2px 8px rgba(0,0,0,0.3)' 
            : '0 2px 8px rgba(0,0,0,0.1)',
          backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '14.72px', // 12.8px × 1.15 = 14.72px
          '&:last-child': {
            paddingBottom: '14.72px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 7.36, // 6.4px × 1.15 = 7.36px
            fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
            '& fieldset': {
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.23)',
            },
            '&:hover fieldset': {
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.87)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
            color: mode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            '&.Mui-focused': {
              color: 'primary.main',
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
            padding: '11.04px 12.88px', // 9.6px 11.2px × 1.15
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
            '&::placeholder': {
              color: mode === 'dark' ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',
            },
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
            padding: '11.04px 14.72px', // 9.6px 12.8px × 1.15
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          },
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
            padding: '12.88px 14.72px', // 11.2px 12.8px × 1.15
            color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          padding: '11.04px 14.72px', // 9.6px 12.8px × 1.15
          color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        },
        head: {
          fontWeight: 600,
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          padding: '12.88px 14.72px', // 11.2px 12.8px × 1.15
          color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '0.7475rem', // 0.65rem × 1.15 = 0.7475rem (≈11.96px)
          height: '25.76px', // 22.4px × 1.15 = 25.76px
          fontWeight: 500,
        },
        sizeSmall: {
          fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem (≈11.04px)
          height: '22.08px', // 19.2px × 1.15 = 22.08px
        },
        sizeMedium: {
          fontSize: '0.7475rem', // 0.65rem × 1.15 = 0.7475rem
          height: '25.76px', // 22.4px × 1.15 = 25.76px
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 11.04, // 9.6px × 1.15 = 11.04px
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.15rem', // 1rem × 1.15 = 1.15rem (≈18.4px)
          fontWeight: 600,
          padding: '14.72px 22.08px', // 12.8px 19.2px × 1.15
          paddingBottom: '11.04px', // 9.6px × 1.15 = 11.04px
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '14.72px 22.08px', // 12.8px 19.2px × 1.15
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '11.04px 22.08px 14.72px', // 9.6px 19.2px 12.8px × 1.15
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 11.04, // 9.6px × 1.15 = 11.04px
          backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 7.36, // 6.4px × 1.15 = 7.36px
          padding: '7.36px 14.72px', // 6.4px 12.8px × 1.15
          minHeight: '44.16px', // 38.4px × 1.15 = 44.16px
          '& .MuiListItemIcon-root': {
            minWidth: '36.8px', // 32px × 1.15 = 36.8px
            fontSize: '22.08px', // 19.2px × 1.15 = 22.08px
          },
          '& .MuiListItemText-primary': {
            fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          },
          '& .MuiListItemText-secondary': {
            fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: '36.8px', // 32px × 1.15 = 36.8px
          fontSize: '22.08px', // 19.2px × 1.15 = 22.08px
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
        },
        secondary: {
          fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: '36.8px', // 32px × 1.15 = 36.8px
          height: '36.8px',
          fontSize: '0.92rem', // 0.8rem × 1.15 = 0.92rem (≈14.72px)
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.87)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          padding: '7.36px 14.72px', // 6.4px 12.8px × 1.15
          minHeight: '36.8px', // 32px × 1.15 = 36.8px
          color: mode === 'dark' ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'dark' ? 'rgba(33, 150, 243, 0.16)' : 'rgba(33, 150, 243, 0.08)',
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(33, 150, 243, 0.24)' : 'rgba(33, 150, 243, 0.12)',
            },
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '44.16px', // 38.4px × 1.15 = 44.16px
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          fontWeight: 500,
          padding: '11.04px 14.72px', // 9.6px 12.8px × 1.15
          minHeight: '44.16px', // 38.4px × 1.15 = 44.16px
          textTransform: 'none',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: '7.36px', // 6.4px × 1.15 = 7.36px
          '& svg': {
            fontSize: '22.08px', // 19.2px × 1.15 = 22.08px
          },
        },
        sizeSmall: {
          padding: '5.52px', // 4.8px × 1.15 = 5.52px
          '& svg': {
            fontSize: '18.4px', // 16px × 1.15 = 18.4px
          },
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          width: '36.8px', // 32px × 1.15 = 36.8px
          height: '36.8px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '14.72px 0', // 12.8px × 1.15 = 14.72px
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          '&.MuiGrid-container': {
            margin: '0 -11.04px', // -9.6px × 1.15 = -11.04px
            '& > .MuiGrid-item': {
              padding: '0 11.04px', // 9.6px × 1.15 = 11.04px
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 11.04, // 9.6px × 1.15 = 11.04px
          fontSize: '0.805rem', // 0.7rem × 1.15 = 0.805rem
          padding: '11.04px 14.72px', // 9.6px 12.8px × 1.15
          backgroundColor: mode === 'dark' ? 'rgba(30, 30, 30, 0.95)' : undefined,
          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : undefined,
          '& .MuiAlert-icon': {
            color: mode === 'dark' ? 'inherit' : undefined,
          },
          '& .MuiAlert-message': {
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : undefined,
          },
          '& .MuiAlert-action': {
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : undefined,
          },
        },
        standardError: {
          backgroundColor: mode === 'dark' ? 'rgba(244, 67, 54, 0.15)' : undefined,
          color: mode === 'dark' ? '#ffcdd2' : undefined,
          border: mode === 'dark' ? '1px solid rgba(244, 67, 54, 0.3)' : undefined,
        },
        standardSuccess: {
          backgroundColor: mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : undefined,
          color: mode === 'dark' ? '#c8e6c9' : undefined,
          border: mode === 'dark' ? '1px solid rgba(76, 175, 80, 0.3)' : undefined,
        },
        standardWarning: {
          backgroundColor: mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : undefined,
          color: mode === 'dark' ? '#ffe0b2' : undefined,
          border: mode === 'dark' ? '1px solid rgba(255, 152, 0, 0.3)' : undefined,
        },
        standardInfo: {
          backgroundColor: mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : undefined,
          color: mode === 'dark' ? '#bbdefb' : undefined,
          border: mode === 'dark' ? '1px solid rgba(33, 150, 243, 0.3)' : undefined,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: '0.69rem', // 0.6rem × 1.15 = 0.69rem
          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          marginTop: '4.6px', // 4px × 1.15 = 4.6px
        },
      },
    },
  },
});

// Light theme (default) - backward compatibility
export const theme = getTheme('light');

// Gradient renkleri (export için) - Siyah-Beyaz ağırlıklı, arada mavi/kırmızı
export const getGradients = (mode: 'light' | 'dark' = 'light') => ({
  login: mode === 'dark'
    ? 'linear-gradient(135deg, #000000 0%, #424242 50%, #000000 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 50%, #FFFFFF 100%)',
  navbar: mode === 'dark'
    ? 'linear-gradient(135deg, #1976D2 0%, #000000 50%, #F44336 100%)'
    : 'linear-gradient(135deg, #2196F3 0%, #424242 50%, #F44336 100%)',
  cardLight: mode === 'dark'
    ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.05) 100%)',
  cardMedium: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.9) 100%)',
  button: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  buttonSecondary: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
});

// Backward compatibility
export const gradients = getGradients('light');
