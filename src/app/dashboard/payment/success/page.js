// src/app/dashboard/payment/success/page.js
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import styles from './PaymentStatusPage.module.css'; // Usará um CSS compartilhado
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { authenticatedFetch } from '../../../utils/api';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, isAuthenticated, updateUser, user } = useAuth();
  
  useEffect(() => {
    // Apenas para Stripe: validar sessão após redirecionamento
    const sessionId = searchParams.get('session_id');
    if (sessionId && isAuthenticated && token) {
      // O ideal seria ter um endpoint no backend para "verificar_sessao_pagamento"
      // que confirmaria com o Stripe/MP e retornaria o status,
      // e o backend adicionaria os créditos SOMENTE VIA WEBHOOK, para evitar fraudes.
      // Por simplicidade aqui, vamos apenas recarregar o saldo do usuário.
      const loadBalance = async () => {
        try {
          const balanceData = await authenticatedFetch('/api/credits/balance', 'GET', null, token);
          updateUser({ ...user, credits: balanceData.credits });
          alert('Seu saldo foi atualizado com sucesso!');
        } catch (err) {
          console.error('Erro ao atualizar saldo após pagamento:', err.message);
        }
      };
      loadBalance();
    }
  }, [searchParams, isAuthenticated, token, updateUser, user]); // Adiciona user nas dependências

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <CheckCircle2 size={64} className={styles.successIcon} />
        <h1 className={styles.title}>Pagamento Confirmado!</h1>
        <p className={styles.message}>Seus créditos foram adicionados à sua conta com sucesso.</p>
        <Link href="/dashboard" className={styles.button}>Ir para o Painel</Link>
        <button onClick={() => router.refresh()} className={styles.buttonSecondary}>Atualizar Saldo (Manualmente)</button>
      </div>
    </div>
  );
}