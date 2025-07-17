// src/app/dashboard/historico/page.js
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, CalendarDays, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './HistoricoMensagens.module.css';
import { useAuth } from '../../context/AuthContext'; // Importe useAuth
import { authenticatedFetch } from '../../utils/api'; // Importe a função de fetch autenticada

export default function HistoricoMensagensPage() {
    const { token, loading: authLoading } = useAuth();
    const [messages, setMessages] = useState([]); // Mensagens da API
    const [totalItems, setTotalItems] = useState(0); // Total para paginação
    const [searchTerm, setSearchTerm] = useState('');
    const [filterService, setFilterService] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    const itemsPerPage = 10; // Itens por página

    // Carregar histórico de mensagens
    const loadSmsHistory = useCallback(async () => {
        if (!token || authLoading) return; // Só carrega se o token existir e auth estiver pronto

        setPageLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
            });
            if (searchTerm) queryParams.append('search', searchTerm); // Sua API não tem 'search' no /sms/history, mas 'search' pode ser mapeado para 'q' ou 'query'
            if (filterService) queryParams.append('service_code', filterService);
            if (filterStatus) queryParams.append('status', filterStatus);
            if (filterStartDate) queryParams.append('start_date', filterStartDate);
            if (filterEndDate) queryParams.append('end_date', filterEndDate);

            const data = await authenticatedFetch(`/api/sms/history?${queryParams.toString()}`, 'GET', null, token);
            setMessages(data.messages);
            setTotalItems(data.pagination.total_items);

        } catch (err) {
            setError(err.message || 'Falha ao carregar histórico de mensagens.');
            console.error('Erro ao carregar histórico:', err);
        } finally {
            setPageLoading(false);
        }
    }, [token, authLoading, currentPage, searchTerm, filterService, filterStatus, filterStartDate, filterEndDate]);

    // Disparar o carregamento ao montar e quando filtros/paginação mudam
    useEffect(() => {
        if (!authLoading && token) {
            loadSmsHistory();
        }
    }, [authLoading, token, loadSmsHistory]);


    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterService('');
        setFilterStatus('');
        setFilterStartDate('');
        setFilterEndDate('');
        setCurrentPage(1); // Redefine para a primeira página
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Renderização condicional de carregamento e erro
    if (authLoading || pageLoading) {
        return <div className={styles.loadingState}>Carregando histórico...</div>;
    }

    if (error) {
        return <div className={styles.errorState}>Erro: {error}</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Histórico de Mensagens</h2>
            <p className={styles.sectionSubtitle}>Visualize e monitore todas as mensagens SMS recebidas.</p>

            <div className={styles.filterBar}>
                <div className={styles.searchInputWrapper}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Buscar por número ou código..." // Removi 'serviço' pois o backend não suporta busca por nome aqui
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <select
                        className={styles.selectFilter}
                        value={filterService}
                        onChange={(e) => setFilterService(e.target.value)}
                    >
                        <option value="">Todos os Serviços</option>
                        <option value="wa">WhatsApp</option>
                        <option value="tg">Telegram</option>
                        <option value="ig">Instagram</option>
                        <option value="go">Google</option>
                        <option value="ifood">iFood</option>
                    </select>

                    <select
                        className={styles.selectFilter}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">Todos os Status</option>
                        <option value="received">Recebido</option>
                        <option value="pending">Pendente</option>
                        <option value="cancelled">Cancelado</option>
                    </select>

                    <div className={styles.dateFilter}>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                        />
                        <span>até</span>
                        <input
                            type="date"
                            className={styles.dateInput}
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                        />
                    </div>
                    <button className={styles.clearFiltersButton} onClick={handleClearFilters}>
                        Limpar Filtros
                    </button>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.messagesTable}>
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Número</th>
                                <th>Código Recebido</th>
                                <th>Data/Hora</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.length > 0 ? (
                                messages.map((msg) => (
                                    <tr key={msg.id}>
                                        <td>{msg.service_code || 'N/A'}</td> {/* Usando service_code */}
                                        <td>{msg.to_number}</td>
                                        <td>{msg.message_body || '-'}</td>
                                        <td>{new Date(msg.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td><StatusBadge status={msg.status} /></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className={styles.noResults}>Nenhuma mensagem encontrada com os filtros aplicados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.paginationButton}
                    >
                        <ChevronLeft size={16} /> Anterior
                    </button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={styles.paginationButton}
                    >
                        Próxima <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}