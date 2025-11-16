'use client';

import { Box, Typography, Card } from '@mui/material';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

// Kayıt özelliği devre dışı bırakıldı
export default function RegisterPage() {
  const router = useRouter();
  const { mode } = useTheme();

  useEffect(() => {
    // Register sayfasına erişim engellendi, login'e yönlendir
    router.push('/login');
  }, [router]);

  return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          background: mode === 'dark' 
            ? 'rgba(30, 30, 30, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
          padding: 3,
          textAlign: 'center',
        }}
      >
        <Typography 
          variant="h3" 
          component="h1" 
          sx={{ 
            mb: 2, 
            fontWeight: 700,
            fontSize: '2rem',
            letterSpacing: '1px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'primary.main',
          }}
        >
          Kayıt Özelliği Devre Dışı
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: '13px',
            mb: 2,
          }}
        >
          Kayıt özelliği devre dışı bırakılmıştır. Hesap oluşturmak için lütfen yöneticinizle iletişime geçin.
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            fontSize: '12px',
          }}
        >
          Yönlendiriliyor...
        </Typography>
      </Card>
    </Box>
  );
}
