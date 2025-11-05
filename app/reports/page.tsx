'use client';

import { Box, Container, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, Button } from '@mui/material';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Assessment, FilterList } from '@mui/icons-material';
import { gradients } from '@/lib/theme';

interface SmsMessage {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  cost: number;
  sentAt: string;
  contact?: {
    name: string;
    phone: string;
  };
}

export default function SMSReportsPage() {
  const { api } = useAuth();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await api.get('/bulk-sms/history', { params });
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error('History load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'delivered':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
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
            padding: { xs: 2, sm: 3, md: 3 },
            paddingLeft: { xs: 2, sm: 3, md: 2 },
            paddingRight: { xs: 2, sm: 3, md: 3 },
            marginLeft: { xs: 0, md: '280px' },
            width: { xs: '100%', md: 'calc(100% - 280px)' },
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Container 
            maxWidth={false}
            disableGutters
            sx={{ 
              px: { xs: 2, sm: 3, md: 2 },
              width: '100%',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              sx={{ 
                color: 'primary.main', 
                mb: 2,
                fontSize: '34px',
                fontWeight: 600,
              }}
            >
              SMS Raporları
            </Typography>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontSize: '14px',
              }}
            >
              Gönderilen SMS'lerin detaylı raporlarını görüntüleyin. Tarih, durum ve kişi bazında filtreleme yapabilirsiniz.
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Başlangıç Tarihi"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Bitiş Tarihi"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    label="Durum"
                    select
                    SelectProps={{ native: true }}
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <option value="">Tümü</option>
                    <option value="sent">Gönderildi</option>
                    <option value="delivered">İletildi</option>
                    <option value="failed">Başarısız</option>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<FilterList />}
                    onClick={loadHistory}
                    disabled={loading}
                    sx={{
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
                    Filtrele
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Messages Table */}
            <Paper sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Kişi</TableCell>
                      <TableCell>Telefon</TableCell>
                      <TableCell>Mesaj</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Maliyet</TableCell>
                      <TableCell>Tarih</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell>{message.contact?.name || '-'}</TableCell>
                        <TableCell>{message.phoneNumber}</TableCell>
                        <TableCell>{message.message.substring(0, 50)}...</TableCell>
                        <TableCell>
                          <Chip
                            label={message.status}
                            color={getStatusColor(message.status)}
                            size="small"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              height: 24,
                            }}
                          />
                        </TableCell>
                        <TableCell>{Number(message.cost)} kredi</TableCell>
                        <TableCell>
                          {new Date(message.sentAt).toLocaleString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Container>
        </Box>
      </Box>
    </ProtectedRoute>
  );
}

