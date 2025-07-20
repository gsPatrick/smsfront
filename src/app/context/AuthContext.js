// src/context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

const API_BASE_URL = 'https://jackbear-sms.r954jc.easypanel.host';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const loadUserFromStorage = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      // =========================================================================
      // CORREÇÃO APLICADA AQUI: Checagem robusta antes do JSON.parse()
      // Isso impede o erro "undefined is not a valid JSON"
      // =========================================================================
      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.data);
              localStorage.setItem('user', JSON.stringify(data.data));
            } else {
              console.error('Erro ao buscar perfil:', data.message);
              logout();
            }
          } else {
            console.error('Falha na resposta do /me:', response.status);
            logout();
          }
        } catch (fetchError) {
          console.error('Erro de rede ao buscar perfil:', fetchError);
          logout();
        }
      }
    } catch (parseError) {
      console.error('Erro ao parsear dados do localStorage:', parseError);
      logout();
    } finally {
      setLoading(false);
    }
  }, []); // A função logout não precisa ser uma dependência aqui

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  useEffect(() => {
    if (!loading) {
      const protectedRoutes = ['/dashboard', '/dashboard/comprar-creditos', '/dashboard/receber-sms', '/dashboard/historico', '/dashboard/perfil', '/dashboard/admin'];
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

      if (isProtectedRoute && !user && !token) {
        router.push('/login');
      } else if ((pathname === '/login' || pathname === '/register') && user && token) {
        router.push('/dashboard');
      }
    }
  }, [loading, user, token, pathname, router]);

  const login = async (userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };
  
  // A função updateUser agora é estável usando useCallback
  const updateUser = useCallback((newUser) => {
    // Usando a forma funcional para evitar dependência do 'user' state
    setUser(prevUser => {
        const updated = typeof newUser === 'function' ? newUser(prevUser) : newUser;
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '2rem' }}>
          Carregando...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};