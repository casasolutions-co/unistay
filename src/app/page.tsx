import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TrustBand from './components/TrustBand';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'var(--font-ui)', background: 'var(--page)', color: 'var(--text)' }}>
      <Navbar />
      <HeroSection />
      <TrustBand />
    </main>
  );
}
