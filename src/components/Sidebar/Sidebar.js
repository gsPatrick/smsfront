// src/components/Sidebar/Sidebar.js
'use client'; // Já é Client Component

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquareText, ShoppingCart, BarChart3, User, Settings, X } from 'lucide-react';
import styles from './Sidebar.module.css';

// Itens de menu para todos os usuários
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/dashboard/comprar-creditos', label: 'Comprar Créditos', icon: <ShoppingCart size={20} /> },
  { href: '/dashboard/receber-sms', label: 'Receber SMS', icon: <MessageSquareText size={20} /> },
  { href: '/dashboard/historico', label: 'Histórico', icon: <BarChart3 size={20} /> },
  { href: '/dashboard/perfil', label: 'Meu Perfil', icon: <User size={20} /> },
];

// Itens de menu EXCLUSIVOS para administradores
const adminMenuItems = [
    { href: '/dashboard/admin', label: 'Painel Admin', icon: <Settings size={20} /> },
];

const Sidebar = ({ isOpen, toggleSidebar, userRole }) => { // userRole é recebido
  const pathname = usePathname();

  // Função auxiliar para determinar se um link está ativo
  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    // Verifica se o pathname é uma sub-rota (começa com o href + '/') ou uma correspondência exata
    return pathname.startsWith(href + '/') || pathname === href;
  };

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <div className={styles.logo}>
          SMS<span className={styles.logoHighlight}>BRA</span>
        </div>
        <button className={styles.closeButton} onClick={toggleSidebar}>
          <X size={24} />
        </button>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navSectionTitle}>MENU</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
            onClick={toggleSidebar}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Renderiza a seção de administração APENAS se o userRole for 'admin' */}
      {userRole === 'admin' && ( // Lógica de renderização condicional
        <div className={styles.adminSection}>
           <p className={styles.navSectionTitle}>ADMINISTRAÇÃO</p>
           {adminMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
              onClick={toggleSidebar}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

    </aside>
  );
};

export default Sidebar;