// src/context/AuthContext.js
'use client';

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Importe usePathname também

const AuthContext = createContext(null);

// ================================================================
// ATENÇÃO: COLOQUE O DOMÍNIO DA SUA API AQUI
// Em um projeto real, usaria process.env.NEXT_PUBLIC_API_URL
// ================================================================
const API_BASE_URL = 'https://jackbear-sms.r954jc.easypanel.host';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Dados do usuário
  const [token, setToken] = useState(null); // Token JWT
  const [loading, setLoading] = useState(true); // Estado de carregamento inicial
  const router = useRouter();
  const pathname = usePathname(); // Obter o caminho atual

  // Função para carregar o usuário e token do localStorage
  const loadUserFromStorage = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Opcional: Validar o token e buscar dados frescos do usuário
        // Isso é importante para garantir que o token não expirou e os dados estão atualizados
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.data); // Atualiza com dados frescos do servidor
              localStorage.setItem('user', JSON.stringify(data.data)); // Salva os dados frescos
            } else {
              // Token inválido ou usuário inativo, limpa a sessão
              console.error('Erro ao buscar perfil:', data.message);
              logout();
            }
          } else {
            // Resposta não OK (ex: 401 Unauthorized), token inválido ou expirado
            console.error('Falha na resposta do /me:', response.status);
            logout();
          }
        } catch (fetchError) {
          console.error('Erro de rede ao buscar perfil:', fetchError);
          logout(); // Limpa sessão se não conseguir validar
        }
      }
    } catch (parseError) {
      console.error('Erro ao parsear dados do localStorage:', parseError);
      logout(); // Limpa a sessão se os dados estiverem corrompidos
    } finally {
      setLoading(false);
    }
  }, []); // Dependências vazias, pois só carrega uma vez no montagem

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Middleware simples de proteção de rota
  useEffect(() => {
    if (!loading) { // Apenas executa depois que o carregamento inicial terminar
      const protectedRoutes = ['/dashboard', '/dashboard/comprar-creditos', '/dashboard/receber-sms', '/dashboard/historico', '/dashboard/perfil', '/dashboard/admin'];
      
      const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

      if (isProtectedRoute && !user && !token) {
        // Se estiver em rota protegida e não houver usuário/token, redireciona para login
        router.push('/login');
      } else if ((pathname === '/login' || pathname === '/register') && user && token) {
        // Se estiver nas páginas de login/registro e já estiver logado, redireciona para o dashboard
        router.push('/dashboard');
      }
    }
  }, [loading, user, token, pathname, router]);


  const login = async (userData, jwtToken) => {
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    router.push('/dashboard'); // Redireciona para o dashboard após login
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login'); // Redireciona para o login após logout
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    login,
    logout,
    // Função para atualizar o usuário (por exemplo, após uma edição de perfil)
    updateUser: (newUser) => {
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        // Opcional: Um spinner de carregamento global enquanto o auth é verificado
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