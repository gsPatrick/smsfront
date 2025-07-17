// src/app/register/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Importar useRouter
import { UserPlus } from 'lucide-react';
import styles from './Register.module.css';
import { useAuth } from '../context/AuthContext'; // Importe useAuth

// ================================================================
// ATENÇÃO: COLOQUE O DOMÍNIO DA SUA API AQUI
// Já foi definido no AuthContext, mas mantendo aqui para clareza
// ================================================================
const API_BASE_URL = 'https://jackbear-sms.r954jc.easypanel.host';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // router para redirecionar após o registro

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validação básica front-end
    if (password !== confirmPassword) {
      setError('A confirmação da senha não confere.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número.');
      return;
    }
    if (username.length < 3 || username.length > 50 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Nome de usuário deve ter entre 3 e 50 caracteres e conter apenas letras, números e underscore.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Cadastro realizado com sucesso! Agora você pode fazer login.');
        router.push('/login'); // Redireciona para a página de login
      } else {
        setError(data.message || 'Erro ao registrar usuário. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro de registro:', err);
      setError('Não foi possível conectar ao servidor. Verifique sua conexão ou tente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>SMS<span className={styles.logoHighlight}>BRA</span></h1>
        <h2 className={styles.title}>Crie sua conta</h2>
        <p className={styles.subtitle}>Comece a receber SMS agora mesmo!</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Nome de Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: joaosilva_br"
              required
            />
          </div>
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
            <small className={styles.passwordHint}>Mín. 6 caracteres, 1 maiúscula, 1 minúscula, 1 número.</small>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
                <UserPlus size={20} /> Cadastrar
              </>
            )}
          </button>
        </form>

        <p className={styles.linkText}>
          Já tem uma conta? <Link href="/login" className={styles.link}>Faça login aqui</Link>
        </p>
      </div>
    </div>
  );
}