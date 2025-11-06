'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ShortLinkRedirectPage({ params }: { params: Promise<{ shortCode: string }> }) {
  const router = useRouter();
  const [shortCode, setShortCode] = useState<string>('');

  useEffect(() => {
    // Params'ı resolve et
    params.then((p: { shortCode: string }) => {
      setShortCode(p.shortCode);
    });
  }, [params]);

  useEffect(() => {
    if (!shortCode) return;

    // Kısa linke yönlendirme
    const redirect = async () => {
      try {
        const response = await fetch(`/api/short-links/${shortCode}`);
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          // Hata durumunda ana sayfaya yönlendir
          router.push('/');
        }
      } catch (error) {
        console.error('Redirect error:', error);
        router.push('/');
      }
    };

    redirect();
  }, [shortCode, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        Yönlendiriliyor...
      </Typography>
    </Box>
  );
}
