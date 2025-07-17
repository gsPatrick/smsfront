import Link from 'next/link';
import styles from './LandingHeader.module.css';

const LandingHeader = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link href="/" className={styles.logoLink}>
          SMS<span className={styles.logoHighlight}>BRA</span>
        </Link>
      </div>
      <nav className={styles.nav}>
        <Link href="/login" className={styles.navLink}>Entrar</Link>
        <Link href="/register" className={styles.navButton}>Cadastre-se</Link>
      </nav>
    </header>
  );
};

export default LandingHeader;