import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Heart, MoreHorizontal, type LucideIcon } from 'lucide-react';

/**
 * The one card used everywhere a Bible verse is shown (Home, Topics,
 * My Verses, Collections, AI Chat). See docs/verse-card-redesign.md.
 *
 * Presentational only: pages own the data and the behaviour, the card owns
 * the look. Scripture text is shown exactly as given — no quote marks are
 * added around it.
 */

export type VerseCardVariant = 'list' | 'cited';

export interface VerseCardVerse {
  verse: number;
  text: string;
}

export interface VerseCardMenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Destructive actions are shown last, in red, after a divider. */
  danger?: boolean;
}

export interface VerseCardProps {
  variant?: VerseCardVariant;
  /** Human-readable reference, e.g. "Philippians 4:6–7". */
  reference: string;
  /** Where the reference and the Read button go. */
  readHref: string;
  translation?: string;
  /** Right side of the header: review status, chat pager… */
  aside?: ReactNode;
  /** One block of text… */
  text?: string;
  /** …or separate verses, numbered when there is more than one. */
  verses?: VerseCardVerse[];
  /** Clamp the scripture to two lines with a "Show full passage" toggle. */
  clamp?: boolean;
  /** Supporting line under the scripture (explainer, practice stats). */
  note?: ReactNode;
  /** Left side of the footer (learning progress). */
  status?: ReactNode;
  favourite?: { active: boolean; onToggle: () => void };
  menu?: VerseCardMenuItem[];
  primary?: { label: string; to: string };
  className?: string;
}

const SCRIPTURE_SIZE: Record<VerseCardVariant, string> = {
  list: 'text-[1.09rem] sm:text-[1.16rem] leading-[1.62]',
  cited: 'text-[1.09rem] sm:text-[1.16rem] leading-[1.62]',
};

export default function VerseCard({
  variant = 'list',
  reference,
  readHref,
  translation = 'WEB',
  aside,
  text,
  verses,
  clamp = false,
  note,
  status,
  favourite,
  menu,
  primary,
  className = '',
}: VerseCardProps) {
  const headingId = useId();
  const textRef = useRef<HTMLQuoteElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const isMultiVerse = (verses?.length ?? 0) > 1;

  // Only offer "Show full passage" when the clamp actually hides something.
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!clamp || !el) return;
    const measure = () => {
      if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [clamp, expanded, text, verses]);

  const hasActions = Boolean(favourite || menu?.length || primary);

  return (
    <article
      aria-labelledby={headingId}
      className={`group/card relative rounded-2xl border border-gold-500/10 bg-navy-800 transition-[border-color,box-shadow] duration-200 hover:border-gold-500/25 hover:shadow-[0_8px_28px_-18px_rgba(0,0,0,0.6)] px-[18px] pt-[18px] pb-3.5 sm:px-7 sm:pt-[22px] sm:pb-[18px] ${className}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
        <h3 id={headingId} className="m-0 leading-tight">
          <Link
            to={readHref}
            className="font-serif text-[1.19rem] font-semibold text-gold-400 underline-offset-4 decoration-1 hover:underline"
          >
            {reference}
          </Link>
          {translation && (
            <span className="ml-2.5 align-[2px] font-sans text-[10px] font-semibold tracking-[0.16em] text-cream/45">
              {translation}
            </span>
          )}
        </h3>
        {aside && <div className="flex items-center">{aside}</div>}
      </header>

      <blockquote
        ref={textRef}
        className={`mt-3 max-w-[62ch] font-scripture text-cream/90 ${SCRIPTURE_SIZE[variant]} ${
          clamp && !expanded ? 'line-clamp-2' : ''
        }`}
      >
        {verses
          ? verses.map((v) => (
              <span key={v.verse}>
                {isMultiVerse && (
                  <sup className="mr-0.5 font-sans text-[0.6em] font-bold text-gold-400 select-none">{v.verse}</sup>
                )}
                {v.text}{' '}
              </span>
            ))
          : text}
      </blockquote>

      {clamp && (overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1.5 text-[0.78rem] font-medium text-cream/60 hover:text-gold-400 transition-colors"
        >
          {expanded ? 'Show less' : isMultiVerse ? 'Show full passage' : 'Show full verse'}
        </button>
      )}

      {note && <div className="mt-2.5 max-w-[62ch] text-sm leading-relaxed text-cream/60">{note}</div>}

      {(status || hasActions) && (
        <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-cream/8 pt-3.5">
          <div className="min-w-0 empty:hidden">{status}</div>
          {hasActions && (
            <div className="flex w-full items-center gap-1 sm:ml-auto sm:w-auto">
              {favourite && (
                <IconButton
                  label={favourite.active ? `Remove ${reference} from favourites` : `Add ${reference} to favourites`}
                  pressed={favourite.active}
                  onClick={favourite.onToggle}
                >
                  <Heart
                    className={`h-[18px] w-[18px] ${favourite.active ? 'text-red-400' : ''}`}
                    fill={favourite.active ? 'currentColor' : 'none'}
                  />
                </IconButton>
              )}
              <Link to={readHref} aria-label={`Read ${reference} in context`} title="Read in context" className={ICON_BUTTON}>
                <BookOpen className="h-[18px] w-[18px]" />
              </Link>
              {menu && menu.length > 0 && <VerseMenu items={menu} reference={reference} />}
              {primary && (
                <Link
                  to={primary.to}
                  className="btn-gold ml-auto inline-flex h-10 flex-1 items-center justify-center gap-2 !px-[18px] !py-0 text-sm sm:ml-2 sm:flex-none max-w-[12rem] sm:max-w-none"
                >
                  {primary.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}

const ICON_BUTTON =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-cream/45 transition-colors hover:bg-cream/6 hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400';

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={pressed} title={label} className={ICON_BUTTON}>
      {children}
    </button>
  );
}

/** The ⋯ menu: secondary actions, with destructive ones last and in red. */
function VerseMenu({ items, reference }: { items: VerseCardMenuItem[]; reference: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const safe = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    rootRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onMenuKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const all = [...(rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % all.length : (i - 1 + all.length) % all.length;
    all[next]?.focus();
  };

  const renderItem = (item: VerseCardMenuItem) => (
    <button
      key={item.label}
      type="button"
      role="menuitem"
      onClick={() => {
        setOpen(false);
        item.onSelect();
      }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.84rem] transition-colors hover:bg-cream/7 focus:bg-cream/7 focus:outline-none ${
        item.danger ? 'text-red-400' : 'text-cream'
      }`}
    >
      <item.icon className={`h-4 w-4 ${item.danger ? '' : 'text-cream/45'}`} />
      {item.label}
    </button>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`More actions for ${reference}`}
        title="More actions"
        className={`${ICON_BUTTON} ${open ? 'bg-cream/6 text-cream' : ''}`}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${reference}`}
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 top-full z-30 sm:left-auto sm:right-0 mt-1.5 min-w-[14.5rem] whitespace-nowrap rounded-xl border border-gold-500/25 bg-navy-700 p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)]"
        >
          {safe.map(renderItem)}
          {danger.length > 0 && safe.length > 0 && <hr className="mx-1 my-1.5 border-0 border-t border-cream/8" />}
          {danger.map(renderItem)}
        </div>
      )}
    </div>
  );
}
