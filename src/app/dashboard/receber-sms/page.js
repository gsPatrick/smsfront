// src/app/dashboard/receber-sms/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Copy, RefreshCw, XCircle, Clock, MessageSquareText, Send, Instagram, Utensils, Car, Facebook, Globe, Film, Building, Shield, Star, Briefcase } from 'lucide-react';
import styles from './ReceberSms.module.css';
import ServiceCard from '../../../components/ServiceCard/ServiceCard';
import CountrySelectionModal from '../../../components/CountrySelectionModal/CountrySelectionModal';
import Pagination from '../../../components/Pagination/Pagination'; // Importar Pagination
import { useAuth } from '../../context/AuthContext';
import { authenticatedFetch } from '../../utils/api';

// Mapeamento de ícones para serviços
const serviceIconsMap = {
  'wa': <MessageSquareText size={24} />, 'tg': <Send size={24} />, 'ig': <Instagram size={24} />,
  'ifood': <Utensils size={24} />, '99': <Car size={24} />, 'uber': <Car size={24} />, 'ub': <Car size={24}/>,
  'fb': <Facebook size={24} />, 'go': <Globe size={24} />, 'kwai': <Film size={24} />,
  'tiktok': <Film size={24} />, 'aaa': <Building size={24} />, // Nubank
  'gov': <Shield size={24} />, 'default': <Star size={24} />
};

// Mapeamento de categorias para serviços
const serviceCategoryMap = {
  'Redes Sociais': ['ig', 'fb', 'tg', 'kwai', 'tiktok', 'wa'],
  'Transporte': ['99', 'uber', 'ub'],
  'Entregas': ['ifood'],
  'Bancos e Finanças': ['aaa', 'pagbank'],
  'Governo': ['gov'],
  'Outros': ['go', 'default']
};

const serviceCategories = ['Todas', 'Redes Sociais', 'Transporte', 'Entregas', 'Bancos e Finanças', 'Governo', 'Outros'];
const ITEMS_PER_PAGE = 12;

export default function ReceberSmsPage() {
  const { user, token, loading: authLoading, updateUser } = useAuth();
  
  // Estado principal da página
  const [allServices, setAllServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeNumber, setActiveNumber] = useState(null);
  
  // Estado para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [countriesForService, setCountriesForService] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState(null);

  // Estados de controle
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(120);
  const [smsCode, setSmsCode] = useState('');

  // 1. Carrega a lista de todos os serviços da API
  useEffect(() => {
    if (!authLoading && token) {
      const loadServices = async () => {
        setPageLoading(true);
        setError(null);
        try {
          const serviceData = await authenticatedFetch('/api/sms/services-with-prices', 'GET', null, token);
          const formattedServices = serviceData.map(svc => {
            let category = 'Outros';
            for (const cat in serviceCategoryMap) {
              if (serviceCategoryMap[cat].includes(svc.code)) {
                category = cat;
                break;
              }
            }
            return {
              ...svc,
              icon: serviceIconsMap[svc.code] || <Briefcase size={24} />,
              category,
            };
          });
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

  // 2. Lógica de filtro e paginação (tudo no front-end)
  const filteredServices = useMemo(() => {
    return allServices
      .filter(s => selectedCategory === 'Todas' || s.category === selectedCategory)
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allServices, searchTerm, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const currentServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredServices, currentPage]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);

  // 3. Funções de interação (modal, solicitar número, etc.)
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
  
  // Funções do ciclo de vida da ativação
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
    if (!activeNumber || (user && parseFloat(user.credits) < parseFloat(activeNumber.country.sellPrice))) {
        alert("Saldo insuficiente para reativar.");
        return;
    }
    setIsLoading(true);
    try {
      await authenticatedFetch(`/api/sms/reactivate/${activeNumber.id}`, 'POST', null, token);
      setCountdown(120);
      setSmsCode('');
      updateUser(prevUser => ({ ...prevUser, credits: parseFloat(prevUser.credits) - parseFloat(activeNumber.country.sellPrice) }));
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
    return <div className={styles.loadingState}><div className={styles.spinner}></div>Carregando...</div>;
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
                    <button className={styles.cancelButton} onClick={() => handleCancelActivation()} disabled={isLoading}>
                        <XCircle size={20} /> Cancelar
                    </button>
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
                        <div className={styles.waitingForCode}>
                            <div className={styles.spinner}></div>
                            Aguardando SMS...
                        </div>
                    )}
                </div>
                <div className={styles.activationActions}>
                    <button className={styles.reactivateButton} onClick={handleReactivateNumber} disabled={isLoading || !!smsCode || countdown <= 0}>
                        {isLoading ? <div className={styles.buttonSpinner}></div> : <RefreshCw size={16} />}
                        Reativar Número (se o código não chegar)
                    </button>
                </div>
            </div>
        ) : (
            <>
              <div className={styles.header}>
                  <h1 className={styles.pageTitle}>Receber SMS</h1>
                  <p className={styles.pageSubtitle}>Selecione um serviço para obter um número de telefone temporário.</p>
              </div>
              <div className={styles.selectionGrid}>
                  <div className={styles.servicesColumn}>
                      <div className={styles.filtersContainer}>
                        <div className={styles.searchBar}>
                            <Search size={20} className={styles.searchIcon} />
                            <input type="text" placeholder="Buscar por nome..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className={styles.categoryFilters}>
                            {serviceCategories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`${styles.categoryButton} ${selectedCategory === cat ? styles.activeCategory : ''}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                      </div>
                      <div className={styles.servicesGrid}>
                          {currentServices.length > 0 ? (
                              currentServices.map((service) => (
                                  <ServiceCard key={service.code} service={service} onSelect={handleServiceClick} />
                              ))
                          ) : ( <p className={styles.placeholderText}>Nenhum serviço encontrado para os filtros selecionados.</p> )}
                      </div>
                      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                  </div>
                  <div className={styles.summaryColumn}>
                      <div className={styles.summaryBox}>
                          <h3 className={styles.summaryTitle}>Como Funciona</h3>
                          <ol className={styles.instructionsList}>
                              <li><strong>Selecione um Serviço</strong> na lista à esquerda.</li>
                              <li><strong>Escolha um País</strong> na janela que aparecerá.</li>
                              <li><strong>Copie o Número</strong> e use no serviço desejado.</li>
                              <li><strong>Aguarde o Código</strong> aparecer nesta tela.</li>
                          </ol>
                          <div className={styles.summaryFooter}>
                              <Briefcase size={18} />
                              <span>Seu saldo será debitado apenas após a escolha do país.</span>
                          </div>
                      </div>
                  </div>
              </div>
            </>
        )}
        
        <CountrySelectionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            service={selectedService}
            countries={countriesForService}
            isLoading={countriesLoading || isLoading}
            error={countriesError}
            onRequestNumber={handleRequestNumber}
            userCredits={user?.credits}
        />
    </div>
  );
}