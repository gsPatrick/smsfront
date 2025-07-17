import styles from './StatusBadge.module.css';

const StatusBadge = ({ status }) => {
  const getStatusClass = () => {
    switch (status.toLowerCase()) {
      case 'entregue':
      case 'completed':
        return styles.success;
      case 'pendente':
        return styles.warning;
      case 'falhou':
      case 'cancelled':
        return styles.danger;
      default:
        return styles.default;
    }
  };

  return (
    <span className={`${styles.badge} ${getStatusClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;