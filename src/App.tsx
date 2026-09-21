import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { AdminPanel } from './pages/AdminPanel';
import { LoginDemoPage } from './pages/LoginDemoPage';
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
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/admin') {
    return <AdminPanel />;
  }

  if (path === '/login') {
    return <LoginDemoPage />;
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
