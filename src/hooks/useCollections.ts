import { useCallback, useState } from 'react';
import type { Collection } from '../lib/collections';
import * as collectionsLib from '../lib/collections';

export interface UseCollectionsReturn {
  collections: Collection[];
  createCollection: (name: string, description: string, icon?: string) => string;
  updateCollection: (id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'icon'>>) => void;
  deleteCollection: (id: string) => void;
  addPassageToCollections: (passageKey: string, collectionIds: string[]) => void;
  removePassageFromCollection: (collectionId: string, passageKey: string) => void;
  removePassageFromAllCollections: (passageKey: string) => void;
}

export function useCollections(): UseCollectionsReturn {
  const [collections, setCollections] = useState<Collection[]>(
    collectionsLib.getCollections,
  );

  const createCollection = useCallback((name: string, description: string, icon?: string): string => {
    const { collections: updated, id } = collectionsLib.createCollection(name, description, icon);
    setCollections(updated);
    return id;
  }, []);

  const updateCollection = useCallback(
    (id: string, updates: Partial<Pick<Collection, 'name' | 'description' | 'icon'>>) => {
      const updated = collectionsLib.updateCollection(id, updates);
      setCollections(updated);
    },
    [],
  );

  const deleteCollection = useCallback((id: string) => {
    const updated = collectionsLib.deleteCollection(id);
    setCollections(updated);
  }, []);

  const addPassageToCollections = useCallback(
    (passageKey: string, collectionIds: string[]) => {
      const updated = collectionsLib.addPassageToCollections(passageKey, collectionIds);
      setCollections(updated);
    },
    [],
  );

  const removePassageFromCollection = useCallback(
    (collectionId: string, passageKey: string) => {
      const updated = collectionsLib.removePassageFromCollection(collectionId, passageKey);
      setCollections(updated);
    },
    [],
  );

  const removePassageFromAllCollections = useCallback((passageKey: string) => {
    const updated = collectionsLib.removePassageFromAllCollections(passageKey);
    setCollections(updated);
  }, []);

  return {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    addPassageToCollections,
    removePassageFromCollection,
    removePassageFromAllCollections,
  };
}
