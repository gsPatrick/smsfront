// Removido: import Image from 'next/image';
import styles from './ServiceCard.module.css';

// Agora service.icon será um componente Lucide React
const ServiceCard = ({ service, onSelect, isSelected }) => {
  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(service)}
    >
      <div className={styles.iconWrapper}> {/* Adicionado um wrapper para o ícone */}
        {service.icon}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.name}>{service.name}</h3>
        <p className={styles.price}>R$ {service.price_per_otp.toFixed(2).replace('.', ',')}</p>
      </div>
    </div>
  );
};

export default ServiceCard;