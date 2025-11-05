'use client';

import { Box, Container, Typography, Paper, Grid, Avatar, Card, CardContent, alpha, CircularProgress, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

function getTimeAgo(date: Date): string {
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: tr });
  } catch {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} gün önce`;
  }
}
import { gradients } from '@/lib/theme';
import { AttachMoney, Send, Person, Warning } from '@mui/icons-material';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  credit: number;
  sentThisMonth: number;
  totalContacts: number;
  failedSMS: number;
}

interface RecentActivity {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  sentAt: string;
}

export default function DashboardPage() {
  const { user, api } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    credit: 0,
    sentThisMonth: 0,
    totalContacts: 0,
    failedSMS: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load stats
      const [contactsStats, smsHistory] = await Promise.all([
        api.get('/contacts/stats'),
        api.get('/bulk-sms/history?limit=5'),
      ]);

      if (contactsStats.data.success) {
        const statsData = contactsStats.data.data;
        setStats((prev) => ({
          ...prev,
          totalContacts: statsData.totalContacts || 0,
          failedSMS: statsData.failedSMS || 0,
        }));
      }

      if (smsHistory.data.success) {
        const messages = smsHistory.data.data.messages || [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const sentThisMonth = messages.filter((msg: RecentActivity) => {
          const sentDate = new Date(msg.sentAt);
          return sentDate >= startOfMonth && msg.status === 'sent';
        }).length;

        setStats((prev) => ({
          ...prev,
          credit: user?.credit || 0,
          sentThisMonth,
        }));

        setRecentActivities(messages.slice(0, 5));
      }
    } catch (error) {
      console.error('Dashboard data load error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Mevcut Kredi',
      value: stats.credit.toString(),
      subtitle: 'SMS',
      icon: <AttachMoney />,
      color: '#4caf50',
      path: '/payment',
    },
    {
      title: 'Bu Ay Gönderilen',
      value: stats.sentThisMonth.toString(),
      subtitle: 'SMS',
      icon: <Send />,
      color: '#2196f3',
      path: '/reports',
    },
    {
      title: 'Kayıtlı Kişi',
      value: stats.totalContacts.toString(),
      subtitle: 'Rehber',
      icon: <Person />,
      color: '#ff9800',
      path: '/contacts',
    },
    {
      title: 'Toplam Hata',
      value: stats.failedSMS.toString(),
      subtitle: 'Başarısız SMS',
      icon: <Warning />,
      color: '#f44336',
      path: '/refunds',
    },
  ];

  return (
    <ProtectedRoute>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
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
              mb: 3,
              fontSize: '34px',
              fontWeight: 600,
            }}
          >
            Dashboard
          </Typography>

          {/* Stat Cards Grid - HTML_TEMPLATES.html'e göre */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {statCards.map((card, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }} key={index}>
                <Card
                  onClick={() => router.push(card.path)}
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.05) 100%)',
                    border: `1px solid ${alpha('#1976d2', 0.1)}`,
                    borderRadius: 2,
                    p: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: `1px solid ${alpha('#1976d2', 0.3)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        gutterBottom
                        sx={{
                          fontSize: '14px',
                          mb: 1,
                        }}
                      >
                        {card.title}
                      </Typography>
                      <Typography
                        variant="h4"
                        color="primary"
                        sx={{ 
                          fontWeight: 600, 
                          mb: 0.5,
                          fontSize: '34px',
                        }}
                      >
                        {card.value}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{
                          fontSize: '12px',
                        }}
                      >
                        {card.subtitle}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: card.color,
                        width: 56,
                        height: 56,
                      }}
                    >
                      {card.icon}
                    </Avatar>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Recent Activity Card - HTML_TEMPLATES.html'e göre */}
          <Card 
            sx={{ 
              borderRadius: 2, 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              p: 3,
            }}
          >
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                mb: 2,
                fontSize: '24px',
                fontWeight: 500,
              }}
            >
              Son Aktiviteler
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => {
                  const sentDate = new Date(activity.sentAt);
                  const timeAgo = getTimeAgo(sentDate);
                  const isSuccess = activity.status === 'sent' || activity.status === 'delivered';
                  const isFailed = activity.status === 'failed';

                  return (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        padding: 1.5,
                        background: isSuccess
                          ? alpha('#4caf50', 0.05)
                          : isFailed
                          ? alpha('#f44336', 0.05)
                          : alpha('#1976d2', 0.05),
                        borderRadius: 2,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: isSuccess ? '#4caf50' : isFailed ? '#f44336' : 'primary.main',
                          width: 32,
                          height: 32,
                          fontSize: '14px',
                        }}
                      >
                        {activity.status === 'sent' || activity.status === 'delivered'
                          ? '✓'
                          : activity.status === 'failed'
                          ? '✗'
                          : 'S'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: '16px',
                          }}
                        >
                          SMS Gönderildi
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            fontSize: '12px',
                          }}
                        >
                          {activity.phoneNumber} - {timeAgo}
                        </Typography>
                      </Box>
                      <Chip
                        label={activity.status === 'sent' || activity.status === 'delivered'
                          ? 'Başarılı'
                          : activity.status === 'failed'
                          ? 'Başarısız'
                          : activity.status}
                        color={isSuccess ? 'success' : isFailed ? 'error' : 'info'}
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          height: 24,
                        }}
                      />
                    </Box>
                  );
                })
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    textAlign: 'center', 
                    py: 2,
                    fontSize: '14px',
                  }}
                >
                  Henüz aktivite yok
                </Typography>
              )}
            </Box>
          </Card>
        </Container>
      </Box>
    </Box>
    </ProtectedRoute>
  );
}

