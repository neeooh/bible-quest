export interface Collection {
  id: string;
  name: string;
  description: string;
  icon: string;
  passageKeys: string[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'biblequest_collections';

export function getCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Collection[];
  } catch {
    return [];
  }
}

function persist(collections: Collection[]): Collection[] {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  return collections;
}

export const DEFAULT_COLLECTION_ICON = 'BookOpen';

export const COLLECTION_ICONS = [
  'BookOpen', 'Heart', 'Star', 'Flame', 'Shield',
  'Crown', 'Music', 'Mountain', 'Anchor', 'Cross',
  'Lightbulb', 'Feather', 'Gem', 'Leaf', 'Sun',
  'Moon', 'Flower2', 'Sword', 'Hand', 'Sparkles',
] as const;

export type CollectionIconName = typeof COLLECTION_ICONS[number];

export function createCollection(name: string, description: string, icon?: string): { collections: Collection[]; id: string } {
  const current = getCollections();
  const id = crypto.randomUUID();
  const newCollection: Collection = {
    id,
    name,
    description,
    icon: icon || DEFAULT_COLLECTION_ICON,
    passageKeys: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return { collections: persist([...current, newCollection]), id };
}

export function updateCollection(
  id: string,
  updates: Partial<Pick<Collection, 'name' | 'description' | 'icon'>>,
): Collection[] {
  const current = getCollections();
  return persist(
    current.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c,
    ),
  );
}

export function deleteCollection(id: string): Collection[] {
  const current = getCollections();
  return persist(current.filter((c) => c.id !== id));
}

export function addPassageToCollections(
  passageKey: string,
  collectionIds: string[],
): Collection[] {
  const current = getCollections();
  return persist(
    current.map((c) => {
      if (!collectionIds.includes(c.id)) {
        // Remove from collections not in the list
        if (c.passageKeys.includes(passageKey)) {
          return {
            ...c,
            passageKeys: c.passageKeys.filter((k) => k !== passageKey),
            updatedAt: Date.now(),
          };
        }
        return c;
      }
      // Add to collections in the list
      if (c.passageKeys.includes(passageKey)) return c;
      return {
        ...c,
        passageKeys: [...c.passageKeys, passageKey],
        updatedAt: Date.now(),
      };
    }),
  );
}

export function removePassageFromCollection(
  collectionId: string,
  passageKey: string,
): Collection[] {
  const current = getCollections();
  return persist(
    current.map((c) =>
      c.id === collectionId
        ? {
            ...c,
            passageKeys: c.passageKeys.filter((k) => k !== passageKey),
            updatedAt: Date.now(),
          }
        : c,
    ),
  );
}

export function removePassageFromAllCollections(passageKey: string): Collection[] {
  const current = getCollections();
  return persist(
    current.map((c) =>
      c.passageKeys.includes(passageKey)
        ? {
            ...c,
            passageKeys: c.passageKeys.filter((k) => k !== passageKey),
            updatedAt: Date.now(),
          }
        : c,
    ),
  );
}
