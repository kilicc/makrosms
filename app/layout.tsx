import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MUIThemeProvider from '@/components/ThemeProvider';
import { AuthProvider } from '@/hooks/useAuth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Advanced SMS Verification System',
  description: 'Gelişmiş SMS Doğrulama Sistemi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <MUIThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
}

