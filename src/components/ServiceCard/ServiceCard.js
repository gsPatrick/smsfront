// src/components/ServiceCard/ServiceCard.js
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service, onSelect }) => {
  return (
    <div className={styles.card} onClick={() => onSelect(service)}>
      <div className={styles.iconWrapper}>
        {service.icon}
      </div>
      <div className={styles.cardContent}>
        <h3 className={styles.serviceName}>{service.name}</h3>
        {/* A descrição foi removida para um design mais limpo */}
      </div>
    </div>
  );
};

export default ServiceCard;