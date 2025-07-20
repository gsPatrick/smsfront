// src/app/dashboard/receber-sms/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Copy, RefreshCw, XCircle, Clock, MessageSquareText, Send, Instagram, Utensils, Car, Facebook, Globe, Film, MessageCircle, ChevronDown } from 'lucide-react';
import styles from './ReceberSms.module.css';
import ServiceCard from '@/components/ServiceCard/Service-Card';
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

// Mapeamento de códigos de país para nomes (simplificado)
// Em uma aplicação real, isso viria de um endpoint /api/countries
const countryNames = {
    '0': 'Rússia',
    '1': 'Ucrânia',
    '2': 'Cazaquistão',
    '6': 'Filipinas',
    '7': 'Mianmar',
    '10': 'Indonésia',
    '12': 'Malásia',
    '16': 'Inglaterra',
    '22': 'Nigéria',
    '29': 'EUA',
    '32': 'Laos',
    '34': 'Haiti',
    '36': 'Polônia',
    '40': 'Índia',
    '43': 'Vietnã',
    '45': 'Países Baixos',
    '48': 'Brasil',
    '52': 'Romênia',
    '73': 'Colômbia',
};

export default function ReceberSmsPage() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  
  // Estados da página
  const [allServices, setAllServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [countryPrices, setCountryPrices] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Estados de ativação
  const [activeNumber, setActiveNumber] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [smsCode, setSmsCode] = useState('');
  
  // Estados de controle (loading, erros)
  const [isLoading, setIsLoading] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pricesError, setPricesError] = useState(null);

  // Carregamento inicial dos serviços disponíveis no sistema
  const loadServices = useCallback(async () => {
    if (!token) return;
    try {
      const services = await authenticatedFetch('/api/sms/services', 'GET', null, token);
      const formattedServices = services.map(svc => ({
        ...svc,
        icon: serviceIconsMap[svc.code] || <MessageSquareText size={24} />
      }));
      setAllServices(formattedServices);
    } catch (err) {
      throw err;
    }
  }, [token]);
  
  useEffect(() => {
    if (!authLoading && token) {
      setPageLoading(true);
      setError(null);
      loadServices().catch(err => {
        setError(err.message || 'Falha ao carregar serviços.');
      }).finally(() => {
        setPageLoading(false);
      });
    }
  }, [authLoading, token, loadServices]);

  // Função chamada ao selecionar um serviço. Busca os preços por país.
  const handleSelectService = useCallback(async (service) => {
    setSelectedService(service);
    setSelectedCountry(null);
    setCountryPrices([]);
    setPricesLoading(true);
    setPricesError(null);

    try {
      const pricesData = await authenticatedFetch(`/api/sms/prices/${service.code}`, 'GET', null, token);
      const countryList = Object.entries(pricesData)
        .map(([countryId, details]) => ({
            id: countryId,
            name: countryNames[countryId] || `País #${countryId}`, // Usa o mapeamento de nomes
            cost: details.cost,
            count: details.count
        }))
        .sort((a, b) => b.count - a.count); // Ordena por maior quantidade disponível
        
      setCountryPrices(countryList);
    } catch (err) {
      setPricesError(err.message || 'Não foi possível carregar os países para este serviço.');
    } finally {
      setPricesLoading(false);
    }
  }, [token]);

  // Função para selecionar um país da lista
  const handleSelectCountry = (country) => {
    if (user && parseFloat(user.credits) < parseFloat(country.cost)) {
        alert(`Saldo insuficiente (R$ ${parseFloat(user.credits).toFixed(2).replace('.', ',')}) para este país.`);
        return;
    }
    setSelectedCountry(country);
  }

  // Função para solicitar o número, agora com o código do país
  const handleRequestNumber = useCallback(async () => {
    if (!selectedService || !selectedCountry) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticatedFetch('/api/sms/request-number', 'POST', { 
        service_code: selectedService.code,
        country_code: selectedCountry.id, // Envia o código do país selecionado
      }, token);
      
      setActiveNumber({
        id: result.active_number.id,
        phone: result.active_number.phone_number,
        service: selectedService,
        country: selectedCountry,
        status: 'active',
      });
      setCountdown(120);
      setSmsCode('');
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(selectedCountry.cost) }));
      alert(`Número ${result.active_number.phone_number} solicitado com sucesso!`);
    } catch (err) {
      setError(err.message || 'Falha ao solicitar número.');
      alert(`Erro ao solicitar número: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedService, selectedCountry, token, updateUser]);
  
  // (O resto do arquivo com as funções de reativar, cancelar, polling, etc., permanece o mesmo)
  // --- Funções de reativar, cancelar, polling e helpers (sem alterações) ---
  const handleCancelActivation = useCallback(async (reason = 'Cancelado pelo usuário.', activeNumId = activeNumber?.id) => { /* ... */ });
  const handleReactivateNumber = useCallback(async () => { /* ... */ });
  useEffect(() => { /* ... (timer do countdown) */ }, [activeNumber, smsCode, handleCancelActivation]);
  useEffect(() => { /* ... (polling de status) */ }, [activeNumber, smsCode, token]);
  const copyToClipboard = (text) => { /* ... */ };
  const formatTime = (seconds) => { /* ... */ };


  const filteredServices = useMemo(() => allServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allServices, searchTerm]);

  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando...</div>;
  }

  if (error && !activeNumber) {
    return <div className={styles.errorState}>Erro: {error}</div>;
  }
  
  return (
    <div className={styles.container}>
      {activeNumber ? (
        // ===================================
        //        TELA DE ATIVAÇÃO
        // ===================================
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
        // ===================================
        //        TELA DE SELEÇÃO
        // ===================================
        <div className={styles.selectionGrid}>
          {/* Coluna da Esquerda: Lista de Serviços */}
          <div className={styles.serviceList}>
            <h2 className={styles.sectionTitle}>1. Selecione um serviço</h2>
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

          {/* Coluna da Direita: Países e Ativação */}
          <div className={styles.summarySection}>
              <h2 className={styles.sectionTitle}>2. Selecione um país</h2>
              <div className={styles.countryListWrapper}>
                  {!selectedService ? (
                      <p className={styles.placeholderText}>Selecione um serviço para ver os países disponíveis.</p>
                  ) : pricesLoading ? (
                      <div className={styles.loadingState}><div className={styles.spinner}></div></div>
                  ) : pricesError ? (
                      <div className={styles.errorState}>{pricesError}</div>
                  ) : countryPrices.length > 0 ? (
                      <div className={styles.countryList}>
                          {countryPrices.map(country => (
                              <div 
                                  key={country.id} 
                                  className={`${styles.countryItem} ${selectedCountry?.id === country.id ? styles.selected : ''}`}
                                  onClick={() => handleSelectCountry(country)}
                              >
                                  <div className={styles.countryInfo}>
                                      <span className={styles.countryName}>{country.name}</span>
                                      <span className={styles.countryCount}>{country.count} pçs</span>
                                  </div>
                                  <div className={styles.countryPrice}>
                                      R$ {parseFloat(country.cost).toFixed(2).replace('.', ',')}
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className={styles.placeholderText}>Nenhum país disponível para este serviço no momento.</p>
                  )}
              </div>
              
              <div className={styles.activationButtonWrapper}>
                  <h2 className={styles.sectionTitle}>3. Ativar número</h2>
                  <div className={styles.summaryItem}><span>Seu Saldo Atual</span><strong>R$ {user?.credits ? parseFloat(user.credits).toFixed(2).replace('.', ',') : '0,00'}</strong></div>
                  
                  {selectedCountry && 
                    <div className={styles.summaryItem}>
                        <span>Custo da Ativação</span>
                        <strong>R$ {parseFloat(selectedCountry.cost).toFixed(2).replace('.', ',')}</strong>
                    </div>
                  }
                  <button 
                      className={styles.requestButton} 
                      onClick={handleRequestNumber} 
                      disabled={!selectedService || !selectedCountry || isLoading || (user && selectedCountry && parseFloat(user.credits) < parseFloat(selectedCountry.cost))}
                  >
                    {isLoading ? <div className={styles.buttonSpinner}></div> : 'Solicitar Número'}
                  </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}