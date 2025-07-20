// src/components/ServiceCard/Service-Card.js
import styles from './ServiceCard.module.css';

// Agora service.icon será um componente Lucide React
const ServiceCard = ({ service, onSelect, isSelected }) => {
  // =========================================================================
  // CORREÇÃO APLICADA AQUI: Convertendo price_per_otp para número
  // parseFloat() garante que o valor seja um número antes de usar toFixed().
  // =========================================================================
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
        {/* Usando a variável 'price' já convertida */}
        <p className={styles.price}>R$ {price.toFixed(2).replace('.', ',')}</p>
      </div>
    </div>
  );
};

export default ServiceCard;