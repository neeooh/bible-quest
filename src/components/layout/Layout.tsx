import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import InstallBanner from './InstallBanner';
import ToastContainer from '../Toast';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar theme={theme} onToggleTheme={toggle} />
      <main key={location.pathname} className="page-enter pt-16 max-w-5xl mx-auto px-4 pb-12">
        {children}
      </main>
      <ToastContainer />
      <InstallBanner />
    </div>
  );
}
