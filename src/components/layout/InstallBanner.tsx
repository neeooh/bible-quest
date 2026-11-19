import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface InstallBannerProps {
  /** Kept mounted everywhere so the one-off beforeinstallprompt event is captured on any page. */
  visible: boolean;
}

export default function InstallBanner({ visible }: InstallBannerProps) {
  const { canShow, promptInstall, dismiss } = useInstallPrompt();

  if (!visible || !canShow) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-navy-800 border border-gold-500/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-navy-900/50">
        <img
          src="/favicon.svg"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className="w-10 h-10 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-cream text-sm font-medium">Install BibleQuest</p>
          <p className="text-cream/40 text-xs">
            Works offline. Add to your home screen.
          </p>
        </div>
        <button
          type="button"
          onClick={promptInstall}
          className="btn-outline text-sm px-4 py-2 shrink-0 inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="text-cream/30 hover:text-cream/60 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
