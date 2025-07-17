// src/app/dashboard/layout.js
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import styles from './DashboardLayout.module.css';
import { useAuth } from '../context/AuthContext'; // Importe useAuth

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading, isAuthenticated } = useAuth(); // Obtenha o usuário e o estado de autenticação

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  // Se ainda estiver carregando, mostra um loader (o AuthProvider já tem um)
  if (loading) {
    return null; // O AuthProvider já renderiza "Carregando..."
  }

  // Se não estiver autenticado, o AuthProvider já redireciona para /login
  // Então, se chegamos aqui e isAuthenticated é false, algo deu errado ou não deveria estar aqui
  if (!isAuthenticated) {
    return null; // ou um componente de "acesso negado"
  }

  return (
    <div className={styles.layout}>
      {isSidebarOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}

      {/* Passar a role do usuário REAL para a Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} userRole={user?.role} />
      
      <main className={styles.mainContent}>
        {/* Passar os dados do usuário REAL para o Header */}
        <Header toggleSidebar={toggleSidebar} user={user} />
        <div className={styles.pageWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
}