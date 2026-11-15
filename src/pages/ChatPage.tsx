import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useElementHeight } from '../hooks/useElementHeight';
import { BookOpen, MessageSquarePlus, Send, Sparkles, Square } from 'lucide-react';
import { useAiChat, type ChatTurn } from '../hooks/useAiChat';
import { useAiSettings } from '../hooks/useAiSettings';
import { useOllamaStatus } from '../hooks/useOllamaStatus';
import { useSavedVerses, type UseSavedVersesReturn } from '../hooks/useSavedVerses';
import { suggestsCrisis } from '../lib/ai/safety';
import CrisisNotice from '../components/ai/CrisisNotice';
import PassagesDrawer, { type DrawerPassage } from '../components/ai/PassagesDrawer';
import { collectChatPassages, suggestCollectionName } from '../lib/ai/chat-passages';
import { MAX_CARD_VERSES } from '../lib/ai/scripture-guard';
import { useResolvedPassages } from '../hooks/useResolvedPassages';
import { buildMentorMessages } from '../lib/ai/prompts';
import AiSetupNotice from '../components/ai/AiSetupNotice';
import AiDisclaimer from '../components/ai/AiDisclaimer';
import ThinkingIndicator from '../components/ai/ThinkingIndicator';
import ModelPicker from '../components/ai/ModelPicker';
import AssistantMessage from '../components/ai/AssistantMessage';
import type { ChatLocationState } from '../components/ai/AiSearchBox';

const SESSION_KEY = 'biblequest-ai-chat';

const SUGGESTIONS = [
  'I’m feeling lonely',
  'I’m anxious about the future',
  'How can I forgive someone who hurt me?',
  'I feel far from God',
];

/** Location keys whose Home-page query has already been sent. */
const consumedQueries = new Set<string>();

export default function ChatPage() {
  const { settings, update: updateSettings } = useAiSettings();
  const { status, refresh, recheck } = useOllamaStatus(settings.baseUrl, settings.enabled);
  const chat = useAiChat({ buildMessages: buildMentorMessages, sessionKey: SESSION_KEY });
  const { turns, phase, busy, send, retry, stop, reset } = chat;
  const saved = useSavedVerses();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Every passage cited so far (the reply still streaming is left out until it's done).
  const streamingTurnId = busy ? turns[turns.length - 1]?.id : undefined;
  const chatRefs = useMemo(() => collectChatPassages(turns, streamingTurnId), [turns, streamingTurnId]);
  const resolvedChat = useResolvedPassages(useMemo(() => chatRefs.map((r) => r.ref), [chatRefs]));
  const chatPassages = useMemo<DrawerPassage[]>(
    () =>
      chatRefs.flatMap(({ key, turnId }) => {
        const passage = resolvedChat.get(key);
        return passage && passage.verses.length <= MAX_CARD_VERSES ? [{ key, passage, turnId }] : [];
      }),
    [chatRefs, resolvedChat],
  );

  // Each reply registers how to show one of its cards, so the panel can jump to it.
  const showCardFns = useRef(new Map<string, (key: string) => boolean>());
  const registerShowCard = useCallback(
    (turnId: string) => (show: ((key: string) => boolean) | null) => {
      if (show) showCardFns.current.set(turnId, show);
      else showCardFns.current.delete(turnId);
    },
    [],
  );
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  // Jump after the panel has closed: its cleanup (which unlocks page scrolling)
  // runs before this effect in the same commit.
  const pendingJump = useRef<{ turnId: string; key: string } | null>(null);
  useEffect(() => {
    if (drawerOpen || !pendingJump.current) return;
    const { turnId, key } = pendingJump.current;
    pendingJump.current = null;
    showCardFns.current.get(turnId)?.(key);
  }, [drawerOpen]);
  const showInChat = (turnId: string, key: string) => {
    pendingJump.current = { turnId, key };
    setDrawerOpen(false);
  };
  const location = useLocation();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const composerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // A question typed on the Home page starts a new conversation.
  const incoming = (location.state as ChatLocationState | null)?.query?.trim();
  useEffect(() => {
    if (!incoming || !settings.enabled || consumedQueries.has(location.key)) return;
    consumedQueries.add(location.key);
    reset();
    send(incoming);
    // Drop the query from history so a refresh doesn't ask it again.
    navigate(location.pathname, { replace: true, state: null });
  }, [incoming, settings.enabled, location.key, location.pathname, navigate, reset, send]);

  // Keep the newest message in view while it streams, unless the user scrolled up.
  const lastContent = turns[turns.length - 1]?.content;
  useEffect(() => {
    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200;
    if (nearBottom || phase === 'waiting') endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns.length, lastContent, phase]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!draft.trim() || busy) return;
    send(draft);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const newChat = () => {
    reset();
    setDraft('');
    inputRef.current?.focus();
  };

  const header = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-gold-500" />
        <h1 className="text-3xl font-serif font-bold text-cream">AI Chat</h1>
      </div>
      {settings.enabled && turns.length > 0 && (
        <div className="flex items-center gap-2">
          {chatPassages.length > 0 && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={`Passages in this chat (${chatPassages.length})`}
              className="btn-outline text-sm inline-flex items-center gap-2 !px-3 sm:!px-4 !py-2"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Passages</span>
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-gold-500/20 text-gold-300 text-xs font-semibold inline-flex items-center justify-center">
                {chatPassages.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={newChat}
            aria-label="New chat"
            className="btn-outline text-sm inline-flex items-center gap-2 !px-3 sm:!px-4 !py-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      )}
    </div>
  );

  const showComposer = settings.enabled && !(status.state === 'error' && turns.length === 0);
  const composerHeight = useElementHeight(composerRef, showComposer);

  if (!settings.enabled) {
    return (
      <div className="py-10 space-y-8">
        {header}
        <AiSetupNotice />
      </div>
    );
  }

  const unreachable = status.state === 'error' && turns.length === 0;

  return (
    <div className="py-10 space-y-8">
      {header}

      {unreachable ? (
        <AiSetupNotice error={status.error} onRetry={() => void refresh()} />
      ) : (
        <>
          {turns.length === 0 && (
            <section className="card space-y-4">
              <p className="text-cream/70 text-sm leading-relaxed">
                Share what’s on your heart. Your mentor will listen, encourage you, and point you to
                passages of Scripture you can save and memorise.
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={busy}
                    className="text-sm px-3 py-1.5 rounded-full border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition-colors disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-6" aria-live="polite" aria-busy={busy}>
            {turns.map((turn, i) => (
              <ChatBubble
                key={turn.id}
                turn={turn}
                waiting={phase === 'waiting' && i === turns.length - 1}
                streaming={busy && i === turns.length - 1}
                onRetry={!busy && i === turns.length - 1 ? retry : undefined}
                saved={saved}
                registerShowCard={registerShowCard(turn.id)}
              />
            ))}
            <div ref={endRef} />
          </div>
        </>
      )}

      {/* Composer: fixed to the bottom of the screen; the spacer keeps the last message clear of it */}
      {!unreachable && (
        <>
          <div aria-hidden="true" style={{ height: composerHeight }} />
          {/* Rendered at the document root: the page's fade-in transform would otherwise
              make "fixed" relative to the page content while it animates. */}
          {createPortal(
          <div
            ref={composerRef}
            className="fixed inset-x-0 bottom-0 z-40 bg-navy-900/95 backdrop-blur border-t border-gold-500/10"
          >
            <div className="max-w-5xl mx-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
              <form onSubmit={submit} className="flex items-end gap-2">
                <div className="flex-1 min-w-0 flex items-end bg-navy-800 border border-gold-500/30 rounded-xl px-4 py-1.5 focus-within:border-gold-500/60 transition-colors">
                  <label htmlFor="chat-input" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="chat-input"
                    ref={inputRef}
                    rows={1}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={turns.length ? 'Ask a follow-up question…' : 'What’s on your heart today?'}
                    className="flex-1 min-w-0 resize-none max-h-40 field-sizing-content bg-transparent py-1.5 text-cream placeholder:text-cream/40 text-base focus:outline-none"
                  />
                </div>
                {busy ? (
                  <button
                    type="button"
                    onClick={stop}
                    aria-label="Stop reply"
                    title="Stop"
                    className="btn-outline !p-0 w-12 h-12 inline-flex items-center justify-center shrink-0"
                  >
                    <Square className="w-4 h-4" fill="currentColor" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label="Send"
                    title="Send"
                    disabled={!draft.trim()}
                    className="btn-gold !p-0 w-12 h-12 inline-flex items-center justify-center shrink-0 disabled:opacity-40"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </form>
              {/* Note on the left, model choice on the right */}
              <div className="flex items-center justify-between gap-3">
                <AiDisclaimer />
                <ModelPicker
                  model={settings.model}
                  status={status}
                  onChange={(model) => updateSettings({ model })}
                  onRefresh={recheck}
                />
              </div>
            </div>
          </div>,
          document.body,
          )}
        </>
      )}

      <PassagesDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        passages={chatPassages}
        saved={saved}
        suggestedName={suggestCollectionName(turns)}
        onShowInChat={showInChat}
      />
    </div>
  );
}

interface ChatBubbleProps {
  turn: ChatTurn;
  waiting: boolean;
  streaming: boolean;
  onRetry?: () => void;
  saved: UseSavedVersesReturn;
  registerShowCard: (show: ((key: string) => boolean) | null) => void;
}

function ChatBubble({ turn, waiting, streaming, onRetry, saved, registerShowCard }: ChatBubbleProps) {
  if (turn.role === 'user') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <p className="max-w-[85%] bg-gold-500/10 border border-gold-500/20 rounded-2xl rounded-br-sm px-4 py-3 text-cream text-base leading-relaxed whitespace-pre-wrap break-words">
            {turn.content}
          </p>
        </div>
        {suggestsCrisis(turn.content) && <CrisisNotice />}
      </div>
    );
  }

  return (
    <div className="card space-y-3">
      {waiting && !turn.content ? (
        <ThinkingIndicator />
      ) : (
        <AssistantMessage content={turn.content} streaming={streaming} saved={saved} registerShowCard={registerShowCard} />
      )}
      {turn.stopped && <p className="text-cream/40 text-xs">Stopped.</p>}
      {turn.error && <AiSetupNotice error={turn.error} onRetry={onRetry} />}
    </div>
  );
}
