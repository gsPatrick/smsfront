// src/app/dashboard/perfil/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, Mail, DollarSign, Lock, CreditCard, MessageSquareText, LogOut } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge/StatusBadge';
import styles from './PerfilUsuario.module.css';
import { useAuth } from '../../context/AuthContext'; // Importe o AuthContext
import { authenticatedFetch } from '../../utils/api'; // Importe a função de fetch autenticada

export default function PerfilUsuarioPage() {
    const { user: authUser, token, loading: authLoading, logout, updateUser } = useAuth(); // Obtenha user, token e logout do contexto
    
    // Estados para os dados do formulário, inicializados com os dados do AuthContext
    const [username, setUsername] = useState(authUser?.username || '');
    const [email, setEmail] = useState(authUser?.email || '');
    const [currentCredits, setCurrentCredits] = useState(authUser?.credits || 0); // Saldo atual

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [creditHistory, setCreditHistory] = useState([]);
    const [smsHistory, setSmsHistory] = useState([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);

    // Efeito para sincronizar os dados do usuário do AuthContext com os estados locais do formulário
    useEffect(() => {
        if (authUser) {
            setUsername(authUser.username);
            setEmail(authUser.email);
            setCurrentCredits(authUser.credits);
        }
    }, [authUser]);

    // Função para carregar os históricos
    const loadUserHistory = useCallback(async () => {
        if (!token || authLoading) return;

        setPageLoading(true);
        setError(null);
        try {
            // Buscar Histórico de Créditos
            const creditsData = await authenticatedFetch('/api/credits/history', 'GET', null, token);
            const formattedCreditHistory = creditsData.transactions.map(tx => ({
                id: tx.id,
                type: tx.type,
                date: new Date(tx.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
                description: tx.description,
                amount: `${tx.type === 'credit_purchase' || tx.type === 'refund' ? '+' : '-' }R$ ${parseFloat(tx.amount).toFixed(2).replace('.', ',')}`,
                status: tx.status
            }));
            setCreditHistory(formattedCreditHistory);

            // Buscar Histórico de Envios SMS
            const smsData = await authenticatedFetch('/api/sms/history', 'GET', null, token);
            const formattedSmsHistory = smsData.messages.map(msg => ({
                id: msg.id,
                service: msg.service_code, // Ou msg.metadata.service_name se disponível
                number: msg.to_number,
                code: msg.message_body || '-',
                date_time: new Date(msg.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
                status: msg.status
            }));
            setSmsHistory(formattedSmsHistory);

        } catch (err) {
            setError(err.message || 'Falha ao carregar históricos.');
            console.error('Erro ao carregar históricos:', err);
        } finally {
            setPageLoading(false);
        }
    }, [token, authLoading]);

    useEffect(() => {
        loadUserHistory();
    }, [loadUserHistory]);


    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!token) return;

        try {
            const updatedUser = await authenticatedFetch('/api/auth/profile', 'PUT', { username, email }, token);
            updateUser(updatedUser); // Atualiza o usuário no AuthContext
            alert('Perfil atualizado com sucesso!');
        } catch (err) {
            setError(err.message || 'Falha ao atualizar perfil.');
            alert(`Erro ao atualizar perfil: ${err.message || 'Verifique os dados.'}`);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!token) return;

        if (newPassword !== confirmPassword) {
            alert('Nova senha e confirmação não conferem.');
            return;
        }
        if (newPassword.length < 6) {
            alert('Nova senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            alert('Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número.');
            return;
        }

        try {
            await authenticatedFetch('/api/auth/password', 'PUT', { currentPassword, newPassword }, token);
            alert('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.message || 'Falha ao alterar senha.');
            alert(`Erro ao alterar senha: ${err.message || 'Verifique sua senha atual.'}`);
        }
    };

    const handleLogout = () => {
        logout(); // Chama a função de logout do contexto
    };

    if (pageLoading) {
        return <div className={styles.loadingState}>Carregando Perfil...</div>;
    }

    if (error) {
        return <div className={styles.errorState}>Erro: {error}</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.sectionTitle}>Meu Perfil</h2>
            <p className={styles.sectionSubtitle}>Gerencie suas informações e histórico de uso.</p>

            <div className={styles.profileGrid}>
                {/* Informações do Perfil */}
                <div className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>Dados Pessoais</h3>
                    <div className={styles.infoItem}>
                        <User size={20} className={styles.infoIcon} />
                        <span>Nome:</span>
                        <strong>{username}</strong>
                    </div>
                    <div className={styles.infoItem}>
                        <Mail size={20} className={styles.infoIcon} />
                        <span>Email:</span>
                        <strong>{email}</strong>
                    </div>
                    <div className={styles.infoItem}>
                        <DollarSign size={20} className={styles.infoIcon} />
                        <span>Créditos:</span>
                        <strong>R$ {parseFloat(currentCredits).toFixed(2).replace('.', ',')}</strong>
                    </div>
                    {authUser?.role === 'admin' && (
                        <div className={styles.infoItem}>
                            <Lock size={20} className={styles.infoIcon} />
                            <span>Permissão:</span>
                            <strong>Administrador</strong>
                        </div>
                    )}
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        <LogOut size={18} /> Sair da Conta
                    </button>
                </div>

                {/* Formulário de Atualização de Perfil */}
                <div className={styles.formCard}>
                    <h3 className={styles.cardTitle}>Atualizar Perfil</h3>
                    <form onSubmit={handleUpdateProfile}>
                        <div className={styles.formGroup}>
                            <label htmlFor="username">Nome de Usuário</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitButton}>Salvar Alterações</button>
                    </form>
                </div>

                {/* Formulário de Alteração de Senha */}
                <div className={styles.formCard}>
                    <h3 className={styles.cardTitle}>Alterar Senha</h3>
                    <form onSubmit={handleChangePassword}>
                        <div className={styles.formGroup}>
                            <label htmlFor="currentPassword">Senha Atual</label>
                            <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="newPassword">Nova Senha</label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitButton}>Alterar Senha</button>
                    </form>
                </div>
            </div>

            {/* Histórico de Créditos */}
            <div className={styles.historyCard}>
                <h3 className={styles.cardTitle}><CreditCard size={20} /> Histórico de Créditos</h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.historyTable}>
                        <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Data</th>
                                <th>Descrição</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {creditHistory.length > 0 ? (
                                creditHistory.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.type === 'credit_purchase' ? 'Compra' : item.type === 'sms_sent' || item.type === 'sms_received' ? 'Débito' : 'Reembolso'}</td>
                                        <td>{item.date}</td>
                                        <td>{item.description}</td>
                                        <td>{item.amount}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className={styles.noResults}>Nenhuma transação de crédito encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Histórico de Envios SMS */}
            <div className={styles.historyCard}>
                <h3 className={styles.cardTitle}><MessageSquareText size={20} /> Histórico de Envios SMS</h3>
                <div className={styles.tableWrapper}>
                    <table className={styles.historyTable}>
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
                            {smsHistory.length > 0 ? (
                                smsHistory.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.service}</td>
                                        <td>{item.number}</td>
                                        <td>{item.code}</td>
                                        <td>{item.date_time}</td>
                                        <td><StatusBadge status={item.status} /></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className={styles.noResults}>Nenhum envio SMS encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}