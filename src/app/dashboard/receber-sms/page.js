// src/app/dashboard/receber-sms/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Copy, RefreshCw, XCircle, Clock, MessageSquareText, Send, Instagram, Utensils, Car, Facebook, Globe, Film, MessageCircle } from 'lucide-react';
import styles from './ReceberSms.module.css';
import ServiceCard from '../../../components/ServiceCard/ServiceCard';
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

const serviceIconsMap = {
  'wa': <MessageCircle size={24} />, 'tg': <Send size={24} />, 'ig': <Instagram size={24} />,
  'ifood': <Utensils size={24} />, '99': <Car size={24} />, 'uber': <Car size={24} />,
  'fb': <Facebook size={24} />, 'go': <Globe size={24} />, 'kwai': <Film size={24} />,
  'tiktok': <Film size={24} />,
};

export default function ReceberSmsPage() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  
  // Estados para o novo fluxo: Serviço -> País
  const [allServices, setAllServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [countriesForService, setCountriesForService] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de ativação
  const [activeNumber, setActiveNumber] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [smsCode, setSmsCode] = useState('');
  
  // Estados de controle
  const [pageLoading, setPageLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countriesError, setCountriesError] = useState(null);

  // 1. Carrega a lista de TODOS os serviços ao iniciar a página
  useEffect(() => {
    if (!authLoading && token) {
      const loadServices = async () => {
        setPageLoading(true);
        setError(null);
        try {
          const serviceData = await authenticatedFetch('/api/sms/get-all-services', 'GET', null, token);
          const formattedServices = serviceData.map(svc => ({
            ...svc,
            icon: serviceIconsMap[svc.code] || <MessageSquareText size={24} />
          }));
          setAllServices(formattedServices);
        } catch (err) {
          setError(err.message || 'Falha ao carregar a lista de serviços.');
        } finally {
          setPageLoading(false);
        }
      };
      loadServices();
    }
  }, [authLoading, token]);

  // 2. Função chamada quando um serviço é selecionado
  const handleSelectService = useCallback(async (service) => {
    setSelectedService(service);
    setSelectedCountry(null);
    setCountriesForService([]);
    setCountriesLoading(true);
    setCountriesError(null);

    try {
      const countryData = await authenticatedFetch(`/api/sms/countries-by-service/${service.code}`, 'GET', null, token);
      setCountriesForService(countryData);
    } catch (err) {
      setCountriesError(err.message || 'Não foi possível carregar os países para este serviço.');
    } finally {
      setCountriesLoading(false);
    }
  }, [token]);

  // 3. Função para solicitar o número
  const handleRequestNumber = useCallback(async () => {
    if (!selectedCountry || !selectedService) return;
    setIsLoading(true);
    // ... (lógica de requestNumber permanece a mesma)
  }, [selectedCountry, selectedService, token, updateUser]);
  
  // Funções auxiliares (sem alterações)
  const filteredServices = useMemo(() => allServices.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [allServices, searchTerm]);

  if (authLoading || pageLoading) {
    return <div className={styles.loadingState}>Carregando...</div>;
  }
  
  return (
    <div className={styles.container}>
      {activeNumber ? (
        <div className={styles.activationCard}> {/* TELA DE ATIVAÇÃO */} </div>
      ) : (
        <div className={styles.selectionGrid}>
          {/* Coluna da Esquerda: Seleção de Serviço */}
          <div className={styles.selectionColumn}>
            <div className={styles.stepBox}>
              <h2 className={styles.sectionTitle}>1. Selecione um serviço</h2>
              <div className={styles.searchBar}>
                <Search size={20} className={styles.searchIcon} />
                <input type="text" placeholder="Buscar serviço (ex: WhatsApp)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className={styles.servicesGrid}>
                {filteredServices.map((service) => (
                  <ServiceCard key={service.code} service={service} onSelect={handleSelectService} isSelected={selectedService?.code === service.code}/>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna da Direita: Seleção de País e Ativação */}
          <div className={styles.summaryColumn}>
            <div className={styles.stepBox}>
              <h2 className={styles.sectionTitle}>2. Selecione um país</h2>
              {countriesLoading ? (
                <div className={styles.loadingState}>Carregando países...</div>
              ) : !selectedService ? (
                <p>Selecione um serviço para ver os países.</p>
              ) : countriesForService.length > 0 ? (
                <select className={styles.countrySelector} onChange={(e) => setSelectedCountry(countriesForService.find(c => c.id === e.target.value))} defaultValue="">
                  <option value="" disabled>Escolha um país</option>
                  {countriesForService.map(country => (
                    <option key={country.id} value={country.id}>{country.name} - R$ {country.sellPrice.replace('.',',')} ({country.count} pçs)</option>
                  ))}
                </select>
              ) : (
                <p>Nenhum país disponível para este serviço.</p>
              )}
            </div>

            <div className={styles.activationBox}>
              <h2 className={styles.sectionTitle}>3. Ativar número</h2>
              {/* ... (lógica de exibição de saldo e botão de ativar) ... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}