import { useState } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { formatChatDate, type SavedChat } from '../../lib/ai/chat-history';
import SlideOver from './SlideOver';

interface ChatHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  chats: SavedChat[];
  /** The conversation currently on screen. */
  currentId: string;
  onOpenChat: (chat: SavedChat) => void;
  onDeleteChat: (id: string) => void;
  onClearAll: () => void;
}

/** Past AI Chat conversations saved on this device. */
export default function ChatHistoryDrawer({
  open,
  onClose,
  chats,
  currentId,
  onOpenChat,
  onDeleteChat,
  onClearAll,
}: ChatHistoryDrawerProps) {
  // Deleting asks for confirmation inline: a chat id, 'all', or nothing.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setConfirming(null);
  }

  return (
    <SlideOver open={open} onClose={onClose} title="Chat history">
      {chats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-5 py-12">
          <MessageSquare className="w-8 h-8 text-gold-500/60" />
          <p className="text-cream/60 text-sm max-w-xs">
            No saved chats yet. Your conversations will appear here after the mentor replies.
          </p>
        </div>
      ) : (
        <>
          <ul className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {chats.map((chat) => {
              const current = chat.id === currentId;
              const messages = chat.turns.filter((t) => t.role === 'user').length;
              return (
                <li
                  key={chat.id}
                  className={`rounded-xl border transition-colors ${
                    current ? 'border-gold-500/40 bg-navy-700/50' : 'border-gold-500/10 hover:border-gold-500/30'
                  }`}
                >
                  {confirming === chat.id ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <span className="text-cream text-sm">Delete this chat?</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteChat(chat.id);
                            setConfirming(null);
                          }}
                          className="text-sm px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="btn-outline text-sm !px-3 !py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-1">
                      <button
                        type="button"
                        onClick={() => onOpenChat(chat)}
                        aria-current={current || undefined}
                        className="flex-1 min-w-0 text-left px-3 py-2.5 rounded-lg"
                      >
                        <span className="block text-cream font-medium truncate">{chat.title}</span>
                        <span className="block text-cream/40 text-xs mt-1">
                          {formatChatDate(chat.updatedAt)} · {messages} question{messages === 1 ? '' : 's'}
                          {current && <span className="text-gold-400"> · Open now</span>}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(chat.id)}
                        aria-label={`Delete “${chat.title}”`}
                        title="Delete"
                        className="mt-2 mr-1 w-8 h-8 inline-flex items-center justify-center rounded-lg text-cream/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="px-5 py-4 border-t border-gold-500/10">
            {confirming === 'all' ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-cream text-sm">Delete all {chats.length} saved chats?</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAll();
                      setConfirming(null);
                    }}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors"
                  >
                    Delete all
                  </button>
                  <button type="button" onClick={() => setConfirming(null)} className="btn-outline text-sm !px-3 !py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-cream/40 text-xs">Saved on this device only</span>
                <button
                  type="button"
                  onClick={() => setConfirming('all')}
                  className="text-sm text-cream/60 hover:text-red-400 inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </SlideOver>
  );
}
