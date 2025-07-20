// src/app/dashboard/comprar-creditos/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import styles from './ComprarCreditos.module.css';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

export default function ComprarCreditosPage() {
  const { token, loading: authLoading, user } = useAuth();
  const [creditPackages, setCreditPackages] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const loadPurchaseData = useCallback(async () => {
    if (!token || authLoading) return;

    setPageLoading(true);
    setError(null);
    try {
      // Buscar Pacotes de Créditos
      const packagesData = await authenticatedFetch('/api/payments/packages', 'GET', null, token);
      setCreditPackages(packagesData);
      if (packagesData.length > 0) {
        setSelectedPackage(packagesData[0]); 
      }

      // Buscar Histórico de Compras
      const historyUrl = new URLSearchParams();
      historyUrl.append('type', 'credit_purchase');
      historyUrl.append('type', 'refund'); 
      historyUrl.append('limit', '100');
      const historyData = await authenticatedFetch(`/api/credits/history?${historyUrl.toString()}`, 'GET', null, token);
      
      const formattedHistory = historyData.transactions.map(tx => ({
        id: tx.id,
        date: new Date(tx.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        package: tx.description.includes('Compra:') ? tx.description.split('Compra: ')[1] : tx.description,
        amount: `R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`,
        gateway: tx.gateway,
        status: tx.status
      }));
      setPurchaseHistory(formattedHistory);

    } catch (err) {
      setError(err.message || 'Falha ao carregar dados de compras.');
    } finally {
      setPageLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    loadPurchaseData();
  }, [loadPurchaseData]);
  
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
  };

  // ATUALIZADO: Função de pagamento simplificada
  const handlePayment = async () => {
    if (!selectedPackage || !user?.id) {
        alert("Selecione um pacote e certifique-se de estar logado.");
        return;
    }
    setIsProcessingPayment(true);
    setError(null);

    const paymentData = {
        amount: selectedPackage.price,
        credits: selectedPackage.credits,
        user_id: user.id,
    };

    try {
        // A única opção agora é Mercado Pago
        const response = await authenticatedFetch('/api/payments/mercadopago/create', 'POST', paymentData, token);
        // Redireciona o usuário para a URL de pagamento do Mercado Pago
        window.location.href = response.init_point;
    } catch (err) {
        setError(err.message || 'Erro ao iniciar pagamento.');
        alert(`Erro ao iniciar pagamento: ${err.message}`);
        setIsProcessingPayment(false);
    }
    // Não precisa do finally aqui, pois o redirecionamento acontece ou um erro é lançado
  };

  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando página de compras...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Erro: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.packagesSection}>
          <h2 className={styles.sectionTitle}>Escolha seu pacote de créditos</h2>
          <p className={styles.sectionSubtitle}>Créditos nunca expiram. Use quando precisar.</p>
          
          <div className={styles.packagesGrid}>
            {creditPackages.map((pkg) => (
              <div 
                key={pkg.id} 
                className={`${styles.packageCard} ${selectedPackage?.id === pkg.id ? styles.selected : ''}`}
                onClick={() => handleSelectPackage(pkg)}
              >
                {pkg.popular && <div className={styles.popularBadge}><Star size={12} /> Popular</div>}
                <div className={styles.radioCircle}>{selectedPackage?.id === pkg.id && <div className={styles.radioInnerCircle} />}</div>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                <p className={styles.packageCredits}>{pkg.credits} créditos</p>
                <p className={styles.packageDescription}>{pkg.description}</p>
                <div className={styles.priceContainer}>
                  <span className={styles.packagePrice}>R$ {pkg.price.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.paymentSection}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Resumo do Pedido</h3>
            {selectedPackage ? (
                <>
                    <div className={styles.summaryItem}>
                      <span>Pacote</span>
                      <strong>{selectedPackage.name} ({selectedPackage.credits} créditos)</strong>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>Valor</span>
                      <strong>R$ {selectedPackage.price.toFixed(2).replace('.', ',')}</strong>
                    </div>
                    <hr className={styles.divider} />
                    <div className={`${styles.summaryItem} ${styles.total}`}>
                      <span>Total a pagar</span>
                      <strong>R$ {selectedPackage.price.toFixed(2).replace('.', ',')}</strong>
                    </div>

                    {/* ATUALIZADO: Apenas um botão de pagamento */}
                    <div className={styles.paymentButtons}>
                      <button className={`${styles.paymentButton} ${styles.mercadoPago}`} onClick={handlePayment} disabled={isProcessingPayment}>
                          {isProcessingPayment ? <div className={styles.buttonSpinner}></div> : 'Pagar com Mercado Pago'}
                      </button>
                    </div>

                    <p className={styles.securePayment}>
                      <CheckCircle size={14} /> Pagamento seguro processado por Mercado Pago.
                    </p>
                </>
            ) : (
                <p className={styles.noServiceSelected}>Selecione um pacote para continuar.</p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Histórico de Compras</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr><th>Transação</th><th>Data</th><th>Valor</th><th>Status</th></tr>
            </thead>
            <tbody>
              {purchaseHistory.length > 0 ? (
                purchaseHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.transactionCell}>
                        <span className={styles.transactionPackage}>{item.package}</span>
                        <span className={styles.transactionGateway}>{item.gateway} ({item.id})</span>
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td>{item.amount}</td>
                    <td><StatusBadge status={item.status} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className={styles.noResults}>Nenhuma compra registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}