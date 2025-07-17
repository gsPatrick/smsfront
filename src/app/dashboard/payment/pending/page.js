// src/app/dashboard/payment/pending/page.js
'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import styles from './PaymentStatusPage.module.css';

export default function PaymentPendingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Clock size={64} className={styles.pendingIcon} />
        <h1 className={styles.title}>Pagamento Pendente</h1>
        <p className={styles.message}>Sua transação está aguardando confirmação. Os créditos serão adicionados em breve.</p>
        <Link href="/dashboard" className={styles.button}>Ir para o Painel</Link>
        <p className={styles.smallMessage}>Verifique seu histórico de compras para o status mais recente.</p>
      </div>
    </div>
  );
}