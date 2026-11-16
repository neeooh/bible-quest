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
    <div className="max-w-2xl mx-auto w-full space-y-3">
      <form
        onSubmit={submit}
        role="search"
        className="ai-glow w-full flex items-center gap-2 bg-navy-800 border border-gold-500/40 rounded-xl pl-4 pr-2 py-2"
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
          className="flex-1 min-w-0 bg-transparent text-cream placeholder:text-cream/40 text-base text-center pl-3 py-2 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Ask the AI mentor"
          title="Ask the AI mentor"
          className="btn-gold !p-0 w-10 h-10 inline-flex items-center justify-center shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>
      {/* Same note as under the AI Chat box */}
      <div className="flex justify-center px-1">
        <AiDisclaimer />
      </div>
    </div>
  );
}
