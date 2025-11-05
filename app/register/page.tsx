'use client';

import { Box, Paper, TextField, Button, Typography, Alert, Card, CardContent } from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { gradients } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      setError('Tüm alanlar gerekli');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalı');
      return;
    }

    setLoading(true);

    try {
      await registerUser(formData.username, formData.email, formData.password);
      // register başarılıysa otomatik olarak dashboard'a yönlendirilir
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
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
        {/* Header with gradient - Login sayfasıyla aynı */}
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
            Kayıt Ol
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontSize: '16px',
            }}
          >
            Hesabınızı oluşturun
          </Typography>
        </Box>

        {/* Form */}
        <CardContent sx={{ padding: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Kullanıcı Adı"
                variant="outlined"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                label="E-posta"
                type="email"
                variant="outlined"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                helperText="En az 8 karakter"
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
                label="Şifre Tekrar"
                type="password"
                variant="outlined"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
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
              Zaten hesabınız var mı?{' '}
              <Button
                variant="text"
                size="small"
                sx={{ 
                  textTransform: 'none', 
                  color: 'primary.main',
                  fontWeight: 500,
                }}
                onClick={() => router.push('/login')}
              >
                Giriş Yap
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

