// src/app/dashboard/admin/page.js
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react'; // Importe useEffect, useCallback
import {
  User, MessageSquareText, Settings, Search,
  ChevronLeft, ChevronRight, Edit, Pause, Play, Trash2, PlusCircle
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './AdminPanel.module.css';
import { useAuth } from '../../context/AuthContext'; // Importe useAuth
import { authenticatedFetch } from '../../utils/api'; // Importe authenticatedFetch

// ===================================================================
// MOCK DATA (Alguns ainda serão usados como base se a API não retornar tudo)
// ===================================================================

// Estes mocks serão substituídos por dados da API, mas os IDs e estrutura serão mantidos para coerência.
// mockUsers, mockAdminSmsMessages, mockAdminSmsServices serão agora carregados da API.

const itemsPerPage = 10; // Itens por página para todas as tabelas

// ===================================================================
// PAGE COMPONENT - AdminPanelPage
// ===================================================================

export default function AdminPanelPage() {
    const { token, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'sms', 'services'

    // Shared pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // --- Usuários State (Agora carregados da API) ---
    const [users, setUsers] = useState([]);
    const [userCount, setUserCount] = useState(0); // Total de itens para paginação
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('');
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState(null);

    // --- Mensagens SMS State (Agora carregados da API) ---
    const [smsMessages, setSmsMessages] = useState([]);
    const [smsMessageCount, setSmsMessageCount] = useState(0);
    const [smsSearchTerm, setSmsSearchTerm] = useState('');
    const [smsServiceFilter, setSmsServiceFilter] = useState('');
    const [smsStatusFilter, setSmsStatusFilter] = useState('');
    const [smsUserFilter, setSmsUserFilter] = useState('');
    const [smsLoading, setSmsLoading] = useState(true);
    const [smsError, setSmsError] = useState(null);

    // --- Serviços State (Agora carregados da API) ---
    const [services, setServices] = useState([]);
    const [serviceCount, setServiceCount] = useState(0);
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState('');
    const [serviceStatusFilter, setServiceStatusFilter] = useState('');
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null); // null para criar, objeto para editar
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState(null);

    // --- Logic Shared ---
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleClearFilters = (type) => {
        if (type === 'users') {
            setUserSearchTerm('');
            setUserRoleFilter('');
            setUserStatusFilter('');
        } else if (type === 'sms') {
            setSmsSearchTerm('');
            setSmsServiceFilter('');
            setSmsStatusFilter('');
            setSmsUserFilter('');
        } else if (type === 'services') {
            setServiceSearchTerm('');
            setServiceCategoryFilter('');
            setServiceStatusFilter('');
        }
        setCurrentPage(1); // Reset page on filter clear
    };

    // --- Funções de Carregamento de Dados da API ---

    // Carregar Usuários
    const loadUsers = useCallback(async () => {
        if (!token || authLoading) return;
        setUsersLoading(true);
        setUsersError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
            });
            if (userSearchTerm) queryParams.append('search', userSearchTerm);
            if (userRoleFilter) queryParams.append('role', userRoleFilter);
            if (userStatusFilter !== '') queryParams.append('is_active', userStatusFilter);

            const data = await authenticatedFetch(`/api/admin/users?${queryParams.toString()}`, 'GET', null, token);
            setUsers(data.users);
            setUserCount(data.pagination.total_items);
        } catch (err) {
            setUsersError(err.message || 'Falha ao carregar usuários.');
            console.error('Erro ao carregar usuários:', err);
        } finally {
            setUsersLoading(false);
        }
    }, [token, authLoading, currentPage, userSearchTerm, userRoleFilter, userStatusFilter]);

    // Carregar Mensagens SMS
    const loadSmsMessages = useCallback(async () => {
        if (!token || authLoading) return;
        setSmsLoading(true);
        setSmsError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
            });
            if (smsSearchTerm) queryParams.append('search', smsSearchTerm);
            if (smsServiceFilter) queryParams.append('service_code', smsServiceFilter);
            if (smsStatusFilter) queryParams.append('status', smsStatusFilter);
            if (smsUserFilter) queryParams.append('user_id', smsUserFilter); // Sua API aceita user_id, não username diretamente

            const data = await authenticatedFetch(`/api/sms/all-history?${queryParams.toString()}`, 'GET', null, token);
            setSmsMessages(data.messages);
            setSmsMessageCount(data.pagination.total_items);
        } catch (err) {
            setSmsError(err.message || 'Falha ao carregar mensagens SMS.');
            console.error('Erro ao carregar mensagens SMS:', err);
        } finally {
            setSmsLoading(false);
        }
    }, [token, authLoading, currentPage, smsSearchTerm, smsServiceFilter, smsStatusFilter, smsUserFilter]);

    // Carregar Serviços SMS
    const loadSmsServices = useCallback(async () => {
        if (!token || authLoading) return;
        setServicesLoading(true);
        setServicesError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
            });
            if (serviceSearchTerm) queryParams.append('search', serviceSearchTerm);
            if (serviceCategoryFilter) queryParams.append('category', serviceCategoryFilter);
            if (serviceStatusFilter !== '') queryParams.append('active', serviceStatusFilter);

            const data = await authenticatedFetch(`/api/admin/services?${queryParams.toString()}`, 'GET', null, token);
            setServices(data.services);
            setServiceCount(data.pagination.total_items);
        } catch (err) {
            setServicesError(err.message || 'Falha ao carregar serviços.');
            console.error('Erro ao carregar serviços:', err);
        } finally {
            setServicesLoading(false);
        }
    }, [token, authLoading, currentPage, serviceSearchTerm, serviceCategoryFilter, serviceStatusFilter]);

    // Efeito para carregar dados ao mudar de aba ou filtros
    useEffect(() => {
        setCurrentPage(1); // Resetar página ao mudar de aba ou filtro
        if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'sms') {
            loadSmsMessages();
        } else if (activeTab === 'services') {
            loadSmsServices();
        }
    }, [activeTab, userSearchTerm, userRoleFilter, userStatusFilter, smsSearchTerm, smsServiceFilter, smsStatusFilter, smsUserFilter, serviceSearchTerm, serviceCategoryFilter, serviceStatusFilter, loadUsers, loadSmsMessages, loadSmsServices]);

    // Efeito para recarregar dados ao mudar de página
    useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'sms') {
            loadSmsMessages();
        } else if (activeTab === 'services') {
            loadSmsServices();
        }
    }, [currentPage, activeTab, loadUsers, loadSmsMessages, loadSmsServices]);


    // --- Lógica de Ações (Atualizada para Interagir com a API) ---

    const handleEditUser = (user) => {
        alert(`Simulando edição do usuário: ${user.username} (ID: ${user.id})`);
        // No futuro, abriria um modal real e faria PUT /api/admin/users/:userId
    };

    const handleToggleUserStatus = async (user) => {
        if (!token) return;
        const newStatus = !user.is_active;
        try {
            await authenticatedFetch(`/api/admin/users/${user.id}`, 'PUT', { is_active: newStatus }, token);
            alert(`Usuário ${user.username} ${newStatus ? 'ativado' : 'suspenso'} com sucesso!`);
            loadUsers(); // Recarregar a lista de usuários
        } catch (err) {
            alert(`Erro ao ${newStatus ? 'ativar' : 'suspender'} usuário: ${err.message}`);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!token) return;
        if (confirm(`Tem certeza que deseja deletar o usuário ${user.username}? Esta ação é irreversível!`)) {
            try {
                await authenticatedFetch(`/api/admin/users/${user.id}`, 'DELETE', null, token);
                alert(`Usuário ${user.username} deletado com sucesso!`);
                loadUsers(); // Recarregar a lista de usuários
            } catch (err) {
                alert(`Erro ao deletar usuário: ${err.message}`);
            }
        }
    };

    const handleCreateService = () => {
        setEditingService(null); // Para criar, não há serviço em edição
        setIsServiceModalOpen(true);
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setIsServiceModalOpen(true);
    };

    const handleToggleServiceStatus = async (service) => {
        if (!token) return;
        const newStatus = !service.active;
        try {
            await authenticatedFetch(`/api/admin/services/${service.id}`, 'PUT', { active: newStatus }, token);
            alert(`Serviço ${service.name} ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
            loadSmsServices(); // Recarregar a lista de serviços
        } catch (err) {
            alert(`Erro ao ${newStatus ? 'ativar' : 'desativar'} serviço: ${err.message}`);
        }
    };

    const handleDeleteService = async (service) => {
        if (!token) return;
        if (confirm(`Tem certeza que deseja deletar o serviço ${service.name}? Esta ação é irreversível!`)) {
            try {
                await authenticatedFetch(`/api/admin/services/${service.id}`, 'DELETE', null, token);
                alert(`Serviço ${service.name} deletado com sucesso!`);
                loadSmsServices(); // Recarregar a lista de serviços
            } catch (err) {
                alert(`Erro ao deletar serviço: ${err.message}`);
            }
        }
    };


    // Mock Service Modal (simplificado, agora com interação real)
    const ServiceModal = ({ service, onClose }) => {
        const [name, setName] = useState(service ? service.name : '');
        const [code, setCode] = useState(service ? service.code : '');
        const [price, setPrice] = useState(service ? service.price_per_otp : 0);
        const [description, setDescription] = useState(service ? service.description : '');
        const [category, setCategory] = useState(service ? service.category : '');
        const [active, setActive] = useState(service ? service.active : true);

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (!token) return;

            const serviceData = { name, code, description, price_per_otp: parseFloat(price), category, active };
            try {
                if (service) {
                    await authenticatedFetch(`/api/admin/services/${service.id}`, 'PUT', serviceData, token);
                    alert(`Serviço "${name}" atualizado com sucesso!`);
                } else {
                    await authenticatedFetch('/api/admin/services', 'POST', serviceData, token);
                    alert(`Serviço "${name}" criado com sucesso!`);
                }
                loadSmsServices(); // Recarregar a lista de serviços após a operação
                onClose();
            } catch (err) {
                alert(`Erro: ${err.message}`);
                console.error('Erro no modal de serviço:', err);
            }
        };

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <h3 className={styles.modalTitle}>{service ? 'Editar Serviço' : 'Criar Novo Serviço'}</h3>
                    <form onSubmit={handleSubmit} className={styles.modalForm}>
                        <div className={styles.formGroup}>
                            <label>Nome</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Código</label>
                            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Preço por OTP</label>
                            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
                        </div>
                         <div className={styles.formGroup}>
                            <label>Descrição</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3"></textarea>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Categoria</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
                        </div>
                        <div className={styles.formGroupCheckbox}>
                            <input type="checkbox" id="serviceActive" checked={active} onChange={(e) => setActive(e.target.checked)} />
                            <label htmlFor="serviceActive">Ativo</label>
                        </div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
                            <button type="submit" className={styles.submitButton}>{service ? 'Salvar Alterações' : 'Criar Serviço'}</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };


    // Condições de carregamento/erro para as abas
    let content = null;
    if (activeTab === 'users') {
        if (usersLoading) content = <div className={styles.loadingState}>Carregando usuários...</div>;
        else if (usersError) content = <div className={styles.errorState}>Erro: {usersError}</div>;
        else content = (
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuário</th>
                                <th>Email</th>
                                <th>Créditos</th>
                                <th>Papel</th>
                                <th>Status</th>
                                <th>Criado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>R$ {parseFloat(user.credits).toFixed(2).replace('.', ',')}</td>
                                        <td>{user.role}</td>
                                        <td><StatusBadge status={user.is_active ? 'Ativo' : 'Inativo'} /></td>
                                        <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className={styles.actionsCell}>
                                            <button className={styles.actionButton} onClick={() => handleEditUser(user)}><Edit size={16} /></button>
                                            <button className={styles.actionButton} onClick={() => handleToggleUserStatus(user)}>
                                                {user.is_active ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteUser(user)}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className={styles.noResults}>Nenhum usuário encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className={styles.pagination}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.paginationButton}><ChevronLeft size={16} /> Anterior</button>
                    <span>Página {currentPage} de {Math.ceil(userCount / itemsPerPage)}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === Math.ceil(userCount / itemsPerPage)} className={styles.paginationButton}>Próxima <ChevronRight size={16} /></button>
                </div>
            </div>
        );
    } else if (activeTab === 'sms') {
        if (smsLoading) content = <div className={styles.loadingState}>Carregando mensagens SMS...</div>;
        else if (smsError) content = <div className={styles.errorState}>Erro: {smsError}</div>;
        else content = (
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuário</th>
                                <th>Serviço</th>
                                <th>Número</th>
                                <th>Código</th>
                                <th>Data/Hora</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {smsMessages.length > 0 ? (
                                smsMessages.map(msg => (
                                    <tr key={msg.id}>
                                        <td>{msg.id}</td>
                                        <td>{msg.user?.username || msg.user_id}</td> {/* Usar username se disponível */}
                                        <td>{msg.service_code}</td> {/* Assumindo que service_code é o nome simples */}
                                        <td>{msg.to_number}</td>
                                        <td>{msg.message_body || '-'}</td>
                                        <td>{new Date(msg.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td><StatusBadge status={msg.status} /></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className={styles.noResults}>Nenhuma mensagem encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className={styles.pagination}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.paginationButton}><ChevronLeft size={16} /> Anterior</button>
                    <span>Página {currentPage} de {Math.ceil(smsMessageCount / itemsPerPage)}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === Math.ceil(smsMessageCount / itemsPerPage)} className={styles.paginationButton}>Próxima <ChevronRight size={16} /></button>
                </div>
            </div>
        );
    } else if (activeTab === 'services') {
        if (servicesLoading) content = <div className={styles.loadingState}>Carregando serviços...</div>;
        else if (servicesError) content = <div className={styles.errorState}>Erro: {servicesError}</div>;
        else content = (
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Código</th>
                                <th>Preço/OTP</th>
                                <th>Categoria</th>
                                <th>Ativo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.length > 0 ? (
                                services.map(service => (
                                    <tr key={service.id}>
                                        <td>{service.id}</td>
                                        <td>{service.name}</td>
                                        <td>{service.code}</td>
                                        <td>R$ {parseFloat(service.price_per_otp).toFixed(2).replace('.', ',')}</td>
                                        <td>{service.category}</td>
                                        <td><StatusBadge status={service.active ? 'Ativo' : 'Inativo'} /></td>
                                        <td className={styles.actionsCell}>
                                            <button className={styles.actionButton} onClick={() => handleEditService(service)}><Edit size={16} /></button>
                                            <button className={styles.actionButton} onClick={() => handleToggleServiceStatus(service)}>
                                                {service.active ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteService(service)}><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className={styles.noResults}>Nenhum serviço encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className={styles.pagination}>
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={styles.paginationButton}><ChevronLeft size={16} /> Anterior</button>
                    <span>Página {currentPage} de {Math.ceil(serviceCount / itemsPerPage)}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === Math.ceil(serviceCount / itemsPerPage)} className={styles.paginationButton}>Próxima <ChevronRight size={16} /></button>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.container}>
            <h2 className={styles.mainTitle}>Painel de Administração</h2>
            <p className={styles.mainSubtitle}>Controle total sobre usuários, mensagens e serviços da plataforma.</p>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`}
                    onClick={() => { setActiveTab('users'); setCurrentPage(1); }}
                >
                    <User size={18} /> Gerenciar Usuários
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'sms' ? styles.active : ''}`}
                    onClick={() => { setActiveTab('sms'); setCurrentPage(1); }}
                >
                    <MessageSquareText size={18} /> Todos os Envios SMS
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'services' ? styles.active : ''}`}
                    onClick={() => { setActiveTab('services'); setCurrentPage(1); }}
                >
                    <Settings size={18} /> Gerenciar Serviços
                </button>
            </div>

            {/* Renderizar Filtros e Botões */}
            {activeTab === 'users' && (
                <div className={styles.filterBar}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={20} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou ID..."
                            className={styles.searchInput}
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <select className={styles.selectFilter} value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                            <option value="">Todos os Papéis</option>
                            <option value="admin">Admin</option>
                            <option value="client">Cliente</option>
                        </select>
                        <select className={styles.selectFilter} value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)}>
                            <option value="">Todos os Status</option>
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                        </select>
                        <button className={styles.clearFiltersButton} onClick={() => handleClearFilters('users')}>Limpar Filtros</button>
                    </div>
                </div>
            )}
            {activeTab === 'sms' && (
                <div className={styles.filterBar}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={20} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por número, código, ID ou usuário..."
                            className={styles.searchInput}
                            value={smsSearchTerm}
                            onChange={(e) => setSmsSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <select className={styles.selectFilter} value={smsServiceFilter} onChange={(e) => setSmsServiceFilter(e.target.value)}>
                            <option value="">Todos os Serviços</option>
                            <option value="wa">WhatsApp</option>
                            <option value="tg">Telegram</option>
                            <option value="ig">Instagram</option>
                            <option value="go">Google</option>
                            <option value="ifood">iFood</option>
                        </select>
                        <select className={styles.selectFilter} value={smsStatusFilter} onChange={(e) => setSmsStatusFilter(e.target.value)}>
                            <option value="">Todos os Status</option>
                            <option value="received">Recebido</option>
                            <option value="pending">Pendente</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                        <input
                            type="text"
                            placeholder="ID/Usuário do Cliente"
                            className={styles.searchInput}
                            value={smsUserFilter}
                            onChange={(e) => setSmsUserFilter(e.target.value)}
                        />
                        <button className={styles.clearFiltersButton} onClick={() => handleClearFilters('sms')}>Limpar Filtros</button>
                    </div>
                </div>
            )}
            {activeTab === 'services' && (
                <div className={styles.filterBar}>
                    <div className={styles.searchInputWrapper}>
                        <Search size={20} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou código..."
                            className={styles.searchInput}
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <select className={styles.selectFilter} value={serviceCategoryFilter} onChange={(e) => setServiceCategoryFilter(e.target.value)}>
                            <option value="">Todas as Categorias</option>
                            <option value="Social">Social</option>
                            <option value="Delivery">Delivery</option>
                            <option value="Transporte">Transporte</option>
                        </select>
                        <select className={styles.selectFilter} value={serviceStatusFilter} onChange={(e) => setServiceStatusFilter(e.target.value)}>
                            <option value="">Todos os Status</option>
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                        </select>
                        <button className={styles.clearFiltersButton} onClick={() => handleClearFilters('services')}>Limpar Filtros</button>
                        <button className={styles.actionButtonPrimary} onClick={handleCreateService}>
                            <PlusCircle size={18} /> Criar Novo Serviço
                        </button>
                    </div>
                </div>
            )}


            {content} {/* Renderiza o conteúdo da aba (loading, error, table) */}

            {/* Modal de Serviço (Real) */}
            {isServiceModalOpen && (
                <ServiceModal
                    service={editingService}
                    onClose={() => setIsServiceModalOpen(false)}
                />
            )}
        </div>
    );
}