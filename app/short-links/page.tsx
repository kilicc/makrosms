'use client';

import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, alpha } from '@mui/material';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { Link, BarChart, ContentCopy, Visibility } from '@mui/icons-material';
import ClientDate from '@/components/ClientDate';

interface ShortLink {
  id: string;
  original_url: string;
  short_code: string;
  title: string | null;
  description: string | null;
  click_count: number;
  unique_click_count: number;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface ShortLinkClick {
  id: string;
  ip_address: string;
  user_agent: string | null;
  referer: string | null;
  country: string | null;
  city: string | null;
  clicked_at: string;
}

export default function ShortLinksPage() {
  const { api } = useAuth();
  const { mode } = useTheme();
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<ShortLink | null>(null);
  const [linkStats, setLinkStats] = useState<{ clicks: ShortLinkClick[]; totalClicks: number; uniqueClicks: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    loadShortLinks();
  }, []);

  const loadShortLinks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/short-links');
      if (response.data.success) {
        setShortLinks(response.data.data.shortLinks || []);
      } else {
        setError(response.data.message || 'Kısa linkler yüklenirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Short links load error:', error);
      setError(error.response?.data?.message || 'Kısa linkler yüklenirken bir hata oluştu');
      setShortLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStats = async (link: ShortLink) => {
    setSelectedLink(link);
    setStatsDialogOpen(true);
    setLoadingStats(true);
    setError('');

    try {
      const response = await api.get(`/short-links/stats/${link.id}`);
      if (response.data.success) {
        setLinkStats(response.data.data.stats);
      } else {
        setError(response.data.message || 'İstatistikler yüklenirken bir hata oluştu');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoadingStats(false);
    }
  };

  const copyShortLink = (shortCode: string) => {
    const shortLink = `${window.location.origin}/s/${shortCode}`;
    navigator.clipboard.writeText(shortLink);
    setSuccess('Kısa link kopyalandı!');
    setTimeout(() => setSuccess(''), 3000);
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
            Kısa Linklerim
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              fontSize: '12px',
            }}
          >
            Oluşturduğunuz kısa linkleri görüntüleyin ve istatistiklerini kontrol edin.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <Paper sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : shortLinks.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Henüz kısa link oluşturulmamış. SMS gönder sayfasından kısa link oluşturabilirsiniz.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '12px', fontWeight: 600, py: 1 }}>Kısa Link</TableCell>
                      <TableCell sx={{ fontSize: '12px', fontWeight: 600, py: 1 }}>Orijinal URL</TableCell>
                      <TableCell sx={{ fontSize: '12px', fontWeight: 600, py: 1 }}>Toplam Tıklama</TableCell>
                      <TableCell sx={{ fontSize: '12px', fontWeight: 600, py: 1 }}>Benzersiz Tıklama</TableCell>
                      <TableCell sx={{ fontSize: '12px', fontWeight: 600, py: 1 }}>Oluşturulma</TableCell>
                      <TableCell sx={{ fontSize: '12px', fontWeight: 600, py: 1 }}>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shortLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell sx={{ fontSize: '12px', py: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '12px', fontFamily: 'monospace' }}>
                              {window.location.origin}/s/{link.short_code}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyShortLink(link.short_code)}
                              sx={{ p: 0.5 }}
                            >
                              <ContentCopy sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', py: 0.75, maxWidth: 200 }}>
                          <Typography variant="body2" sx={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.original_url}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', py: 0.75 }}>
                          <Chip
                            label={link.click_count}
                            size="small"
                            color="primary"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              height: 20,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', py: 0.75 }}>
                          <Chip
                            label={link.unique_click_count}
                            size="small"
                            color="success"
                            sx={{
                              fontSize: '0.65rem',
                              fontWeight: 500,
                              height: 20,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', py: 0.75 }}>
                          <ClientDate date={link.created_at} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', py: 0.75 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewStats(link)}
                            sx={{ p: 0.5 }}
                          >
                            <BarChart sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* İstatistik Dialog */}
          <Dialog 
            open={statsDialogOpen} 
            onClose={() => {
              setStatsDialogOpen(false);
              setSelectedLink(null);
              setLinkStats(null);
            }} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle sx={{ fontSize: '16px', fontWeight: 600, pb: 1 }}>
              Kısa Link İstatistikleri
            </DialogTitle>
            <DialogContent sx={{ pt: 1.5 }}>
              {selectedLink && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                    <strong>Kısa Link:</strong> {window.location.origin}/s/{selectedLink.short_code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', mb: 0.5 }}>
                    <strong>Orijinal URL:</strong> {selectedLink.original_url}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                    <Chip
                      label={`Toplam: ${linkStats?.totalClicks || 0}`}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={`Benzersiz: ${linkStats?.uniqueClicks || 0}`}
                      color="success"
                      size="small"
                    />
                  </Box>
                </Box>
              )}

              {loadingStats ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : linkStats && linkStats.clicks.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>IP Adresi</TableCell>
                        <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>Tarih</TableCell>
                        <TableCell sx={{ fontSize: '12px', fontWeight: 600 }}>Referer</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {linkStats.clicks.map((click) => (
                        <TableRow key={click.id}>
                          <TableCell sx={{ fontSize: '12px' }}>{click.ip_address}</TableCell>
                          <TableCell sx={{ fontSize: '12px' }}>
                            <ClientDate date={click.clicked_at} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '12px' }}>
                            {click.referer || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Henüz tıklama kaydı yok.
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 1.5 }}>
              <Button size="small" onClick={() => {
                setStatsDialogOpen(false);
                setSelectedLink(null);
                setLinkStats(null);
              }} sx={{ fontSize: '12px' }}>
                Kapat
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}

