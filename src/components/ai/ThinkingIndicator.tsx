import { useEffect, useState } from 'react';

/** Shown while waiting for the first words of a reply. */
export default function ThinkingIndicator() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    // The first reply after choosing a model includes loading it into memory.
    const timer = setTimeout(() => setSlow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 text-cream/50 text-sm" role="status">
      <span className="flex gap-1" aria-hidden="true">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span>{slow ? 'Loading the model… the first reply can take a little longer.' : 'Thinking…'}</span>
    </div>
  );
}
