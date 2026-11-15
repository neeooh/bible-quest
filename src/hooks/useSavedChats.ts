import { useEffect, useState } from 'react';
import { CHAT_HISTORY_EVENT, getSavedChats, type SavedChat } from '../lib/ai/chat-history';

/** Saved AI Chat conversations, kept in sync across components and tabs. */
export function useSavedChats(): SavedChat[] {
  const [chats, setChats] = useState<SavedChat[]>(getSavedChats);

  useEffect(() => {
    const sync = () => setChats(getSavedChats());
    window.addEventListener(CHAT_HISTORY_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHAT_HISTORY_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return chats;
}
