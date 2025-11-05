'use client';

import { Box, Paper, TextField, Button, Typography, Alert, Card, CardContent } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { gradients } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login: loginUser } = useAuth();
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(formData.login, formData.password);
      // login başarılıysa otomatik olarak dashboard'a yönlendirilir
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header with gradient - HTML_TEMPLATES.html'e göre */}
        <Box
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            padding: 3,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Image
              src="/logo3.png"
              alt="Logo"
              width={200}
              height={200}
              style={{
                objectFit: 'contain',
                borderRadius: 12,
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
              }}
            />
          </Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              mb: 1, 
              fontWeight: 600,
              fontSize: '34px',
              color: 'white',
            }}
          >
            Giriş Yap
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontSize: '16px',
            }}
          >
            Hesabınıza giriş yapın
          </Typography>
        </Box>

        {/* Form - HTML_TEMPLATES.html'e göre */}
        <CardContent sx={{ padding: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Kullanıcı Adı veya E-posta"
                variant="outlined"
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Şifre"
                type="password"
                variant="outlined"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
                boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                borderRadius: 2,
                padding: '10px 24px',
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s',
              }}
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>

            <Typography 
              variant="body2" 
              align="center" 
              color="text.secondary"
              sx={{ 
                fontSize: '14px',
                mt: 2,
              }}
            >
              Hesabınız yok mu?{' '}
              <Button
                variant="text"
                size="small"
                sx={{ 
                  textTransform: 'none', 
                  color: 'primary.main',
                  fontWeight: 500,
                }}
                onClick={() => router.push('/register')}
              >
                Kayıt Ol
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

