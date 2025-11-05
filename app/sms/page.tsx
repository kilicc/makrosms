'use client';

import { Box, Container, Typography, Paper, TextField, Button, Grid, Alert } from '@mui/material';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Send } from '@mui/icons-material';

export default function SMSInterfacePage() {
  const { api } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/sms/send', {
        phone: formData.phone,
        message: formData.message,
        serviceName: 'CepSMS',
      });

      if (response.data.success) {
        setSuccess('SMS başarıyla gönderildi');
        setFormData({ phone: '', message: '' });
        // Success mesajını 3 saniye sonra otomatik kapat
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'SMS gönderim hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            padding: { xs: 2, sm: 2, md: 2.5 },
            paddingLeft: { xs: 2, sm: 2, md: 2.5 },
            marginLeft: { xs: 0, md: '280px' },
            width: { xs: '100%', md: 'calc(100% - 280px)' },
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: { md: '1400px' },
            mx: { md: 'auto' },
          }}
        >
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                color: 'primary.main', 
                mb: 2,
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              SMS Gönder
            </Typography>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                fontSize: '13px',
              }}
            >
              CepSMS servisini kullanarak tek bir telefon numarasına SMS gönderin.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                {success}
              </Alert>
            )}

            <Paper sx={{ p: 2.5, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Telefon Numarası"
                      variant="outlined"
                      size="small"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="905xxxxxxxxx"
                      required
                      helperText="Telefon numarasını 90 veya 5 ile başlayarak girin (örn: 905551234567)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          fontSize: '14px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Mesaj İçeriği"
                      variant="outlined"
                      size="small"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      helperText={`Mesaj karakter sayısı: ${formData.message.length}`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          fontSize: '14px',
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(25, 118, 210, 0.05)', 
                      borderRadius: 1.5,
                      mb: 1.5,
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                        <strong>Servis:</strong> CepSMS
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                        <strong>Maliyet:</strong> 1 SMS = 1 Kredi
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      startIcon={<Send />}
                      disabled={loading}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                        borderRadius: 1.5,
                        padding: '8px 20px',
                        fontWeight: 500,
                        fontSize: '14px',
                        textTransform: 'none',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s',
                      }}
                    >
                      {loading ? 'Gönderiliyor...' : 'SMS Gönder'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}

