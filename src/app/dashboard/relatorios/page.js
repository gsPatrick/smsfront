'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, Clock, Download } from 'lucide-react';
import styles from './RelatoriosAnalises.module.css';

// ===================================================================
// MOCK DATA
// ===================================================================

// Dados de uso ao longo do tempo (últimos 30 dias)
const generateDailyData = (days) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const total = Math.floor(Math.random() * 100) + 50; // 50-150 envios
        const delivered = Math.floor(total * (0.9 + Math.random() * 0.05)); // 90-95%
        const failed = total - delivered;

        data.push({
            date: formattedDate,
            total_sms: total,
            delivered_sms: delivered,
            failed_sms: failed,
        });
    }
    return data;
};

const mockUsageData = {
    'last_7_days': generateDailyData(7),
    'last_30_days': generateDailyData(30),
    'last_90_days': generateDailyData(90).filter((_,i) => i % 5 === 0), // Menos pontos para 90 dias
    'all_time': generateDailyData(180).filter((_,i) => i % 10 === 0), // Menos pontos para All Time
};

// Dados de distribuição de status (geral)
const mockStatusData = [
    { name: 'Entregues', value: 850, color: 'var(--success)' },
    { name: 'Pendentes', value: 80, color: 'var(--warning)' },
    { name: 'Falhas', value: 70, color: 'var(--danger)' },
];

const pieChartColors = mockStatusData.map(d => d.color);


// ===================================================================
// PAGE COMPONENT
// ===================================================================

export default function RelatoriosAnalisesPage() {
    const [period, setPeriod] = useState('last_30_days');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'delivered', 'failed', 'pending'

    const currentUsageData = useMemo(() => mockUsageData[period], [period]);

    const filteredStatusData = useMemo(() => {
        if (statusFilter === 'all') {
            return mockStatusData;
        }
        return mockStatusData.filter(d => d.name.toLowerCase().includes(statusFilter));
    }, [statusFilter]);

    // Cálculo de KPIs totais para o período selecionado
    const totalSent = currentUsageData.reduce((sum, item) => sum + item.total_sms, 0);
    const totalDelivered = currentUsageData.reduce((sum, item) => sum + item.delivered_sms, 0);
    const totalFailed = currentUsageData.reduce((sum, item) => sum + item.failed_sms, 0);
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : 0;

    const handleExport = (format) => {
        alert(`Simulando exportação de relatório em ${format}...`);
        // Em uma aplicação real, aqui você chamaria uma API para gerar e baixar o arquivo.
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Relatórios e Análises</h2>
            <p className={styles.sectionSubtitle}>Obtenha insights sobre o uso de SMS e desempenho.</p>

            {/* Filtros */}
            <div className={styles.filterCard}>
                <div className={styles.filterGroup}>
                    <label htmlFor="periodFilter" className={styles.filterLabel}>Período:</label>
                    <select
                        id="periodFilter"
                        className={styles.selectFilter}
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="last_7_days">Últimos 7 Dias</option>
                        <option value="last_30_days">Últimos 30 Dias</option>
                        <option value="last_90_days">Últimos 90 Dias</option>
                        <option value="all_time">Todo o Período</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label htmlFor="statusFilter" className={styles.filterLabel}>Status:</label>
                    <select
                        id="statusFilter"
                        className={styles.selectFilter}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos</option>
                        <option value="entregues">Entregues</option>
                        <option value="falhas">Falhas</option>
                        <option value="pendentes">Pendentes</option>
                    </select>
                </div>

                <button className={styles.exportButton} onClick={() => handleExport('CSV')}>
                    <Download size={18} /> Exportar CSV
                </button>
                <button className={styles.exportButton} onClick={() => handleExport('PDF')}>
                    <Download size={18} /> Exportar PDF
                </button>
            </div>

            {/* KPIs de Resumo */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>SMS Enviados</p>
                    <h3 className={styles.kpiValue}>{totalSent}</h3>
                </div>
                <div className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>SMS Entregues</p>
                    <h3 className={`${styles.kpiValue} ${styles.success}`}>{totalDelivered}</h3>
                </div>
                <div className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>SMS com Falha</p>
                    <h3 className={`${styles.kpiValue} ${styles.danger}`}>{totalFailed}</h3>
                </div>
                <div className={styles.kpiCard}>
                    <p className={styles.kpiLabel}>Taxa de Entrega</p>
                    <h3 className={`${styles.kpiValue} ${styles.primary}`}>{deliveryRate}%</h3>
                </div>
            </div>

            {/* Gráficos */}
            <div className={styles.chartsGrid}>
                <div className={styles.chartContainer}>
                    <h3 className={styles.chartTitle}>Envios de SMS por Dia</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={currentUsageData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="delivered_sms" stroke="var(--primary)" name="Entregues" strokeWidth={2} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="failed_sms" stroke="var(--danger)" name="Falhas" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.chartContainer}>
                    <h3 className={styles.chartTitle}>Distribuição de Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={filteredStatusData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {filteredStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}