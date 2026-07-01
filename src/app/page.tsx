import AppNav from './components/AppNav';
import HeroSection from './components/HeroSection';
import HowItWorks from './components/HowItWorks';
import WhyUniStay from './components/WhyUniStay';
import EcosystemCTA from './components/EcosystemCTA';
import Footer from './components/Footer';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'var(--font-ui)', background: 'var(--page)', color: 'var(--text)' }}>
      <AppNav />
      <HeroSection />
      <HowItWorks />
      <WhyUniStay />
      <EcosystemCTA />
      <Footer />
    </main>
  );
}
