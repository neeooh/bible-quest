import { Link } from 'react-router-dom';
import { Settings, Sparkles } from 'lucide-react';
import { describeAiError } from '../../lib/ai/errors';
import { useAiSettings } from '../../hooks/useAiSettings';

interface AiSetupNoticeProps {
  /** An error from the chat provider; when absent, explains that AI is turned off. */
  error?: unknown;
  /** Shown as a secondary action, e.g. "Try again". */
  onRetry?: () => void;
}

/** Friendly "AI isn't working" message with a link to AI settings. */
export default function AiSetupNotice({ error, onRetry }: AiSetupNoticeProps) {
  const { settings } = useAiSettings();
  const description = error
    ? describeAiError(error, undefined, settings.provider)
    : {
        title: 'The AI assistant is turned off',
        hints: ['Turn it on in AI settings to chat with the BibleQuest AI mentor.'],
      };

  return (
    <div className="card space-y-4" role="status">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-gold-500 shrink-0" />
        <h2 className="text-lg font-serif font-semibold text-cream">{description.title}</h2>
      </div>
      {description.hints.length > 0 && (
        <ul className="space-y-2 text-cream/70 text-sm leading-relaxed list-disc pl-5 break-words">
          {description.hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-3">
        <Link to="/settings/ai" className="btn-gold text-sm inline-flex items-center gap-2">
          <Settings className="w-4 h-4" />
          AI settings
        </Link>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-outline text-sm">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
