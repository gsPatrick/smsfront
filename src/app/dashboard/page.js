// src/app/dashboard/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Wallet, Send, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatsCard from '@/components/StatsCard/StatsCard';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './DashboardPage.module.css';
import { useAuth } from '../context/AuthContext';
import { authenticatedFetch } from '../utils/api';

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    credits: 'R$ 0,00',
    totalSent: 0,
    deliveryRate: '0%',
    failedSms: 0,
    chartData: [],
    recentTransactions: [],
  });
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para carregar os dados do dashboard
  const loadDashboardData = useCallback(async () => {
    if (!token || authLoading) return;

    setDataLoading(true);
    setError(null);
    try {
      // 1. Obter Saldo de Créditos (continua igual)
      const balanceData = await authenticatedFetch('/api/credits/balance', 'GET', null, token);
      
      // 2. Obter Histórico de SMS e Dados para o Gráfico
      const smsHistoryData = await authenticatedFetch('/api/sms/history?limit=100', 'GET', null, token);
      const chartStats = await authenticatedFetch('/api/sms/stats?period=daily&days=30', 'GET', null, token);

      // =========================================================================
      // ✅ CORREÇÃO APLICADA AQUI
      // Adicionamos verificações para garantir que os dados existem antes de usá-los.
      // Isso evita o erro "Cannot read properties of undefined (reading 'pagination')"
      // =========================================================================
      let totalSent = 0;
      let deliveredSms = 0;
      let failedSms = 0;
      let recentSmsMessages = [];

      // Apenas processa os dados do histórico se eles existirem
      if (smsHistoryData && smsHistoryData.pagination && smsHistoryData.messages) {
        totalSent = smsHistoryData.pagination.total_items;
        deliveredSms = smsHistoryData.messages.filter(msg => msg.status === 'received').length;
        failedSms = smsHistoryData.messages.filter(msg => msg.status === 'cancelled').length;
        
        recentSmsMessages = smsHistoryData.messages.slice(0, 5).map(msg => ({
          id: msg.id,
          service: msg.metadata?.service_name || msg.service_code, 
          date: new Date(msg.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
          status: msg.status === 'received' ? 'Entregue' : msg.status === 'cancelled' ? 'Falhou' : 'Pendente',
          amount: `R$ ${parseFloat(msg.cost || 0).toFixed(2).replace('.', ',')}`,
        }));
      }

      const deliveryRate = totalSent > 0 ? ((deliveredSms / totalSent) * 100).toFixed(2) : 0;
      
      // Processa dados do gráfico (também com verificação)
      const formattedChartData = Array.isArray(chartStats) ? chartStats.map(item => ({
        name: item.date,
        envios: item.delivered_sms,
        falhas: item.failed_sms,
      })) : [];

      // Atualiza o estado com os dados seguros
      setDashboardData({
        credits: `R$ ${parseFloat(balanceData?.credits || 0).toFixed(2).replace('.', ',')}`,
        totalSent: totalSent,
        deliveryRate: `${deliveryRate}%`,
        failedSms: failedSms,
        chartData: formattedChartData,
        recentTransactions: recentSmsMessages,
      });

    } catch (err) {
      setError(err.message || 'Falha ao carregar dados do dashboard.');
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setDataLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const kpiData = useMemo(() => [
    {
      title: "Créditos Disponíveis",
      value: dashboardData.credits,
      icon: <Wallet size={24} />,
      change: null
    },
    {
      title: "Envios (Total)",
      value: dashboardData.totalSent,
      icon: <Send size={24} />,
      change: null
    },
    {
      title: "Taxa de Entrega",
      value: dashboardData.deliveryRate,
      icon: <CheckCircle size={24} />,
      change: null
    },
    {
      title: "Falhas",
      value: dashboardData.failedSms,
      icon: <XCircle size={24} />,
      change: null
    }
  ], [dashboardData]);


  if (dataLoading) {
    return <div className={styles.loadingState}>Carregando Dashboard...</div>;
  }

  if (error) {
    return <div className={styles.errorState}>Erro: {error}</div>;
  }

  return (
    <div className={styles.container}>
      {/* Seção de KPIs */}
      <div className={styles.kpiGrid}>
        {kpiData.map((kpi, index) => (
          <StatsCard
            key={index}
            icon={kpi.icon}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
          />
        ))}
      </div>

      {/* Seção de Gráficos e Transações Recentes */}
      <div className={styles.mainGrid}>
        <div className={styles.chartContainer}>
          <h3 className={styles.sectionTitle}>Uso de SMS nos últimos 30 dias</h3>
          {dashboardData.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="envios" fill="var(--primary)" name="Envios com Sucesso" radius={[4, 4, 0, 0]} />
                <Bar dataKey="falhas" fill="var(--danger)" name="Falhas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noDataMessage}>Nenhum dado de uso de SMS para o período.</div>
          )}
        </div>

        <div className={styles.transactionsContainer}>
          <h3 className={styles.sectionTitle}>Envios Recentes</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Custo</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentTransactions.length > 0 ? (
                  dashboardData.recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className={styles.tableCellStrong}>{tx.service}</td>
                      <td className={styles.tableCell}>{tx.date}</td>
                      <td className={styles.tableCell}><StatusBadge status={tx.status} /></td>
                      <td className={styles.tableCell}>{tx.amount}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                      <td colSpan="4" className={styles.noResults}>Nenhum envio recente.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}