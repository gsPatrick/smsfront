// src/app/dashboard/admin/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User, MessageSquareText, Settings, Search,
  ChevronLeft, ChevronRight, Edit, Pause, Play, Trash2, PlusCircle, CreditCard, Save
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './AdminPanel.module.css';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

const itemsPerPage = 10;

export default function AdminPanelPage() {
    const { token, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'sms', 'services', 'settings'

    // State de Paginação Compartilhado
    const [currentPage, setCurrentPage] = useState(1);

    // --- State dos Usuários ---
    const [users, setUsers] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('');
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState(null);

    // --- State das Mensagens SMS (Mantido para integridade do componente) ---
    const [smsMessages, setSmsMessages] = useState([]);
    const [smsMessageCount, setSmsMessageCount] = useState(0);
    const [smsSearchTerm, setSmsSearchTerm] = useState('');
    const [smsServiceFilter, setSmsServiceFilter] = useState('');
    const [smsStatusFilter, setSmsStatusFilter] = useState('');
    const [smsUserFilter, setSmsUserFilter] = useState('');
    const [smsLoading, setSmsLoading] = useState(true);
    const [smsError, setSmsError] = useState(null);

    // --- State dos Serviços ---
    const [services, setServices] = useState([]);
    const [serviceCount, setServiceCount] = useState(0);
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [serviceCategoryFilter, setServiceCategoryFilter] = useState('');
    const [serviceStatusFilter, setServiceStatusFilter] = useState('');
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState(null);
    
    // --- State de Configurações ---
    const [settings, setSettings] = useState({ 'MERCADOPAGO_ACCESS_TOKEN': '' });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(null);

    // --- Funções para a Aba de Configurações ---
    const handleSettingsChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        if (!token) return;
        setSettingsLoading(true);
        try {
            const payload = { MERCADOPAGO_ACCESS_TOKEN: settings.MERCADOPAGO_ACCESS_TOKEN || '' };
            await authenticatedFetch('/api/settings', 'PUT', payload, token);
            alert('Configurações salvas com sucesso!');
        } catch (err) {
            setSettingsError(err.message || 'Falha ao salvar configurações.');
            alert(`Erro: ${err.message}`);
        } finally {
            setSettingsLoading(false);
        }
    };
    
    const loadSettings = useCallback(async () => {
        if (!token || authLoading) return;
        setSettingsLoading(true);
        setSettingsError(null);
        try {
            const data = await authenticatedFetch('/api/settings', 'GET', null, token);
            const settingsObject = data.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});
            setSettings(prev => ({ ...prev, ...settingsObject }));
        } catch (err) {
            setSettingsError(err.message || 'Falha ao carregar configurações.');
        } finally {
            setSettingsLoading(false);
        }
    }, [token, authLoading]);

    // --- Funções de Carregamento de Dados ---
    const loadUsers = useCallback(async () => {
        if (!token || authLoading) return;
        setUsersLoading(true);
        setUsersError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                ...(userSearchTerm && { search: userSearchTerm }),
                ...(userRoleFilter && { role: userRoleFilter }),
                ...(userStatusFilter !== '' && { is_active: userStatusFilter })
            });
            const data = await authenticatedFetch(`/api/admin/users?${queryParams.toString()}`, 'GET', null, token);
            setUsers(data.users);
            setUserCount(data.pagination.total_items);
        } catch (err) {
            setUsersError(err.message || 'Falha ao carregar usuários.');
        } finally {
            setUsersLoading(false);
        }
    }, [token, authLoading, currentPage, userSearchTerm, userRoleFilter, userStatusFilter]);
    
    const loadSmsMessages = useCallback(async () => {
        if (!token || authLoading) return;
        setSmsLoading(true);
        setSmsError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
                ...(smsSearchTerm && { search: smsSearchTerm }),
                ...(smsServiceFilter && { service_code: smsServiceFilter }),
                ...(smsStatusFilter && { status: smsStatusFilter }),
                ...(smsUserFilter && { user_id: smsUserFilter })
            });
            const data = await authenticatedFetch(`/api/sms/all-history?${queryParams.toString()}`, 'GET', null, token);
            setSmsMessages(data.messages);
            setSmsMessageCount(data.pagination.total_items);
        } catch (err) {
            setSmsError(err.message || 'Falha ao carregar mensagens SMS.');
        } finally {
            setSmsLoading(false);
        }
    }, [token, authLoading, currentPage, smsSearchTerm, smsServiceFilter, smsStatusFilter, smsUserFilter]);

    const loadSmsServices = useCallback(async () => {
        if (!token || authLoading) return;
        setServicesLoading(true);
        setServicesError(null);
        try {
            const queryParams = new URLSearchParams({
                page: currentPage, limit: itemsPerPage,
                ...(serviceSearchTerm && { search: serviceSearchTerm }),
                ...(serviceCategoryFilter && { category: serviceCategoryFilter }),
                ...(serviceStatusFilter !== '' && { active: serviceStatusFilter })
            });
            const data = await authenticatedFetch(`/api/admin/services?${queryParams.toString()}`, 'GET', null, token);
            setServices(data.services);
            setServiceCount(data.pagination.total_items);
        } catch (err) {
            setServicesError(err.message || 'Falha ao carregar serviços.');
        } finally {
            setServicesLoading(false);
        }
    }, [token, authLoading, currentPage, serviceSearchTerm, serviceCategoryFilter, serviceStatusFilter]);

    // --- useEffect Hooks ---
    useEffect(() => {
        setCurrentPage(1);
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'sms') loadSmsMessages();
        if (activeTab === 'services') loadSmsServices();
        if (activeTab === 'settings') loadSettings();
    }, [activeTab, userSearchTerm, userRoleFilter, userStatusFilter, smsSearchTerm, smsServiceFilter, smsStatusFilter, smsUserFilter, serviceSearchTerm, serviceCategoryFilter, serviceStatusFilter, loadUsers, loadSmsMessages, loadSmsServices, loadSettings]);

    useEffect(() => {
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'sms') loadSmsMessages();
        if (activeTab === 'services') loadSmsServices();
    }, [currentPage, activeTab, loadUsers, loadSmsMessages, loadSmsServices]);

    // --- Funções de Ação e Modal ---
    const handleCreateService = () => { setEditingService(null); setIsServiceModalOpen(true); };
    const handleEditService = (service) => { setEditingService(service); setIsServiceModalOpen(true); };
    const handleDeleteService = async (service) => {
        if (!token || !confirm(`Tem certeza que deseja deletar o serviço ${service.name}?`)) return;
        try {
            await authenticatedFetch(`/api/admin/services/${service.id}`, 'DELETE', null, token);
            alert('Serviço deletado com sucesso!');
            loadSmsServices();
        } catch (err) {
            alert(`Erro ao deletar serviço: ${err.message}`);
        }
    };
    
    const ServiceModal = ({ service, onClose }) => {
        const [formData, setFormData] = useState({
            name: service?.name || '', code: service?.code || '',
            price_per_otp: service?.price_per_otp || 0,
            description: service?.description || '', category: service?.category || '',
            active: service ? service.active : true
        });

        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            const payload = { ...formData, price_per_otp: parseFloat(formData.price_per_otp) };
            try {
                if (service) {
                    await authenticatedFetch(`/api/admin/services/${service.id}`, 'PUT', payload, token);
                } else {
                    await authenticatedFetch('/api/admin/services', 'POST', payload, token);
                }
                alert(`Serviço ${service ? 'atualizado' : 'criado'} com sucesso!`);
                loadSmsServices();
                onClose();
            } catch (err) {
                alert(`Erro: ${err.message}`);
            }
        };

        return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <h3 className={styles.modalTitle}>{service ? 'Editar Serviço' : 'Criar Novo Serviço'}</h3>
                    <form onSubmit={handleSubmit} className={styles.modalForm}>
                        <input name="name" placeholder="Nome" value={formData.name} onChange={handleChange} required />
                        <input name="code" placeholder="Código (ex: wa)" value={formData.code} onChange={handleChange} required />
                        <input name="price_per_otp" type="number" step="0.01" placeholder="Preço" value={formData.price_per_otp} onChange={handleChange} required />
                        <textarea name="description" placeholder="Descrição" value={formData.description} onChange={handleChange}></textarea>
                        <input name="category" placeholder="Categoria" value={formData.category} onChange={handleChange} />
                        <div><input name="active" type="checkbox" id="serviceActive" checked={formData.active} onChange={handleChange} /> <label htmlFor="serviceActive">Ativo</label></div>
                        <div className={styles.modalActions}>
                            <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
                            <button type="submit" className={styles.submitButton}>Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // --- Renderização do Conteúdo da Aba Ativa ---
    let content = null;
    if (activeTab === 'users') {
        if (usersLoading) content = <div className={styles.loadingState}>Carregando usuários...</div>;
        else if (usersError) content = <div className={styles.errorState}>{usersError}</div>;
        else content = (
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                        <thead><tr><th>ID</th><th>Usuário</th><th>Email</th><th>Créditos</th><th>Papel</th><th>Status</th><th>Ações</th></tr></thead>
                        <tbody>
                            {users.length > 0 ? users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.id.substring(0, 8)}...</td><td>{user.username}</td><td>{user.email}</td>
                                    <td>R$ {parseFloat(user.credits).toFixed(2).replace('.',',')}</td><td>{user.role}</td>
                                    <td><StatusBadge status={user.is_active ? 'Ativo' : 'Inativo'} /></td>
                                    <td className={styles.actionsCell}><button className={styles.actionButton}><Edit size={16}/></button><button className={`${styles.actionButton} ${styles.deleteButton}`}><Trash2 size={16}/></button></td>
                                </tr>
                            )) : <tr><td colSpan="7" className={styles.noResults}>Nenhum usuário encontrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } else if (activeTab === 'sms') {
        if (smsLoading) content = <div className={styles.loadingState}>Carregando mensagens...</div>;
        else if (smsError) content = <div className={styles.errorState}>{smsError}</div>;
        else content = (
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                        <thead><tr><th>ID</th><th>Usuário</th><th>Serviço</th><th>Número</th><th>Código</th><th>Data</th><th>Status</th></tr></thead>
                        <tbody>
                            {smsMessages.length > 0 ? smsMessages.map(msg => (
                                <tr key={msg.id}>
                                    <td>{msg.id.substring(0,8)}...</td><td>{msg.user?.username || msg.user_id}</td>
                                    <td>{msg.service_code}</td><td>{msg.to_number}</td><td>{msg.message_body || '-'}</td>
                                    <td>{new Date(msg.created_at).toLocaleString('pt-BR')}</td><td><StatusBadge status={msg.status} /></td>
                                </tr>
                            )) : <tr><td colSpan="7" className={styles.noResults}>Nenhuma mensagem encontrada.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } else if (activeTab === 'services') {
        if (servicesLoading) content = <div className={styles.loadingState}>Carregando serviços...</div>;
        else if (servicesError) content = <div className={styles.errorState}>{servicesError}</div>;
        else content = (
            <div className={styles.tableCard}>
                <div className={styles.tableHeaderActions}>
                    <button className={styles.actionButtonPrimary} onClick={handleCreateService}>
                        <PlusCircle size={18} /> Criar Novo Serviço
                    </button>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.adminTable}>
                        <thead><tr><th>Nome</th><th>Código</th><th>Preço/OTP</th><th>Ativo</th><th>Ações</th></tr></thead>
                        <tbody>
                            {services.length > 0 ? services.map(service => (
                                <tr key={service.id}>
                                    <td>{service.name}</td><td>{service.code}</td>
                                    <td>R$ {parseFloat(service.price_per_otp || 0).toFixed(2).replace('.', ',')}</td>
                                    <td><StatusBadge status={service.active ? 'Ativo' : 'Inativo'} /></td>
                                    <td className={styles.actionsCell}>
                                        <button className={styles.actionButton} onClick={() => handleEditService(service)}><Edit size={16} /></button>
                                        <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDeleteService(service)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="5" className={styles.noResults}>Nenhum serviço encontrado.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } else if (activeTab === 'settings') {
        if (settingsLoading && !Object.keys(settings).length) content = <div className={styles.loadingState}>Carregando configurações...</div>;
        else if (settingsError) content = <div className={styles.errorState}>{settingsError}</div>;
        else content = (
            <div className={styles.settingsCard}>
                <h3 className={styles.cardTitle}>Configurações de Pagamento</h3>
                <p className={styles.cardSubtitle}>Insira as chaves de API para os gateways de pagamento. Estas chaves são armazenadas de forma segura.</p>
                
                <div className={styles.formGroup}>
                    <label htmlFor="mp_access_token">
                        <CreditCard size={16} /> Mercado Pago - Access Token
                    </label>
                    <input
                        type="password"
                        id="mp_access_token"
                        placeholder="Cole seu Access Token do Mercado Pago aqui (ex: APP_USR-...)"
                        value={settings.MERCADOPAGO_ACCESS_TOKEN || ''}
                        onChange={(e) => handleSettingsChange('MERCADOPAGO_ACCESS_TOKEN', e.target.value)}
                    />
                    <small className={styles.formHint}>Você pode encontrar seu Access Token no painel de desenvolvedor do Mercado Pago, em "Credenciais de Produção".</small>
                </div>

                <div className={styles.settingsActions}>
                    <button className={styles.actionButtonPrimary} onClick={handleSaveSettings} disabled={settingsLoading}>
                        {settingsLoading ? 'Salvando...' : <><Save size={18} /> Salvar Configurações</>}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.mainTitle}>Painel de Administração</h2>
            <p className={styles.mainSubtitle}>Controle total sobre usuários, serviços e configurações da plataforma.</p>

            <div className={styles.tabs}>
                <button className={`${styles.tabButton} ${activeTab === 'users' ? styles.active : ''}`} onClick={() => setActiveTab('users')}>
                    <User size={18} /> Gerenciar Usuários
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'sms' ? styles.active : ''}`} onClick={() => setActiveTab('sms')}>
                    <MessageSquareText size={18} /> Envios SMS
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'services' ? styles.active : ''}`} onClick={() => setActiveTab('services')}>
                    <Settings size={18} /> Gerenciar Serviços
                </button>
                <button className={`${styles.tabButton} ${activeTab === 'settings' ? styles.active : ''}`} onClick={() => setActiveTab('settings')}>
                    <CreditCard size={18} /> Configurações
                </button>
            </div>

            {content}

            {isServiceModalOpen && <ServiceModal service={editingService} onClose={() => setIsServiceModalOpen(false)} />}
        </div>
    );
}