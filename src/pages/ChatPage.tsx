import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useElementHeight } from '../hooks/useElementHeight';
import { BookOpen, History, MessageSquarePlus, Send, Sparkles, Square } from 'lucide-react';
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
import ChatHistoryDrawer from '../components/ai/ChatHistoryDrawer';
import { useSavedChats } from '../hooks/useSavedChats';
import {
  clearSavedChats,
  deleteSavedChat,
  formatChatDate,
  getSavedChat,
  newChatId,
  saveChat,
  type SavedChat,
} from '../lib/ai/chat-history';

/** Per-tab memory of the conversation, used only when chat history is off. */
const SESSION_KEY = 'biblequest-ai-chat';

const SUGGESTIONS = [
  'I’m feeling lonely',
  'I’m anxious about the future',
  'How can I forgive someone who hurt me?',
  'I feel far from God',
];

export default function ChatPage() {
  const { settings, update: updateSettings } = useAiSettings();
  const { status, refresh, recheck } = useOllamaStatus(settings.baseUrl, settings.enabled);
  const location = useLocation();
  const navigate = useNavigate();
  // /chat is always a new conversation; /chat/<id> is a saved one.
  const { chatId: routeChatId } = useParams<{ chatId: string }>();

  const chat = useAiChat({
    buildMessages: buildMentorMessages,
    // With history on, conversations live at their own address; with it off,
    // the tab remembers the current one so refresh and Read → Back still work.
    sessionKey: settings.saveHistory ? undefined : SESSION_KEY,
    initialTurns: () =>
      settings.saveHistory && routeChatId
        ? getSavedChat(routeChatId)?.turns.map((t) => ({ ...t }))
        : undefined,
  });
  const { turns, phase, busy, send, retry, stop, reset, load } = chat;
  const saved = useSavedVerses();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // --- Chat history -------------------------------------------------------
  const savedChats = useSavedChats();
  const [historyOpen, setHistoryOpen] = useState(false);
  // Only adopt the address's id if that chat actually exists (it may have been deleted).
  const [chatId, setChatId] = useState(() =>
    routeChatId && settings.saveHistory && getSavedChat(routeChatId) ? routeChatId : newChatId(),
  );
  const chatIdRef = useRef(chatId);
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  // Save the conversation whenever a reply has finished, then give it its own
  // address. The snapshot check stops a chat being re-saved (and jumping to
  // the top of the list) just because it was opened or the page reloaded.
  const lastSaved = useRef(JSON.stringify(turns.map((t) => [t.id, t.content])));
  useEffect(() => {
    if (!settings.saveHistory || busy || turns.length === 0) return;
    const snapshot = JSON.stringify(turns.map((t) => [t.id, t.content]));
    if (snapshot === lastSaved.current) return;
    lastSaved.current = snapshot;
    saveChat(chatId, turns);
    if (routeChatId !== chatId) navigate(`/chat/${chatId}`, { replace: true });
  }, [turns, busy, chatId, settings.saveHistory, routeChatId, navigate]);

  const startNewChat = useCallback(() => {
    reset();
    setChatId(newChatId());
    lastSaved.current = '[]';
  }, [reset]);

  const showSavedChat = useCallback(
    (savedChat: SavedChat) => {
      load(savedChat.turns.map((t) => ({ ...t })));
      setChatId(savedChat.id);
      lastSaved.current = JSON.stringify(savedChat.turns.map((t) => [t.id, t.content]));
    },
    [load],
  );

  // Respond to the address: /chat starts fresh, /chat/<id> opens that chat,
  // and a question from the Home page starts a new chat with it. Each
  // navigation is handled once (StrictMode runs effects twice in development).
  const incoming = (location.state as ChatLocationState | null)?.query?.trim();
  const handledKeys = useRef(new Set<string>());
  const skipNextReset = useRef(false);
  useEffect(() => {
    if (!settings.enabled || handledKeys.current.has(location.key)) return;
    handledKeys.current.add(location.key);

    if (incoming) {
      // Starting a conversation from a navigation event, not derivable during render.
      // oxlint-disable-next-line react/set-state-in-effect
      startNewChat();
      send(incoming);
      // Drop the query from history so a refresh doesn't ask it again.
      skipNextReset.current = true;
      navigate('/chat', { replace: true, state: null });
      return;
    }
    if (routeChatId) {
      if (!settings.saveHistory) {
        navigate('/chat', { replace: true });
        return;
      }
      if (routeChatId === chatIdRef.current) return; // already on screen
      const savedChat = getSavedChat(routeChatId);
      if (savedChat) showSavedChat(savedChat);
      else navigate('/chat', { replace: true }); // deleted or unknown chat
      return;
    }
    if (skipNextReset.current) {
      skipNextReset.current = false;
      return;
    }
    if (settings.saveHistory) startNewChat();
  }, [location.key, incoming, routeChatId, settings.enabled, settings.saveHistory, navigate, send, startNewChat, showSavedChat]);

  const openSavedChat = (savedChat: SavedChat) => {
    setHistoryOpen(false);
    if (savedChat.id !== chatId) navigate(`/chat/${savedChat.id}`);
  };

  const deleteChat = (id: string) => {
    deleteSavedChat(id);
    if (id === chatId) navigate('/chat');
  };

  const clearHistory = () => {
    clearSavedChats();
    navigate('/chat');
  };
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

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
  const [draft, setDraft] = useState('');
  const composerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // "New page" behaviour: when a question is sent, scroll it to the top of the
  // screen once. The reply then streams into the empty space below it; nothing
  // auto-scrolls while it streams, so it never fights the user's own scrolling.
  let lastUserIndex = -1;
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i].role === 'user') {
      lastUserIndex = i;
      break;
    }
  }
  const lastUserId = lastUserIndex >= 0 ? turns[lastUserIndex].id : undefined;
  const latestRef = useRef<HTMLDivElement>(null);
  const seenUserId = useRef(lastUserId);
  useEffect(() => {
    if (!lastUserId || lastUserId === seenUserId.current) return;
    seenUserId.current = lastUserId;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    latestRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [lastUserId]);

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
    if (settings.saveHistory) navigate('/chat');
    else startNewChat();
    setDraft('');
    inputRef.current?.focus();
  };

  const header = (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-gold-500" />
        <h1 className="text-3xl font-serif font-bold text-cream">AI Chat</h1>
      </div>
      {settings.enabled && (
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
          {settings.saveHistory && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Chat history"
              className="btn-outline text-sm inline-flex items-center gap-2 !px-3 sm:!px-4 !py-2"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}
          {turns.length > 0 && (
            <button
              type="button"
              onClick={newChat}
              aria-label="New chat"
              className="btn-outline text-sm inline-flex items-center gap-2 !px-3 sm:!px-4 !py-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span className="hidden sm:inline">New chat</span>
            </button>
          )}
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

  const renderTurn = (turn: ChatTurn, i: number) => (
    <ChatBubble
      key={turn.id}
      turn={turn}
      waiting={phase === 'waiting' && i === turns.length - 1}
      streaming={busy && i === turns.length - 1}
      onRetry={!busy && i === turns.length - 1 ? retry : undefined}
      saved={saved}
      registerShowCard={registerShowCard(turn.id)}
    />
  );

  // End of the thread: the AI note and the model in use.
  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-2 border-t border-gold-500/10">
      <AiDisclaimer />
      <div className="flex items-center gap-1.5 text-xs text-cream/40">
        <span>Current model:</span>
        <ModelPicker
          model={settings.model}
          status={status}
          onChange={(model) => updateSettings({ model })}
          onRefresh={recheck}
        />
      </div>
    </div>
  );

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
              {settings.saveHistory && savedChats.length > 0 && (
                <div className="pt-2 space-y-2">
                  <p className="text-cream/40 text-xs uppercase tracking-wider">Recent chats</p>
                  <ul className="space-y-1">
                    {savedChats.slice(0, 3).map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => openSavedChat(c)}
                          className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 -mx-3 rounded-lg hover:bg-gold-500/10 transition-colors"
                        >
                          <span className="text-cream/80 text-sm truncate">{c.title}</span>
                          <span className="text-cream/40 text-xs shrink-0">{formatChatDate(c.updatedAt)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {savedChats.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(true)}
                      className="text-gold-400 hover:text-gold-300 text-sm transition-colors"
                    >
                      See all {savedChats.length} chats
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="space-y-6" aria-live="polite" aria-busy={busy}>
            {turns.slice(0, Math.max(lastUserIndex, 0)).map((turn, i) => renderTurn(turn, i))}

            {/* The latest question and its reply get at least a screen's height,
                so the reply has room to stream in below the question. */}
            {lastUserIndex >= 0 && (
              <div
                ref={latestRef}
                className="space-y-6 scroll-mt-20"
                style={{ minHeight: `calc(100dvh - 5rem - ${composerHeight}px - 5.5rem)` }}
              >
                {turns.slice(lastUserIndex).map((turn, i) => renderTurn(turn, lastUserIndex + i))}
                {footer}
              </div>
            )}
          </div>

          {lastUserIndex < 0 && footer}
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
            <div className="max-w-5xl mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
            </div>
          </div>,
          document.body,
          )}
        </>
      )}

      <ChatHistoryDrawer
        open={historyOpen}
        onClose={closeHistory}
        chats={savedChats}
        currentId={chatId}
        onOpenChat={openSavedChat}
        onDeleteChat={deleteChat}
        onClearAll={clearHistory}
      />

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
