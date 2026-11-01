import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import ToastContainer from '../Toast';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <main key={location.pathname} className="page-enter pt-16 max-w-5xl mx-auto px-4 pb-12">
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
