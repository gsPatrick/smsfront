// src/app/login/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import styles from './Login.module.css';
import { useAuth } from '../context/AuthContext'; // Importe useAuth

// ================================================================
// ATENÇÃO: COLOQUE O DOMÍNIO DA SUA API AQUI
// Já foi definido no AuthContext, mas mantendo aqui para clareza
// ================================================================
const API_BASE_URL = 'https://jackbear-sms.r954jc.easypanel.host';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth(); // Use a função login do contexto

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Login bem-sucedido!');
        // Chame a função login do contexto para armazenar token e usuário
        login(data.data.user, data.data.token);
        // O redirecionamento agora é tratado pelo AuthContext
      } else {
        setError(data.message || 'Erro ao fazer login. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro de login:', err);
      setError('Não foi possível conectar ao servidor. Verifique sua conexão ou tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>SMS<span className={styles.logoHighlight}>BRA</span></h1>
        <h2 className={styles.title}>Bem-vindo de volta!</h2>
        <p className={styles.subtitle}>Faça login para acessar seu painel.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <LogIn size={20} /> Entrar
              </>
            )}
          </button>
        </form>

        <p className={styles.linkText}>
          Não tem uma conta? <Link href="/register" className={styles.link}>Cadastre-se aqui</Link>
        </p>
      </div>
    </div>
  );
}   