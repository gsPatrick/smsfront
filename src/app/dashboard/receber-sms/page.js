// src/app/dashboard/receber-sms/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Copy, RefreshCw, XCircle, Clock, MessageSquareText, Send, Instagram, Utensils, Car, Facebook, Globe, Film, MessageCircle } from 'lucide-react';
import styles from './ReceberSms.module.css';
import ServiceCard from '../../../components/ServiceCard/ServiceCard';
import CountrySelectionModal from '../../../components/CountrySelectionModal/CountrySelectionModal';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

const serviceIconsMap = {
  'wa': <MessageSquareText size={24} />, 'tg': <Send size={24} />, 'ig': <Instagram size={24} />,
  'ifood': <Utensils size={24} />, '99': <Car size={24} />, 'uber': <Car size={24} />,
  'fb': <Facebook size={24} />, 'go': <Globe size={24} />, 'kwai': <Film size={24} />,
  'tiktok': <Film size={24} />,
};

export default function ReceberSmsPage() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  
  // Estado principal da página
  const [allServices, setAllServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeNumber, setActiveNumber] = useState(null);
  
  // Estado para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [countriesForService, setCountriesForService] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);

  // Estados de controle e ativação
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [smsCode, setSmsCode] = useState('');

  // 1. Carrega a lista de serviços com PREÇO INICIAL
  useEffect(() => {
    if (!authLoading && token) {
      const loadServices = async () => {
        setPageLoading(true);
        setError(null);
        try {
          const serviceData = await authenticatedFetch('/api/sms/services-with-prices', 'GET', null, token);
          const formattedServices = serviceData.map(svc => ({
            ...svc,
            icon: serviceIconsMap[svc.code] || <MessageSquareText size={24} />
          }));
          setAllServices(formattedServices);
        } catch (err) {
          setError(err.message || 'Falha ao carregar serviços.');
        } finally {
          setPageLoading(false);
        }
      };
      loadServices();
    }
  }, [authLoading, token]);

  // 2. Abre o modal e busca os países para o serviço clicado
  const handleServiceClick = useCallback(async (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
    setCountriesLoading(true);
    setCountriesError(null);
    setCountriesForService([]);

    try {
      const countryData = await authenticatedFetch(`/api/sms/countries-by-service/${service.code}`, 'GET', null, token);
      setCountriesForService(countryData);
    } catch (err) {
      setCountriesError(err.message || 'Não foi possível carregar os países para este serviço.');
    } finally {
      setCountriesLoading(false);
    }
  }, [token]);
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  // 3. Função chamada PELO MODAL para solicitar o número
  const handleRequestNumber = useCallback(async (country) => {
    if (!selectedService || !country) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticatedFetch('/api/sms/request-number', 'POST', { 
        service_code: selectedService.code,
        country_code: country.id,
      }, token);
      
      setActiveNumber({
        id: result.active_number.id,
        phone: result.active_number.phone_number,
        service: selectedService,
        country: country,
        status: 'active',
      });
      setCountdown(120);
      setSmsCode('');
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(country.sellPrice) }));
    } catch (err) {
      alert(`Erro ao solicitar número: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedService, token, updateUser]);

  const filteredServices = useMemo(() => allServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allServices, searchTerm]);

  // Funções de ciclo de vida da ativação
  const handleCancelActivation = useCallback(async (reason = 'Cancelado pelo usuário', activeNumId = activeNumber?.id) => {
    if (!activeNumId) return;
    setIsLoading(true);
    try {
      await authenticatedFetch(`/api/sms/cancel/${activeNumId}`, 'POST', { reason }, token);
      setActiveNumber(null);
      setSmsCode('');
    } catch (err) {
      alert(err.message || 'Falha ao cancelar número.');
    } finally {
      setIsLoading(false);
    }
  }, [activeNumber, token]);

  const handleReactivateNumber = useCallback(async () => {
    if (!activeNumber || (user && parseFloat(user.credits) < parseFloat(activeNumber.service.startingPrice))) { // Use startingPrice as fallback
        alert("Saldo insuficiente para reativar.");
        return;
    }
    setIsLoading(true);
    try {
      await authenticatedFetch(`/api/sms/reactivate/${activeNumber.id}`, 'POST', null, token);
      setCountdown(120);
      setSmsCode('');
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(activeNumber.country.sellPrice) })); // debit correct price
    } catch (err) {
      alert(`Erro ao reativar número: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeNumber, token, user, updateUser]);

  useEffect(() => {
    let timer;
    if (activeNumber && countdown > 0 && !smsCode) {
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
  }, [activeNumber, countdown, smsCode, handleCancelActivation]);

  useEffect(() => {
    let pollingInterval;
    if (activeNumber && !smsCode) {
      pollingInterval = setInterval(async () => {
        try {
          const statusResult = await authenticatedFetch(`/api/sms/status/${activeNumber.id}`, 'GET', null, token);
          if (statusResult.status === 'completed' && statusResult.code) {
            setSmsCode(statusResult.code);
            clearInterval(pollingInterval);
          } else if (['cancelled', 'expired'].includes(statusResult.status)) {
            alert(`Ativação para ${activeNumber.phone} foi ${statusResult.status}.`);
            setActiveNumber(null);
            clearInterval(pollingInterval);
          }
        } catch (pollError) {
          console.error('Erro no polling de status:', pollError.message);
          clearInterval(pollingInterval);
        }
      }, 5000);
    }
    return () => clearInterval(pollingInterval);
  }, [activeNumber, smsCode, token]);

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert(`"${text}" copiado!`); };
  const formatTime = (seconds) => { const m = Math.floor(seconds/60); const s = seconds % 60; return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; };

  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando serviços...</div>;
  }
  if (error) {
    return <div className={styles.errorState}>{error}</div>;
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
                    <button className={styles.reactivateButton} onClick={handleReactivateNumber} disabled={isLoading || !!smsCode || countdown <= 0}>
                        <RefreshCw size={16} /> Reativar Número (se o código não chegar)
                    </button>
                </div>
            </div>
        ) : (
            <div className={styles.selectionContainer}>
                <h2 className={styles.sectionTitle}>Selecione um Serviço</h2>
                <p className={styles.sectionSubtitle}>Escolha um serviço para o qual você deseja receber um código de verificação.</p>
                <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input type="text" placeholder="Buscar serviço (ex: WhatsApp)" className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className={styles.servicesGrid}>
                    {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                            <ServiceCard key={service.code} service={service} onSelect={handleServiceClick} />
                        ))
                    ) : ( <p className={styles.placeholderText}>Nenhum serviço encontrado.</p> )}
                </div>
            </div>
        )}
        
        <CountrySelectionModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            service={selectedService}
            countries={countriesForService}
            isLoading={countriesLoading}
            error={countriesError}
            onRequestNumber={handleRequestNumber}
            userCredits={user?.credits}
        />
    </div>
  );
}