// src/components/Header/Header.js
'use client'; // Marcar como Client Component

import { ChevronDown, Bell, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import styles from './Header.module.css';
import { useAuth } from '../../app/context/AuthContext'; // Importe useAuth

const Header = ({ toggleSidebar, user }) => { // Recebe o objeto user
  const { logout } = useAuth(); // Use a função logout do contexto

  // Use dados reais do usuário ou placeholders se user for null/undefined
  const userName = user?.username || 'Usuário';
  const userEmail = user?.email || 'email@exemplo.com';
  const userInitials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';

  return (
    <header className={styles.header}>
      <div className={styles.leftContent}>
        <button className={styles.menuButton} onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className={styles.headerTitle}>
          <h2>Dashboard</h2>
          <p>Bem-vindo de volta, {userName}!</p>
        </div>
      </div>
      
      <div className={styles.headerActions}>
        <div className={styles.notification}>
          <Bell size={20} />
          <span className={styles.notificationBadge}>3</span>
        </div>
        
        <Link href="/dashboard/perfil" className={styles.userProfileLink}>
          <div className={styles.userInitialsPlaceholder}>
            {userInitials}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
          </div>
          <ChevronDown size={20} className={styles.chevron} />
        </Link>
        
        {/* Conectar o botão de logout com a função logout do contexto */}
        <button className={styles.logoutButton} onClick={logout}>
            <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;