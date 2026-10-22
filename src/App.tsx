import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ManagementPage } from './pages/ManagementPage';
import { SessionProvider, useSession } from './services/session';
import { PortalPage } from './pages/PortalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AccessSection } from './sections/AccessSection';
import { ActivitiesSection } from './sections/ActivitiesSection';
import { AboutSection } from './sections/AboutSection';
import { ContactSection } from './sections/ContactSection';
import { EmploymentSection } from './sections/EmploymentSection';
import { EnrollmentSection } from './sections/EnrollmentSection';
import { GallerySection } from './sections/GallerySection';
import { HeroSection } from './sections/HeroSection';
import { InstallationsSection } from './sections/InstallationsSection';
import { LevelsSection } from './sections/LevelsSection';
import { NewsSection } from './sections/NewsSection';
import { ServicesSection } from './sections/ServicesSection';
import { TestimonialsSection } from './sections/TestimonialsSection';

export default function App() {
  return (
    <SessionProvider>
      <Routes />
    </SessionProvider>
  );
}

function Routes() {
  const { user, loading } = useSession();
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin') {
    if (loading)
      return (
        <main className="portal-main">
          <p role="status">Comprobando sesión…</p>
        </main>
      );
    if (!user || user.rol !== 'admin') return <PortalPage />;
    return <ManagementPage />;
  }

  if (path === '/login') {
    return <PortalPage />;
  }

  if (path !== '/') {
    return <NotFoundPage />;
  }

  return (
    <div className="app-shell">
      <Header />
      <main>
        <HeroSection />
        <AboutSection />
        <LevelsSection />
        <ServicesSection />
        <InstallationsSection />
        <ActivitiesSection />
        <GallerySection />
        <AccessSection />
        <NewsSection />
        <TestimonialsSection />
        <EnrollmentSection />
        <EmploymentSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
