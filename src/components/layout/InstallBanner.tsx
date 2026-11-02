import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export default function InstallBanner() {
  const { canShow, promptInstall, dismiss } = useInstallPrompt();

  if (!canShow) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-navy-800 border border-gold-500/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg shadow-navy-900/50">
        <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-gold-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-cream text-sm font-medium">Install BibleQuest</p>
          <p className="text-cream/40 text-xs">
            Works offline. Add to your home screen.
          </p>
        </div>
        <button
          type="button"
          onClick={promptInstall}
          className="btn-gold text-sm px-4 py-2 shrink-0"
        >
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
