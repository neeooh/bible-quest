import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import AiDisclaimer from './AiDisclaimer';

/** Router state passed from the Home page to the AI Chat page. */
export interface ChatLocationState {
  query?: string;
}

/**
 * Home page entry point to AI Chat. The query travels in router state, not
 * the URL, so personal questions don't end up in browser history.
 */
export default function AiSearchBox() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate('/chat', { state: { query: q } satisfies ChatLocationState });
  };

  return (
    <div className="max-w-2xl mx-auto w-full space-y-2">
      <form
        onSubmit={submit}
        role="search"
        className="w-full flex items-center gap-2.5 h-14 bg-navy-800 border border-gold-500/22 focus-within:border-gold-500/55 rounded-[14px] pl-4 pr-2 transition-colors"
      >
        <Sparkles className="w-5 h-5 text-gold-500 shrink-0" aria-hidden="true" />
        <label htmlFor="ai-search" className="sr-only">
          Ask the AI mentor
        </label>
        <input
          id="ai-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What’s on your heart today?"
          autoComplete="off"
          enterKeyHint="search"
          className="flex-1 min-w-0 h-full bg-transparent text-cream placeholder:text-cream/45 text-base focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Ask the AI mentor"
          title="Ask the AI mentor"
          className="w-10 h-10 rounded-[10px] border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/50 transition-colors inline-flex items-center justify-center shrink-0"
        >
          <ArrowRight className="w-[18px] h-[18px]" />
        </button>
      </form>
      {/* Same note as under the AI Chat box */}
      <div className="flex justify-center px-1">
        <AiDisclaimer />
      </div>
    </div>
  );
}
