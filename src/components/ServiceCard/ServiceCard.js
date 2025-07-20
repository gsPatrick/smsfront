// src/components/ServiceCard/Service-Card.js
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service, onSelect, isSelected }) => {
  const price = parseFloat(service.price_per_otp || 0);

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(service)}
    >
      <div className={styles.iconWrapper}>
        {service.icon}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.name}>{service.name}</h3>
        {/* ✅ ALTERAÇÃO: Mostra o preço como "A partir de" */}
        <p className={styles.price}>A partir de R$ {price.toFixed(2).replace('.', ',')}</p>
      </div>
    </div>
  );
};

export default ServiceCard;