// src/app/dashboard/comprar-creditos/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Star, ShoppingCart, Calendar, Clock } from 'lucide-react';
import styles from './ComprarCreditos.module.css';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import { useAuth } from '../../context/AuthContext'; // Importe useAuth
import { authenticatedFetch } from '../../utils/api'; // Importe a função de fetch autenticada

export default function ComprarCreditosPage() {
  const { token, loading: authLoading, user } = useAuth(); // Precisa do 'user' para o ID
  const [creditPackages, setCreditPackages] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Novo estado para controle do botão de pagamento

  // Carregar pacotes de créditos e histórico de compras
  const loadPurchaseData = useCallback(async () => {
    if (!token || authLoading) return;

    setPageLoading(true);
    setError(null);
    try {
      // 1. Buscar Pacotes de Créditos
      const packagesData = await authenticatedFetch('/api/payments/packages', 'GET', null, token);
      setCreditPackages(packagesData);
      
      // Defina o primeiro pacote (ou um padrão) como selecionado inicialmente
      if (packagesData.length > 0) {
        setSelectedPackage(packagesData[0]); 
      }

      // 2. Buscar Histórico de Compras
      const historyUrl = new URLSearchParams();
      historyUrl.append('type', 'credit_purchase');
      historyUrl.append('type', 'refund'); 
      historyUrl.append('limit', '100'); // Garante um limite para o histórico
      
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
      console.error('Erro ao carregar compras:', err);
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

  const handlePayment = async (gateway) => {
    if (!selectedPackage || !user?.id) { // Precisa do ID do usuário logado
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
        let response;
        if (gateway === 'Stripe') {
            response = await authenticatedFetch('/api/payments/stripe/create', 'POST', paymentData, token);
            window.location.href = response.session_url; // Redireciona para o Stripe Checkout
        } else if (gateway === 'MercadoPago') {
            response = await authenticatedFetch('/api/payments/mercadopago/create', 'POST', paymentData, token);
            window.location.href = response.init_point; // Redireciona para o Mercado Pago Checkout
        } else if (gateway === 'PIX') {
            // PIX geralmente é um processo diferente (gera um QR Code/Código copia e cola).
            // Para simplicidade, vamos simular o PIX como um sucesso instantâneo no frontend
            // MAS NA VIDA REAL, PIX TAMBÉM ENVOLVE WEBHHOOKS para confirmação.
            alert(`Simulando pagamento PIX de R$ ${selectedPackage.price.toFixed(2).replace('.', ',')}. Por favor, pague o QR Code gerado.`);
            // Para o PIX, o backend geraria o QR Code e uma transação pendente.
            // O frontend exibiria o QR Code. O webhook do gateway confirmaria o pagamento.
            // Por enquanto, apenas alerta e simula um sucesso básico para o histórico
            const mockPixTransaction = {
                id: `PIX-${Date.now()}`,
                date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
                package: selectedPackage.name + ' (Simulado PIX)',
                amount: `R$ ${selectedPackage.price.toFixed(2).replace('.', ',')}`,
                gateway: 'PIX (Simulado)',
                status: 'completed' // SIMULADO
            };
            setPurchaseHistory(prev => [mockPixTransaction, ...prev]);
            alert('Pagamento PIX simulado concluído com sucesso!');
        } else {
            throw new Error('Gateway de pagamento não suportado.');
        }
    } catch (err) {
        setError(err.message || 'Erro ao iniciar pagamento.');
        alert(`Erro ao iniciar pagamento: ${err.message}`);
    } finally {
        setIsProcessingPayment(false);
    }
  };

  // Renderização condicional de carregamento e erro
  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando página de compras...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Erro: {error}</div>;
  }


  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Seção de seleção de pacotes */}
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
                {pkg.popular && (
                  <div className={styles.popularBadge}>
                    <Star size={12} /> Popular
                  </div>
                )}
                <div className={styles.radioCircle}>
                  {selectedPackage?.id === pkg.id && <div className={styles.radioInnerCircle} />}
                </div>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                <p className={styles.packageCredits}>{pkg.credits} créditos</p>
                <p className={styles.packageDescription}>{pkg.description}</p>
                <div className={styles.priceContainer}>
                  <span className={styles.packagePrice}>R$ {pkg.price.toFixed(2).replace('.', ',')}</span>
                  {pkg.originalPrice && <span className={styles.originalPrice}>R$ {parseFloat(pkg.originalPrice).toFixed(2).replace('.', ',')}</span>}
                </div>
              </div>
            ))}
          </div>
          {creditPackages.length === 0 && !pageLoading && !error && (
            <p className={styles.noDataMessage}>Nenhum pacote de crédito disponível no momento.</p>
          )}
        </div>

        {/* Seção de resumo e pagamento */}
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

                    <div className={styles.paymentButtons}>
                    <button className={`${styles.paymentButton} ${styles.stripe}`} onClick={() => handlePayment('Stripe')} disabled={isProcessingPayment}>
                        {isProcessingPayment && 'Stripe' === 'Stripe' ? <div className={styles.buttonSpinner}></div> : 'Pagar com Stripe'}
                    </button>
                    <button className={`${styles.paymentButton} ${styles.mercadoPago}`} onClick={() => handlePayment('MercadoPago')} disabled={isProcessingPayment}>
                        {isProcessingPayment && 'MercadoPago' === 'MercadoPago' ? <div className={styles.buttonSpinner}></div> : 'Pagar com Mercado Pago'}
                    </button>
                    <button className={`${styles.paymentButton} ${styles.pix}`} onClick={() => handlePayment('PIX')} disabled={isProcessingPayment}>
                        {isProcessingPayment && 'PIX' === 'PIX' ? <div className={styles.buttonSpinner}></div> : 'Pagar com PIX'}
                    </button>
                    </div>
                    <p className={styles.securePayment}>
                    <CheckCircle size={14} /> Pagamento seguro e processado por gateways confiáveis.
                    </p>
                </>
            ) : (
                <p className={styles.noServiceSelected}>Selecione um pacote acima para ver o resumo.</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Histórico de Compras */}
      <div className={styles.historySection}>
        <h2 className={styles.sectionTitle}>Histórico de Compras</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Transação</th>
                <th>Data</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchaseHistory.length > 0 ? (
                purchaseHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.transactionCell}>
                        <span className={styles.transactionPackage}>{item.package}</span>
                        <span className={styles.transactionGateway}>
                          {item.gateway} ({item.id})
                        </span>
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td>{item.amount}</td>
                    <td><StatusBadge status={item.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan="4" className={styles.noResults}>Nenhuma compra registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}