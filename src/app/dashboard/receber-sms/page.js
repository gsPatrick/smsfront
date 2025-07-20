// src/app/dashboard/receber-sms/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Copy, RefreshCw, XCircle, Clock, MessageSquareText, Send, Instagram, Utensils, Car, Facebook, Globe, Film, MessageCircle } from 'lucide-react';
import styles from './ReceberSms.module.css';
import ServiceCard from '@/components/ServiceCard/ServiceCard';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

const serviceIconsMap = {
  'wa': <MessageCircle size={24} />,
  'tg': <Send size={24} />,
  'ig': <Instagram size={24} />,
  'ifood': <Utensils size={24} />,
  '99': <Car size={24} />,
  'uber': <Car size={24} />,
  'fb': <Facebook size={24} />,
  'go': <Globe size={24} />,
  'kwai': <Film size={24} />,
  'tiktok': <Film size={24} />,
};

export default function ReceberSmsPage() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  const [allServices, setAllServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [activeNumber, setActiveNumber] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [smsCode, setSmsCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const handleCancelActivation = useCallback(async (reason = 'Cancelado pelo usuário.', activeNumId = activeNumber?.id) => {
    if (!activeNumId) return;
    setIsLoading(true);
    setError(null);

    try {
      await authenticatedFetch(`/api/sms/cancel/${activeNumId}`, 'POST', { reason }, token);
      alert(`Ativação para ${activeNumber.phone} cancelada: ${reason}`);
      setActiveNumber(null);
      setSelectedService(null);
      setSmsCode('');
    } catch (err) {
      setError(err.message || 'Falha ao cancelar número.');
    } finally {
      setIsLoading(false);
    }
  }, [activeNumber, token]);

  // =========================================================================
  // CORREÇÃO APLICADA AQUI: As dependências dos useCallbacks foram ajustadas
  // para remover o objeto 'user', quebrando o loop de renderização.
  // =========================================================================

  const loadServices = useCallback(async () => {
    if (!token) return;
    try {
      const services = await authenticatedFetch('/api/admin/services/available', 'GET', null, token);
      const formattedServices = services.map(svc => ({
        ...svc,
        icon: serviceIconsMap[svc.code] || <MessageSquareText size={24} />
      }));
      setAllServices(formattedServices);
    } catch (err) {
      throw err;
    }
  }, [token]);

  // Esta função agora depende apenas de 'token' e 'updateUser', que são estáveis.
  const loadUserBalance = useCallback(async () => {
    if (!token) return;
    try {
        const balanceData = await authenticatedFetch('/api/credits/balance', 'GET', null, token);
        updateUser(prevUser => ({ ...prevUser, credits: balanceData.credits })); 
    } catch (err) {
        throw err;
    }
  }, [token, updateUser]);

  const handleSelectService = useCallback((service) => {
    if (user && parseFloat(user.credits) < parseFloat(service.price_per_otp)) {
        alert(`Saldo insuficiente (R$ ${parseFloat(user.credits).toFixed(2).replace('.', ',')}) para este serviço.`);
        return;
    }
    setSelectedService(service);
  }, [user]);

  const handleRequestNumber = useCallback(async () => {
    if (!selectedService) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticatedFetch('/api/sms/request-number', 'POST', { service_code: selectedService.code }, token);
      
      setActiveNumber({
        id: result.active_number.id,
        phone: result.active_number.phone_number,
        service: selectedService,
        status: 'active',
      });
      setCountdown(120);
      setSmsCode('');
      // Atualiza o saldo localmente para refletir o débito imediatamente
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(selectedService.price_per_otp) }));
      alert(`Número ${result.active_number.phone_number} solicitado com sucesso!`);
    } catch (err) {
      setError(err.message || 'Falha ao solicitar número.');
      alert(`Erro ao solicitar número: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedService, token, updateUser]);

  // --- O resto do arquivo permanece o mesmo, mas está incluído para completude ---

  const handleReactivateNumber = useCallback(async () => {
    if (!activeNumber || activeNumber.status !== 'active' || (user && parseFloat(user.credits) < parseFloat(activeNumber.service.price_per_otp))) {
        alert("Não é possível reativar: número inativo ou saldo insuficiente.");
        return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await authenticatedFetch(`/api/sms/reactivate/${activeNumber.id}`, 'POST', null, token);
      setCountdown(120);
      setSmsCode('');
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(activeNumber.service.price_per_otp) }));
      alert(`Número ${activeNumber.phone} reativado com sucesso!`);
    } catch (err) {
      setError(err.message || 'Falha ao reativar número.');
      alert(`Erro ao reativar número: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeNumber, token, user, updateUser]);

  useEffect(() => {
    if (!authLoading && token) {
      const fetchData = async () => {
        setPageLoading(true);
        setError(null);
        try {
          await Promise.all([ loadServices(), loadUserBalance() ]);
        } catch (err) {
          setError(err.message || 'Falha ao carregar dados da página.');
        } finally {
          setPageLoading(false);
        }
      };
      fetchData();
    }
  }, [authLoading, token, loadServices, loadUserBalance]);

  useEffect(() => {
    let timer;
    if (activeNumber && activeNumber.status === 'active' && countdown > 0 && !smsCode) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleCancelActivation('Tempo esgotado.', activeNumber.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeNumber, smsCode, handleCancelActivation]);

  useEffect(() => {
    let pollingInterval;
    if (activeNumber && activeNumber.status === 'active' && !smsCode) {
      pollingInterval = setInterval(async () => {
        try {
          const statusResult = await authenticatedFetch(`/api/sms/status/${activeNumber.id}`, 'GET', null, token);
          if (statusResult.status === 'completed' && statusResult.code) {
            setSmsCode(statusResult.code);
            setActiveNumber(prev => ({ ...prev, status: 'completed' }));
            clearInterval(pollingInterval);
          } else if (['cancelled', 'expired'].includes(statusResult.status)) {
            setActiveNumber(prev => ({ ...prev, status: statusResult.status }));
            clearInterval(pollingInterval);
            alert(`Ativação para o número ${activeNumber.phone} foi ${statusResult.status}.`);
          }
        } catch (pollError) {
          console.error('Erro no polling de status:', pollError.message);
          clearInterval(pollingInterval);
        }
      }, 5000);
    }
    return () => clearInterval(pollingInterval);
  }, [activeNumber, smsCode, token]);

  const filteredServices = allServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`"${text}" copiado para a área de transferência!`);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando...</div>;
  }

  if (error && !activeNumber) {
    return <div className={styles.errorState}>Erro: {error}</div>;
  }

  return (
    <div className={styles.container}>
      {activeNumber ? (
        <div className={styles.activationCard}>
          <div className={styles.activationHeader}>
              <div className={styles.activationIconWrapper}>{activeNumber.service.icon}</div>
              <h2 className={styles.sectionTitle}>Aguardando código para {activeNumber.service.name}</h2>
              <button className={styles.cancelButton} onClick={() => handleCancelActivation()}><XCircle size={20} /> Cancelar</button>
          </div>
          <div className={styles.activationBody}>
              <div className={styles.infoBox}>
                  <p className={styles.infoLabel}>Número Ativado</p>
                  <div className={styles.infoValue}>
                      <span>{activeNumber.phone}</span>
                      <button onClick={() => copyToClipboard(activeNumber.phone)} className={styles.copyButton}><Copy size={16} /></button>
                  </div>
              </div>
              <div className={styles.infoBox}>
                  <p className={styles.infoLabel}>Tempo Restante</p>
                  <div className={`${styles.infoValue} ${styles.countdown}`}><Clock size={18}/> {formatTime(countdown)}</div>
              </div>
          </div>
          <div className={styles.smsCodeArea}>
              <p className={styles.infoLabel}>Código Recebido</p>
              {smsCode ? (
                  <div className={`${styles.infoValue} ${styles.codeReceived}`}>
                      <strong>{smsCode}</strong>
                      <button onClick={() => copyToClipboard(smsCode)} className={styles.copyButton}><Copy size={16} /></button>
                  </div>
              ) : (
                  <div className={styles.waitingForCode}><div className={styles.spinner}></div>Aguardando SMS...</div>
              )}
          </div>
          <div className={styles.activationActions}>
              <button className={styles.reactivateButton} onClick={handleReactivateNumber} disabled={isLoading || !!smsCode || activeNumber.status !== 'active' || countdown <= 0}>
                  <RefreshCw size={16} /> Reativar Número (se o código não chegar)
              </button>
          </div>
        </div>
      ) : (
        <div className={styles.selectionGrid}>
          <div className={styles.serviceList}>
            <h2 className={styles.sectionTitle}>Selecione um serviço</h2>
            <p className={styles.sectionSubtitle}>Escolha um serviço para receber o código SMS.</p>
            <div className={styles.searchBar}>
              <Search size={20} className={styles.searchIcon} />
              <input type="text" placeholder="Buscar serviço (ex: WhatsApp)" className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className={styles.servicesGrid}>
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} onSelect={handleSelectService} isSelected={selectedService?.id === service.id}/>
                ))
              ) : ( <p className={styles.noServiceSelected}>Nenhum serviço encontrado.</p> )}
            </div>
          </div>
          <div className={styles.summarySection}>
            <div className={styles.summaryCard}>
              <h3 className={styles.summaryTitle}>Ativar Número</h3>
              {selectedService ? (
                <>
                  <div className={styles.summaryService}>
                    <div className={styles.summaryIconWrapper}>{selectedService.icon}</div>
                    <div>
                      <p>Serviço selecionado</p>
                      <strong>{selectedService.name}</strong>
                    </div>
                  </div>
                  <div className={styles.summaryItem}><span>Custo por SMS</span><strong>R$ {parseFloat(selectedService.price_per_otp).toFixed(2).replace('.', ',')}</strong></div>
                  <div className={styles.summaryItem}><span>Seu Saldo Atual</span><strong>R$ {user?.credits ? parseFloat(user.credits).toFixed(2).replace('.', ',') : '0,00'}</strong></div>
                  <button className={styles.requestButton} onClick={handleRequestNumber} disabled={isLoading || (user && parseFloat(user.credits) < parseFloat(selectedService.price_per_otp))}>
                    {isLoading ? <div className={styles.buttonSpinner}></div> : 'Solicitar Número'}
                  </button>
                </>
              ) : ( <p className={styles.noServiceSelected}>Selecione um serviço na lista para continuar.</p> )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}