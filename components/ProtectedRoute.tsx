'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  useEffect(() => {
    // Auth kontrolü tamamlandıktan sonra ve user yoksa kontrol et
    if (!loading && !user && !hasRedirected) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      
      if (!token) {
        // Token yok, login'e yönlendir (sadece bir kez)
        setHasRedirected(true);
        router.push('/login');
      } else if (token && savedUser) {
        // Token ve user localStorage'da var, useAuth restore edecek
        // Hiçbir şey yapma, sadece bekle (loading gösterilecek)
        setCheckingAuth(true);
      } else if (token && !savedUser) {
        // Token var ama user localStorage'da yok, checkAuth bekleniyor
        setCheckingAuth(true);
      }
    } else if (user) {
      // User var, redirect durumunu sıfırla
      setHasRedirected(false);
      setCheckingAuth(false);
    }
  }, [user, loading, router, hasRedirected, checkingAuth]);

  // Loading durumunda göster
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Yükleniyor...</Typography>
      </Box>
    );
  }

  // User yoksa ve token da yoksa, null döndür (login'e yönlendirme yapılacak)
  if (!user) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    
    if (!token) {
      return null; // Login'e yönlendirilecek
    }
    
    // Token var ama user yok
    // Eğer user localStorage'da varsa, restore edilmeyi bekle
    if (token && savedUser) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography>Kimlik doğrulanıyor...</Typography>
        </Box>
      );
    }
    
    // Token var ama user localStorage'da yok, checkAuth bekleniyor
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>Kimlik doğrulanıyor...</Typography>
      </Box>
    );
  }

  // User var, içeriği göster
  return <>{children}</>;
}

