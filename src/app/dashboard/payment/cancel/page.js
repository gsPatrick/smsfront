// src/app/dashboard/payment/cancel/page.js
'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import styles from './PaymentStatusPage.module.css';

export default function PaymentCancelPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <XCircle size={64} className={styles.cancelIcon} />
        <h1 className={styles.title}>Pagamento Cancelado</h1>
        <p className={styles.message}>Sua transação não foi concluída. Por favor, tente novamente.</p>
        <Link href="/dashboard/comprar-creditos" className={styles.button}>Tentar Novamente</Link>
        <Link href="/dashboard" className={styles.buttonSecondary}>Voltar ao Painel</Link>
      </div>
    </div>
  );
}