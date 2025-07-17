// src/app/layout.js
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SMSBRA - Painel',
  description: 'Painel administrativo para serviços de SMS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" data-scroll-behavior="smooth"> {/* ADICIONADO AQUI */}
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}