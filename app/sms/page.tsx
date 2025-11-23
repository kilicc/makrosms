'use client';

import { Box, Container, Typography, Paper, TextField, Button, Grid, Alert, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, CircularProgress } from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Send, Description, Close, Link, ContentCopy, BarChart, OpenInNew, Add, CheckCircle } from '@mui/icons-material';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export default function SMSInterfacePage() {
  const { api } = useAuth();
  const { mode } = useTheme();
  const [formData, setFormData] = useState({
    phone: '',
    message: '',
  });
  const MAX_CHARACTERS = 180;
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shortLinkEnabled, setShortLinkEnabled] = useState(false);
  const [shortLinkUrl, setShortLinkUrl] = useState('');
  const [shortLinkDialogOpen, setShortLinkDialogOpen] = useState(false);
  const [shortLinkStats, setShortLinkStats] = useState<any>(null);
  const [createdShortLink, setCreatedShortLink] = useState<{ shortCode: string; originalUrl: string; shortLink: string } | null>(null);
  const [shortLinks, setShortLinks] = useState<any[]>([]);
  const [loadingShortLinks, setLoadingShortLinks] = useState(false);
  const [selectedShortLinkId, setSelectedShortLinkId] = useState<string>('');
  const [shortLinkSelectDialogOpen, setShortLinkSelectDialogOpen] = useState(false);
  
  // Progress tracking states
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    total: number;
    completed: number;
    successCount: number;
    failCount: number;
    currentBatch: number;
    totalBatches: number;
    percentage: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    estimatedTimeRemaining: number | null;
  } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTemplates();
    loadShortLinks();
  }, []);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Progress polling
  const checkProgress = async (jobId: string) => {
    try {
      const response = await api.get(`/sms/progress/${jobId}`);
      if (response.data.success) {
        const data = response.data.data;
        setProgress({
          total: data.total,
          completed: data.completed,
          successCount: data.successCount,
          failCount: data.failCount,
          currentBatch: data.currentBatch,
          totalBatches: data.totalBatches,
          percentage: data.percentage,
          status: data.status,
          estimatedTimeRemaining: data.estimatedTimeRemaining,
        });

        // Tamamlandıysa polling'i durdur
        if (data.status === 'completed' || data.status === 'failed') {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          
          // Tamamlandı mesajı göster
          if (data.status === 'completed') {
            setSuccess(`${data.successCount} adet SMS başarıyla gönderildi${data.failCount > 0 ? `, ${data.failCount} adet başarısız` : ''}`);
          } else {
            setError(`SMS gönderim tamamlandı: ${data.failCount} adet başarısız`);
          }
          
          setLoading(false);
          setJobId(null);
        }
      }
    } catch (error: any) {
      console.error('Progress check error:', error);
      // Progress kontrolü başarısız olsa bile devam et
    }
  };

  // Start progress tracking
  const startProgressTracking = (jobId: string) => {
    setJobId(jobId);
    setProgress({
      total: 0,
      completed: 0,
      successCount: 0,
      failCount: 0,
      currentBatch: 0,
      totalBatches: 0,
      percentage: 0,
      status: 'processing',
      estimatedTimeRemaining: null,
    });

    // İlk kontrol
    checkProgress(jobId);

    // Her 2 saniyede bir kontrol et
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      checkProgress(jobId);
    }, 2000);
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get('/sms-templates');
      if (response.data.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (error) {
      console.error('Templates load error:', error);
    }
  };

  const loadShortLinks = async () => {
    try {
      setLoadingShortLinks(true);
      const response = await api.get('/short-links');
      if (response.data.success) {
        setShortLinks(response.data.data.shortLinks || []);
      }
    } catch (error) {
      console.error('Short links load error:', error);
    } finally {
      setLoadingShortLinks(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setFormData({ ...formData, message: template.content });
      }
    } else {
      setFormData({ ...formData, message: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const phoneCount = formData.phone.split(/[,\n]/).filter((p: string) => p.trim()).length;
      
      // Büyük gönderimler için bilgilendirme
      if (phoneCount > 1000) {
        setSuccess(`${phoneCount} numaraya SMS gönderiliyor... Bu işlem birkaç dakika sürebilir. Lütfen bekleyin.`);
      }

      // Timeout'u büyük gönderimler için arttır (her SMS için 5 saniye, minimum 60 saniye)
      const timeout = Math.max(60000, phoneCount * 5000);
      
      const response = await Promise.race([
        api.post('/sms/send', {
          phone: formData.phone,
          message: formData.message,
          serviceName: 'CepSMS',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('İstek zaman aşımına uğradı. SMS\'ler arka planda gönderiliyor olabilir. Lütfen raporları kontrol edin.')), timeout)
        )
      ]) as any;

      if (response.data.success) {
        const { totalSent = 0, totalFailed = 0, jobId: responseJobId } = response.data.data || {};
        
        // Büyük gönderimler için progress tracking başlat
        if (responseJobId && phoneCount >= 1000) {
          startProgressTracking(responseJobId);
          setSuccess(`${phoneCount} numaraya SMS gönderilmeye başlandı. İlerleme durumu aşağıda gösteriliyor.`);
        } else {
          // Küçük gönderimler için normal mesaj
          let message = '';
          if (totalFailed === 0) {
            message = `${totalSent} adet SMS başarıyla gönderildi`;
          } else {
            message = `${totalSent} adet SMS gönderildi, ${totalFailed} adet başarısız. Başarısız mesajlar için kredi 48 saat içinde otomatik iade edilecektir.`;
          }
          setSuccess(message);
          setFormData({ phone: '', message: '' });
          setLoading(false);
          
          // Success mesajını 10 saniye sonra otomatik kapat
          setTimeout(() => {
            setSuccess('');
          }, 10000);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.message || 'SMS gönderim hatası';
      setError(errorMessage);
      
      // Timeout hatası ise kullanıcıyı bilgilendir
      if (errorMessage.includes('zaman aşımı') || errorMessage.includes('timeout')) {
        setError(errorMessage + ' Lütfen raporları kontrol ederek SMS\'lerin durumunu öğrenebilirsiniz.');
      }
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
          backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5',
        }}
      >
        <Navbar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            padding: { xs: 2, sm: 2.5, md: 3 },
            paddingLeft: { xs: 2, sm: 2.5, md: 3 },
            paddingRight: { xs: 2, sm: 2.5, md: 3 },
            paddingTop: { xs: 3, sm: 3.5, md: 4 },
            marginLeft: { xs: 0, md: '240px' },
            width: { xs: '100%', md: 'calc(100% - 240px)' },
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
                mb: 2.5,
                mt: 1,
                fontSize: '18px',
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
                fontSize: '12px',
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

            {/* Progress Tracking UI - Büyük gönderimler için */}
            {progress && jobId && progress.status === 'processing' && (
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? '#1e1e1e' : '#fff',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  SMS Gönderim İlerlemesi
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      İlerleme: {progress.completed.toLocaleString('tr-TR')} / {progress.total.toLocaleString('tr-TR')}
                    </Typography>
                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                      %{progress.percentage}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: mode === 'dark' ? '#424242' : '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Toplam
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {progress.total.toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Tamamlanan
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {progress.completed.toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Başarılı
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {progress.successCount.toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Başarısız
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {progress.failCount.toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                </Box>

                {progress.totalBatches > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Batch: {progress.currentBatch} / {progress.totalBatches}
                    </Typography>
                  </Box>
                )}

                {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tahmini Kalan Süre: ~{Math.round(progress.estimatedTimeRemaining / 60)} dakika
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Gönderim devam ediyor... Sayfa yenilenirse Job ID: {jobId}
                  </Typography>
                </Box>
              </Paper>
            )}

            {progress && jobId && (progress.status === 'completed' || progress.status === 'failed') && (
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: mode === 'dark' ? '#1e1e1e' : '#fff',
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Gönderim Tamamlandı
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  color={progress.status === 'completed' ? 'success' : 'error'}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    mb: 2,
                  }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">Toplam</Typography>
                    <Typography variant="h6">{progress.total.toLocaleString('tr-TR')}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">Başarılı</Typography>
                    <Typography variant="h6" color="success.main">
                      {progress.successCount.toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '120px' }}>
                    <Typography variant="caption" color="text.secondary">Başarısız</Typography>
                    <Typography variant="h6" color="error.main">
                      {progress.failCount.toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            <Paper sx={{ 
              p: 2, 
              borderRadius: 2, 
              boxShadow: mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
              backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
            }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Telefon Numarası"
                      variant="outlined"
                      size="small"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Birden fazla numara girişi için (virgül veya yeni satır ile ayrılmış)
                        // Sadece 905**, 05**, 5** formatlarını kabul et
                        const phoneRegex = /^[\d\s,\n]*$/;
                        if (phoneRegex.test(value) || value === '') {
                          setFormData({ ...formData, phone: value });
                        }
                      }}
                      placeholder="905xxxxxxxxx veya birden fazla numara (virgülle ayırın)"
                      required
                      multiline
                      rows={3}
                      helperText="Format: 905**, 05**, 5** (Birden fazla numara için virgül veya yeni satır kullanın)"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                          fontSize: '14px',
                        },
                      }}
                    />
                  </Grid>

                  {templates.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Şablon Seç</InputLabel>
                        <Select
                          value={selectedTemplateId}
                          label="Şablon Seç"
                          onChange={(e) => handleTemplateSelect(e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              fontSize: '14px',
                            },
                          }}
                          endAdornment={
                            selectedTemplateId ? (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect('');
                                }}
                                sx={{ mr: 1 }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            ) : null
                          }
                        >
                          <MenuItem value="">Şablon Seçme</MenuItem>
                          {templates.map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Description sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontSize: '13px' }}>
                                    {template.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                                    {template.category}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Kısa Link Modülü */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1.5,
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      bgcolor: 'rgba(33, 150, 243, 0.05)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Link sx={{ fontSize: 18, color: 'primary.main' }} />
                          <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600 }}>
                            Kısa Link
                          </Typography>
                        </Box>
                        <Chip
                          label={shortLinkEnabled ? 'Aktif' : 'Pasif'}
                          size="small"
                          color={shortLinkEnabled ? 'success' : 'default'}
                          onClick={() => setShortLinkEnabled(!shortLinkEnabled)}
                          sx={{ cursor: 'pointer', fontSize: '11px', height: 22 }}
                        />
                      </Box>
                      {shortLinkEnabled && (
                        <Box sx={{ mt: 1.5 }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Mevcut Kısa Link Seç</InputLabel>
                              <Select
                                value={selectedShortLinkId}
                                onChange={(e) => {
                                  const linkId = e.target.value as string;
                                  setSelectedShortLinkId(linkId);
                                  if (linkId) {
                                    const link = shortLinks.find(l => l.id === linkId);
                                    if (link) {
                                      const shortLinkDomain = process.env.NEXT_PUBLIC_SHORT_LINK_DOMAIN || 'support.makrosms.com';
                                      const shortLink = `https://${shortLinkDomain}/${link.short_code}`;
                                      const newMessage = formData.message + ' ' + shortLink;
                                      // 180 karakter limiti kontrolü
                                      if (newMessage.length <= MAX_CHARACTERS) {
                                        setFormData({ ...formData, message: newMessage });
                                        setSelectedShortLinkId('');
                                        setSuccess('Kısa link mesaja eklendi!');
                                        setTimeout(() => setSuccess(''), 3000);
                                      } else {
                                        setError('Kısa link eklendiğinde mesaj 180 karakteri aşıyor!');
                                        setSelectedShortLinkId('');
                                      }
                                    }
                                  }
                                }}
                                label="Mevcut Kısa Link Seç"
                                sx={{
                                  borderRadius: 1.5,
                                  fontSize: '14px',
                                }}
                              >
                                <MenuItem value="">
                                  <em>Kısa link seçin</em>
                                </MenuItem>
                                {shortLinks.map((link) => {
                                  const shortLinkDomain = process.env.NEXT_PUBLIC_SHORT_LINK_DOMAIN || 'support.makrosms.com';
                                  const shortLink = `https://${shortLinkDomain}/${link.short_code}`;
                                  return (
                                    <MenuItem key={link.id} value={link.id}>
                                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                                        <Typography variant="body2" sx={{ fontSize: '12px', fontWeight: 600 }}>
                                          {shortLink}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                                          {link.original_url.length > 50 ? link.original_url.substring(0, 50) + '...' : link.original_url}
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                  );
                                })}
                              </Select>
                            </FormControl>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Add />}
                              onClick={() => setShortLinkSelectDialogOpen(true)}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontSize: '13px',
                                whiteSpace: 'nowrap',
                                minWidth: 'auto',
                              }}
                            >
                              Yeni Oluştur
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px', display: 'block' }}>
                            Mevcut kısa linklerinizden seçin veya yeni bir kısa link oluşturun
                          </Typography>
                        </Box>
                      )}
                    </Box>
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
                      onChange={(e) => {
                        const value = e.target.value;
                        // 180 karakter limiti
                        if (value.length <= MAX_CHARACTERS) {
                          setFormData({ ...formData, message: value });
                          if (selectedTemplateId) {
                            setSelectedTemplateId('');
                          }
                        }
                      }}
                      required
                      inputProps={{
                        maxLength: MAX_CHARACTERS,
                      }}
                      helperText={`${MAX_CHARACTERS - formData.message.length} karakter kaldı (180 karakter = 1 kredi)`}
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
                      bgcolor: 'rgba(33, 150, 243, 0.05)', 
                      borderRadius: 1.5,
                      mb: 1.5,
                    }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                        <strong>Servis:</strong> CepSMS
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px' }}>
                        <strong>Maliyet:</strong> 180 karakter = 1 Kredi (her numara için)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mt: 0.5 }}>
                        <strong>Mesaj Uzunluğu:</strong> {formData.message.length} / {MAX_CHARACTERS} karakter
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mt: 0.5 }}>
                        <strong>Numara Sayısı:</strong> {formData.phone ? formData.phone.split(/[,\n]/).filter((p: string) => p.trim()).length : 0} adet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mt: 0.5 }}>
                        <strong>Tahmini Kredi:</strong> {
                          formData.phone && formData.message.length > 0
                            ? (Math.ceil(formData.message.length / MAX_CHARACTERS) || 1) * formData.phone.split(/[,\n]/).filter((p: string) => p.trim()).length
                            : 0
                        } kredi ({Math.ceil(formData.message.length / MAX_CHARACTERS) || 1} kredi × {formData.phone ? formData.phone.split(/[,\n]/).filter((p: string) => p.trim()).length : 0} numara)
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
                        background: 'linear-gradient(135deg, #2196F3 0%, #F44336 100%)',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.25)',
                        borderRadius: 1.5,
                        padding: '8px 20px',
                        fontWeight: 500,
                        fontSize: '14px',
                        textTransform: 'none',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(33, 150, 243, 0.35)',
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

        {/* Kısa Link Oluşturuldu Dialog */}
        <Dialog
          open={shortLinkDialogOpen}
          onClose={() => {
            setShortLinkDialogOpen(false);
            setCreatedShortLink(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Link sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Short link successfully created</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            {createdShortLink && (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '13px', fontWeight: 600 }}>
                    Long URL:
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '13px', fontFamily: 'monospace' }}>
                      {createdShortLink.originalUrl}
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '13px', fontWeight: 600 }}>
                    Generated Link:
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'primary.main',
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: '18px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: 'primary.main',
                        wordBreak: 'break-all',
                      }}
                    >
                      {createdShortLink.shortLink}
                    </Typography>
                  </Paper>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<ContentCopy />}
                    onClick={() => {
                      navigator.clipboard.writeText(createdShortLink.shortLink);
                      setSuccess('Kısa link kopyalandı!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    sx={{ flex: 1, minWidth: '120px' }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<OpenInNew />}
                    onClick={() => {
                      window.open(createdShortLink.originalUrl, '_blank');
                    }}
                    sx={{ flex: 1, minWidth: '120px' }}
                  >
                    Go
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BarChart />}
                    onClick={() => {
                      window.open(`/short-links`, '_blank');
                    }}
                    sx={{ flex: 1, minWidth: '120px' }}
                  >
                    Statistics
                  </Button>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      const newMessage = formData.message + ' ' + createdShortLink.shortLink;
                      // 180 karakter limiti kontrolü
                      if (newMessage.length <= MAX_CHARACTERS) {
                        setFormData({ ...formData, message: newMessage });
                        setSuccess('Kısa link mesaja eklendi!');
                        setShortLinkDialogOpen(false);
                        setCreatedShortLink(null);
                      } else {
                        setError('Kısa link eklendiğinde mesaj 180 karakteri aşıyor!');
                      }
                    }}
                  >
                    Mesaja Ekle
                  </Button>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontSize: '11px', fontStyle: 'italic', textAlign: 'center' }}>
                  Your links will be shortened via <strong>support.makrosms.com</strong> address.
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShortLinkDialogOpen(false);
              setCreatedShortLink(null);
            }}>
              Kapat
            </Button>
          </DialogActions>
        </Dialog>

        {/* Kısa Link Seçimi ve Oluşturma Dialog */}
        <Dialog
          open={shortLinkSelectDialogOpen}
          onClose={() => {
            setShortLinkSelectDialogOpen(false);
            setShortLinkUrl('');
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Link sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontSize: '16px', fontWeight: 600 }}>
                  Kısa Link Oluştur
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => {
                  setShortLinkSelectDialogOpen(false);
                  setShortLinkUrl('');
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box>
              <TextField
                fullWidth
                size="small"
                label="URL"
                value={shortLinkUrl}
                onChange={(e) => setShortLinkUrl(e.target.value)}
                placeholder="https://example.com"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    fontSize: '14px',
                  },
                }}
              />
              <Alert severity="info" sx={{ fontSize: '12px', mb: 2 }}>
                Kısa linkiniz <strong>support.makrosms.com</strong> adresi üzerinden oluşturulacak ve IP tabanlı istatistikler takip edilecektir.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 2, pb: 1.5 }}>
            <Button
              onClick={() => {
                setShortLinkSelectDialogOpen(false);
                setShortLinkUrl('');
              }}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '12px' }}
            >
              İptal
            </Button>
            <Button
              onClick={async () => {
                if (!shortLinkUrl) {
                  setError('URL gerekli');
                  return;
                }
                try {
                  const response = await api.post('/short-links', {
                    originalUrl: shortLinkUrl,
                    title: 'SMS Kısa Link',
                  });
                  if (response.data.success) {
                    const shortCode = response.data.data.shortLink.short_code;
                    const shortLinkDomain = process.env.NEXT_PUBLIC_SHORT_LINK_DOMAIN || 'support.makrosms.com';
                    const normalizedDomain = shortLinkDomain.startsWith('http')
                      ? shortLinkDomain
                      : `https://${shortLinkDomain}`;
                    const normalizedBase = normalizedDomain.endsWith('/')
                      ? normalizedDomain.slice(0, -1)
                      : normalizedDomain;
                    const shortLink = `${normalizedBase}/${shortCode}`;
                    
                    // Dialog'u aç ve oluşturulan linki göster
                    setCreatedShortLink({
                      shortCode,
                      originalUrl: shortLinkUrl,
                      shortLink,
                    });
                    setShortLinkSelectDialogOpen(false);
                    setShortLinkDialogOpen(true);
                    setShortLinkUrl('');
                    loadShortLinks(); // Listeyi yenile
                  }
                } catch (err: any) {
                  setError(err.response?.data?.message || 'Kısa link oluşturulamadı');
                }
              }}
              variant="contained"
              size="small"
              disabled={!shortLinkUrl}
              sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '12px' }}
            >
              Oluştur
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProtectedRoute>
  );
}

