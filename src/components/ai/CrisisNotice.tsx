import { LifeBuoy } from 'lucide-react';

/**
 * Fixed safety message (never AI-generated), shown when a message suggests
 * the person may be in crisis or danger.
 */
export default function CrisisNotice() {
  return (
    <aside
      role="note"
      aria-label="Get help now"
      className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 space-y-2 text-sm leading-relaxed"
    >
      <p className="flex items-center gap-2 text-cream font-semibold">
        <LifeBuoy className="w-4 h-4 text-red-400 shrink-0" />
        You don’t have to face this alone
      </p>
      <p className="text-cream/80">
        If you are in danger or thinking about ending your life, please contact your local emergency
        number now (999 in the UK, 911 in the US, 112 in the EU). You can also call a crisis line:
        Samaritans on <span className="text-cream font-medium">116 123</span> (UK &amp; Ireland) or{' '}
        <span className="text-cream font-medium">988</span> (US). For other countries, visit{' '}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-400 hover:text-gold-300 underline"
        >
          findahelpline.com
        </a>
        .
      </p>
      <p className="text-cream/80">
        Please also reach out to someone you trust — a friend, family member or pastor.
      </p>
    </aside>
  );
}
