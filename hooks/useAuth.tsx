'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
  credit: number;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  api: typeof api;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API URL'ini dinamik olarak belirle (subdomain'e göre)
// Axios instance - baseURL runtime'da belirlenir
const api = axios.create({
  baseURL: '/api', // Relative path kullan (subdomain'e göre otomatik çalışır)
  headers: {
    'Content-Type': 'application/json',
  },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // User state'ini localStorage'dan restore et (sayfa yenilemelerinde)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const router = useRouter();

  // User state'ini localStorage'dan restore et (sayfa yenilemelerinde ve sayfa geçişlerinde)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      
      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('User localStorage\'dan restore ediliyor:', parsedUser.username);
          setUser(parsedUser);
          setLoading(false);
          // Restore edilen user'ı doğrula (checkAuth çağrılacak ama user zaten var)
          setHasCheckedAuth(true);
        } catch (error) {
          console.error('User restore error:', error);
        }
      } else if (!token) {
        // Token yok, user da null
        setUser(null);
        setLoading(false);
      }
    }
  }, []);

  // Request interceptor - Token ekle
  api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  // Response interceptor - 401 hatasını yakala ama logout yapma
  // Logout işlemi sadece checkAuth içinde yapılmalı
  // Bu sayede her API çağrısında logout yapılmaz
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // 401 hatası alındığında sadece error'u döndür
      // Logout işlemi checkAuth içinde yapılacak
      // Bu sayede her sayfa geçişinde logout yapılmaz
      if (error.response?.status === 401) {
        // Sadece error'u döndür, logout yapma
        // Logout işlemi sadece checkAuth içinde yapılacak
        // Bu sayede her API çağrısında logout yapılmaz
      }
      return Promise.reject(error);
    }
  );

  // Check if user is logged in on mount - sadece bir kez çalıştır
  useEffect(() => {
    if (!hasCheckedAuth) {
      checkAuth();
      setHasCheckedAuth(true);
    }
  }, [hasCheckedAuth]);

  // Token varsa ama user yoksa, checkAuth'u tekrar çağır (sayfa geçişlerinde)
  useEffect(() => {
    if (!loading && !user && hasCheckedAuth) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token) {
        // Token var ama user yok, checkAuth'u tekrar çağır
        console.log('Token var ama user yok, checkAuth tekrar çağrılıyor...');
        checkAuth();
      }
    }
  }, [loading, user, hasCheckedAuth]);

  async function checkAuth() {
    try {
      console.log('checkAuth çalışıyor...');
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        console.log('Token kontrolü:', { tokenExists: !!token, hasUser: !!user });
        
        if (token) {
          try {
            console.log('Profile API çağrısı yapılıyor...');
            const response = await api.get('/auth/profile');
            console.log('Profile API response:', response.data.success);
            
            if (response.data.success && response.data.data?.user) {
              console.log('User set ediliyor:', response.data.data.user.username);
              setUser(response.data.data.user);
              // User'ı localStorage'a kaydet (sayfa yenilemelerinde restore etmek için)
              if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
              }
            } else {
              // Token geçersiz, logout yap
              console.log('Token geçersiz - logout yapılıyor');
              logout();
            }
          } catch (profileError: any) {
            // /auth/profile endpoint'inden hata geldi
            console.error('Profile error:', profileError.response?.status, profileError.response?.data, profileError.message);
            if (profileError.response?.status === 401) {
              // Token geçersiz, logout yap
              console.log('401 hatası - logout yapılıyor');
              logout();
            } else {
              // Network hatası veya başka bir hata, token'ı koru
              // Sadece user'ı null yap, logout yapma
              console.log('Network hatası - token korunuyor');
              setUser(null);
            }
          }
        } else {
          // Token yok, user null
          console.log('Token yok');
          setUser(null);
        }
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      // Sadece 401 (Unauthorized) hatası için logout yap
      // Diğer hatalar (network, timeout) için token'ı koru
      if (error.response?.status === 401) {
        // Token geçersiz, logout yap
        logout();
      } else {
        // Network hatası veya başka bir hata, token'ı koru
        // Sadece loading'i false yap
        setUser(null);
      }
    } finally {
      setLoading(false);
      console.log('checkAuth tamamlandı');
    }
  }

  async function login(login: string, password: string) {
    try {
      const response = await api.post('/auth/login', { login, password });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        console.log('Login başarılı:', { user: user?.username, tokenExists: !!tokens?.accessToken });
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          console.log('Token localStorage\'a kaydedildi');
        }
        
        // User'ı set et - checkAuth'u tekrar çağırma
        setUser(user);
        setLoading(false); // Loading'i false yap
        setHasCheckedAuth(true); // checkAuth'u tekrar çalıştırma
        
        // User'ı localStorage'a kaydet (sayfa yenilemelerinde restore etmek için)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
        
        console.log('User set edildi, yönlendiriliyor...');
        
        // Subdomain'e göre yönlendirme
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const subdomain = hostname.split('.')[0];
        
        // Admin subdomain (panel.finsms.io) -> /admin
        if (subdomain === 'panel') {
          console.log('Admin sayfasına yönlendiriliyor...');
          router.push('/admin');
        } 
        // Platform subdomain (platform.finsms.io) veya localhost -> /dashboard
        else {
          console.log('Dashboard\'a yönlendiriliyor...');
          router.push('/dashboard');
        }
      } else {
        throw new Error(response.data.message || 'Giriş başarısız');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Giriş başarısız');
    }
  }


  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user'); // User'ı da temizle
    }
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

