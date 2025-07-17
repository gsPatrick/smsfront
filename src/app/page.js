import Link from 'next/link';
import { MessageSquareText, Lock, DollarSign, Zap, CheckCircle, Smartphone } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader/LandingHeader'; // Importe o novo header
import styles from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <LandingHeader /> {/* Adicione o header aqui */}

      {/* Seção Hero */}
      <section className={styles.hero}>
        {/* ... restante do seu código Hero ... */}
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Receba códigos SMS <span className={styles.highlight}>online</span> de forma rápida e segura.</h1>
          <p className={styles.heroSubtitle}>
            Ative contas, verifique serviços e proteja sua privacidade. Receba OTPs em segundos via nossa plataforma ou API.
          </p>
          <Link href="/register" className={styles.heroButton}>
            Crie Sua Conta Grátis!
          </Link>
        </div>
        <div className={styles.heroIllustration}>
          <Smartphone size={120} className={styles.illustrationIcon} />
          <Zap size={60} className={styles.illustrationSmallIcon} />
          <CheckCircle size={60} className={styles.illustrationSmallIcon} />
        </div>
      </section>

      {/* Seção de Funcionalidades */}
      <section className={styles.features}>
        {/* ... restante do seu código Features ... */}
        <h2 className={styles.sectionTitle}>Por que escolher SMSBRA?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <MessageSquareText size={32} className={styles.featureIcon} />
            <h3>Verificações Instantâneas</h3>
            <p>Receba códigos OTP para WhatsApp, Telegram, Instagram e mais, em tempo real.</p>
          </div>
          <div className={styles.featureCard}>
            <Lock size={32} className={styles.featureIcon} />
            <h3>Privacidade Garantida</h3>
            <p>Utilize números temporários para proteger seu número pessoal de serviços indesejados.</p>
          </div>
          <div className={styles.featureCard}>
            <DollarSign size={32} className={styles.featureIcon} />
            <h3>Controle de Custos</h3>
            <p>Compre créditos pré-pagos e pague apenas pelos códigos que você realmente utiliza.</p>
          </div>
          <div className={styles.featureCard}>
            <Zap size={32} className={styles.featureIcon} />
            <h3>API Poderosa</h3>
            <p>Integre facilmente nosso serviço em suas aplicações com nossa API robusta e documentada.</p>
          </div>
        </div>
      </section>

      {/* Seção de Chamada para Ação Final */}
      <section className={styles.finalCta}>
        {/* ... restante do seu código CTA ... */}
        <h2 className={styles.sectionTitle}>Pronto para começar?</h2>
        <p className={styles.finalCtaSubtitle}>
          Junte-se a milhares de usuários que confiam no SMSBRA para suas verificações SMS.
        </p>
        <Link href="/register" className={styles.finalCtaButton}>
          Crie Sua Conta Grátis Agora!
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        {/* ... restante do seu código Footer ... */}
        <p>© {new Date().getFullYear()} SMSBRA. Todos os direitos reservados.</p>
        <nav className={styles.footerNav}>
            <Link href="#" className={styles.footerLink}>Termos de Serviço</Link>
            <Link href="#" className={styles.footerLink}>Política de Privacidade</Link>
        </nav>
      </footer>
    </div>
  );
}