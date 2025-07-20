// src/components/ServiceCard/Service-Card.js
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service, onSelect, isSelected }) => {
  // A API agora fornece 'sellPrice' como o preço final para o usuário.
  const price = parseFloat(service.sellPrice || 0);

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(service)}
    >
      <div className={styles.iconWrapper}>
        {service.icon}
      </div>
      <div className={styles.cardContent}>
        {/* =================================================================== */}
        {/* ✅ CORREÇÃO APLICADA AQUI: Usando service.name em vez de service.code */}
        {/* =================================================================== */}
        <h3 className={styles.name}>{service.name}</h3>
        
        {/* Exibe o preço de venda formatado (sellPrice) */}
        <p className={styles.price}>R$ {price.toFixed(2).replace('.', ',')}</p>
      </div>
    </div>
  );
};

export default ServiceCard;