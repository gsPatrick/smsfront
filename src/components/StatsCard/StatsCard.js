import styles from './StatsCard.module.css';

const StatsCard = ({ icon, title, value, change }) => {
  const isPositive = change && change.startsWith('+');
  const changeStyle = isPositive ? styles.changePositive : styles.changeNegative;

  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>
        {icon}
      </div>
      <div className={styles.cardContent}>
        <p className={styles.title}>{title}</p>
        <h3 className={styles.value}>{value}</h3>
        {change && (
          <p className={`${styles.change} ${changeStyle}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;   