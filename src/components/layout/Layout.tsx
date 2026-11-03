import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from './Navbar';
import InstallBanner from './InstallBanner';
import ToastContainer from '../Toast';
import { useTheme } from '../../hooks/useTheme';
import { useProgress } from '../../hooks/useProgress';
import { getPassageStage } from '../../lib/learning-stage';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { progress } = useProgress();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const dueForReviewCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const e of progress.exerciseHistory) {
      const key = `${e.book ?? 'matthew'}:${e.chapterNumber}:${e.startVerse}-${e.endVerse}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const stage = getPassageStage(
        progress.exerciseHistory,
        e.book ?? 'matthew',
        e.chapterNumber,
        e.startVerse,
        e.endVerse,
      );
      if (stage.dueForReview) count++;
    }
    return count;
  }, [progress.exerciseHistory]);

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar theme={theme} onToggleTheme={toggle} dueForReviewCount={dueForReviewCount} />
      <main key={location.pathname} className="page-enter pt-16 max-w-5xl mx-auto px-4 pb-12">
        {children}
      </main>
      <ToastContainer />
      <InstallBanner />
    </div>
  );
}
