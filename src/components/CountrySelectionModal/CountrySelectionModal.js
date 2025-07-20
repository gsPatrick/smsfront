// src/components/CountrySelectionModal/CountrySelectionModal.js
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import styles from './CountrySelectionModal.module.css'; // Criaremos este CSS a seguir

const CountrySelectionModal = ({ isOpen, onClose, service, countries, isLoading, error, onRequestNumber, userCredits }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Reseta o país selecionado sempre que o modal for reaberto com um novo serviço
  useEffect(() => {
    if (isOpen) {
      setSelectedCountry(null);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCountrySelect = (country) => {
    if (userCredits < parseFloat(country.sellPrice)) {
      alert('Saldo insuficiente para selecionar este país.');
      return;
    }
    setSelectedCountry(country);
  };

  const handleConfirmRequest = () => {
    if (selectedCountry) {
      onRequestNumber(selectedCountry);
      onClose(); // Fecha o modal após a solicitação
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>{service?.icon}</div>
            <h3 className={styles.modalTitle}>Selecione um País para <br/><strong>{service?.name}</strong></h3>
          </div>
          <button className={styles.closeButton} onClick={onClose}><X size={24} /></button>
        </div>

        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loaderContainer}><Loader2 className={styles.spinner} size={32} /></div>
          ) : error ? (
            <div className={styles.errorContainer}>{error}</div>
          ) : countries.length > 0 ? (
            <div className={styles.countryList}>
              {countries.map((country) => (
                <div
                  key={country.id}
                  className={`${styles.countryItem} ${selectedCountry?.id === country.id ? styles.selected : ''}`}
                  onClick={() => handleCountrySelect(country)}
                >
                  <div className={styles.countryDetails}>
                    <span className={styles.countryName}>{country.name}</span>
                    <span className={styles.countryCount}>{country.count} números</span>
                  </div>
                  <span className={styles.countryPrice}>R$ {country.sellPrice.replace('.', ',')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>Nenhum país com números disponíveis para este serviço no momento.</div>
          )}
        </div>

        <div className={styles.modalFooter}>
            <div className={styles.summary}>
                <div className={styles.summaryRow}>
                    <span>Seu Saldo:</span>
                    <span>R$ {parseFloat(userCredits || 0).toFixed(2).replace('.',',')}</span>
                </div>
                 {selectedCountry && (
                    <div className={styles.summaryRow}>
                        <span>Custo da Ativação:</span>
                        <span>R$ {selectedCountry.sellPrice.replace('.',',')}</span>
                    </div>
                )}
            </div>
          <button
            className={styles.confirmButton}
            onClick={handleConfirmRequest}
            disabled={!selectedCountry}
          >
            Solicitar Número
          </button>
        </div>
      </div>
    </div>
  );
};

export default CountrySelectionModal;