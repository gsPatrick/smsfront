// src/app/dashboard/receber-sms/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Copy, RefreshCw, XCircle, Clock, MessageSquareText, Send, Instagram, Utensils, Car, Facebook, Globe, Film, MessageCircle } from 'lucide-react';
import styles from './ReceberSms.module.css';
import ServiceCard from '../../../components/ServiceCard/ServiceCard';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

// Mapeamento de códigos de serviço para ícones para uma UI mais rica.
const serviceIconsMap = {
  'wa': <MessageCircle size={24} />, 'tg': <Send size={24} />, 'ig': <Instagram size={24} />,
  'ifood': <Utensils size={24} />, '99': <Car size={24} />, 'uber': <Car size={24} />,
  'fb': <Facebook size={24} />, 'go': <Globe size={24} />, 'kwai': <Film size={24} />,
  'tiktok': <Film size={24} />,
};

export default function ReceberSmsPage() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  
  // Estados da página para o novo fluxo
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [servicesForCountry, setServicesForCountry] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de ativação
  const [activeNumber, setActiveNumber] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [smsCode, setSmsCode] = useState('');
  
  // Estados de controle
  const [pageLoading, setPageLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [servicesError, setServicesError] = useState(null);

  // Carrega a lista de países ao iniciar a página
  useEffect(() => {
    if (!authLoading && token) {
      const loadCountries = async () => {
        setPageLoading(true);
        setError(null);
        try {
          const countryData = await authenticatedFetch('/api/sms/countries', 'GET', null, token);
          setCountries(countryData);
        } catch (err) {
          setError(err.message || 'Falha ao carregar a lista de países.');
        } finally {
          setPageLoading(false);
        }
      };
      loadCountries();
    }
  }, [authLoading, token]);

  // Função chamada quando um país é selecionado
  const handleSelectCountry = useCallback(async (countryId) => {
    if (!countryId) {
      setSelectedCountry(null);
      setServicesForCountry([]);
      return;
    }
    
    const country = countries.find(c => c.id === countryId);
    setSelectedCountry(country);
    setSelectedService(null);
    setServicesForCountry([]);
    setServicesLoading(true);
    setServicesError(null);

    try {
      const serviceData = await authenticatedFetch(`/api/sms/services-by-country/${countryId}`, 'GET', null, token);
      const formattedServices = serviceData.map(svc => ({
        ...svc,
        icon: serviceIconsMap[svc.code] || <MessageSquareText size={24} />
      }));
      setServicesForCountry(formattedServices);
    } catch (err) {
      setServicesError(err.message || 'Não foi possível carregar os serviços para este país.');
    } finally {
      setServicesLoading(false);
    }
  }, [token, countries]);

  // Função para selecionar um serviço da lista
  const handleSelectService = (service) => {
    if (user && parseFloat(user.credits) < parseFloat(service.sellPrice)) {
        alert(`Saldo insuficiente (R$ ${parseFloat(user.credits).toFixed(2).replace('.', ',')}) para este serviço.`);
        return;
    }
    setSelectedService(service);
  }

  // Função para solicitar o número
  const handleRequestNumber = useCallback(async () => {
    if (!selectedCountry || !selectedService) return;
    setIsLoading(true);
    setError(null);

    try {
      const result = await authenticatedFetch('/api/sms/request-number', 'POST', { 
        service_code: selectedService.code,
        country_code: selectedCountry.id,
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
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(selectedService.sellPrice) }));
      alert(`Número ${result.active_number.phone_number} solicitado com sucesso!`);
    } catch (err) {
      setError(err.message || 'Falha ao solicitar número.');
      alert(`Erro ao solicitar número: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCountry, selectedService, token, updateUser]);

  // Funções de ciclo de vida da ativação
  const handleCancelActivation = useCallback(async () => { /* ... */ });
  const handleReactivateNumber = useCallback(async () => { /* ... */ });
  useEffect(() => { /* ... */ }, [activeNumber, smsCode, handleCancelActivation]);
  useEffect(() => { /* ... */ }, [activeNumber, smsCode, token]);
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert(`"${text}" copiado!`); };
  const formatTime = (seconds) => { const m = Math.floor(seconds/60); const s = seconds % 60; return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; };

  const filteredServices = useMemo(() => servicesForCountry.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [servicesForCountry, searchTerm]);

  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando...</div>;
  }
  if (error) {
    return <div className={styles.errorState}>Erro: {error}</div>;
  }
  
  return (
    <div className={styles.container}>
      {activeNumber ? (
        <div className={styles.activationCard}>
          {/* TELA DE ATIVAÇÃO */}
        </div>
      ) : (
        <div className={styles.selectionGrid}>
          {/* Coluna da Esquerda */}
          <div className={styles.selectionColumn}>
            <div className={styles.stepBox}>
              <h2 className={styles.sectionTitle}>1. Selecione um país</h2>
              <select className={styles.countrySelector} onChange={(e) => handleSelectCountry(e.target.value)} defaultValue="">
                <option value="" disabled>Escolha um país</option>
                {countries.map(country => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.stepBox}>
              <h2 className={styles.sectionTitle}>2. Selecione um serviço</h2>
              {selectedCountry && (
                <div className={styles.searchBar}>
                  <Search size={20} className={styles.searchIcon} />
                  <input type="text" placeholder="Buscar serviço (ex: WhatsApp)" className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              )}
              <div className={styles.servicesGrid}>
                {servicesLoading ? (
                  <div className={styles.loadingState}><div className={styles.spinner}></div></div>
                ) : servicesError ? (
                  <div className={styles.errorState}>{servicesError}</div>
                ) : !selectedCountry ? (
                    <p className={styles.placeholderText}>Selecione um país para listar os serviços.</p>
                ) : filteredServices.length > 0 ? (
                  filteredServices.map((service) => (
                    <ServiceCard key={service.code} service={service} onSelect={handleSelectService} isSelected={selectedService?.code === service.code}/>
                  ))
                ) : ( <p className={styles.placeholderText}>Nenhum serviço encontrado para este país.</p> )}
              </div>
            </div>
          </div>

          {/* Coluna da Direita */}
          <div className={styles.summaryColumn}>
            <div className={styles.activationBox}>
              <h2 className={styles.sectionTitle}>3. Ativar número</h2>
              <div className={styles.summaryItem}><span>Seu Saldo Atual</span><strong>R$ {user?.credits ? parseFloat(user.credits).toFixed(2).replace('.', ',') : '0,00'}</strong></div>
              
              {selectedService ? (
                <div className={styles.summaryItem}>
                  <span>Custo da Ativação</span>
                  <strong>R$ {selectedService.sellPrice.replace('.', ',')}</strong>
                </div>
              ) : (
                <p className={styles.placeholderText}>Selecione um país e um serviço para continuar.</p>
              )}
              
              <button 
                className={styles.requestButton} 
                onClick={handleRequestNumber} 
                disabled={!selectedCountry || !selectedService || isLoading || (user && selectedService && parseFloat(user.credits) < parseFloat(selectedService.sellPrice))}
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