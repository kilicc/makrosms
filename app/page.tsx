'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

// Ana sayfa - Subdomain'e göre yönlendirme
export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Auth kontrolü tamamlanana kadar bekle
    if (loading) {
      return;
    }

    // Subdomain'i al
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const parts = hostname.split('.');
    const subdomain = parts.length > 2 ? parts[0] : '';
    
    // support.makrosms.com subdomain'i için kısa linkler kullanılır, ana sayfaya yönlendirme yapma
    if (subdomain === 'support') {
      return;
    }
    
    // Eğer kullanıcı giriş yapmışsa
    if (user) {
      // Admin kullanıcı ise admin paneline yönlendir
      const isAdmin = user.role?.toLowerCase() === 'admin' || 
                      user.role?.toLowerCase() === 'moderator' || 
                      user.role?.toLowerCase() === 'administrator';
      
      if (isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Kullanıcı giriş yapmamışsa login'e yönlendir
      router.push('/login');
    }
  }, [router, user, loading]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <p>Yönlendiriliyor...</p>
    </div>
  );
}

