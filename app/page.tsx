'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Ana sayfa - Dashboard'a yönlendirme
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

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

