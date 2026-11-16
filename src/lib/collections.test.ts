import { beforeEach, describe, expect, it } from 'vitest';
import { addPassagesToCollection, createCollection, getCollections, uniqueCollectionName } from './collections';

beforeEach(() => localStorage.clear());

describe('addPassagesToCollection', () => {
  it('adds new passages, keeps existing ones and skips duplicates', () => {
    const { id } = createCollection('Lonely', '');
    addPassagesToCollection(id, ['psalms:34:18-18']);
    addPassagesToCollection(id, ['psalms:34:18-18', 'isaiah:41:10-10', 'isaiah:41:10-10']);
    expect(getCollections()[0].passageKeys).toEqual(['psalms:34:18-18', 'isaiah:41:10-10']);
  });

  it('leaves other collections alone', () => {
    const a = createCollection('A', '').id;
    const b = createCollection('B', '').id;
    addPassagesToCollection(b, ['john:3:16-16']);
    const byId = Object.fromEntries(getCollections().map((c) => [c.id, c.passageKeys]));
    expect(byId[a]).toEqual([]);
    expect(byId[b]).toEqual(['john:3:16-16']);
  });
});

describe('uniqueCollectionName', () => {
  it('returns the name when free, or adds a number', () => {
    expect(uniqueCollectionName('Peace')).toBe('Peace');
    createCollection('Peace', '');
    expect(uniqueCollectionName('Peace')).toBe('Peace (2)');
    expect(uniqueCollectionName('peace!')).toBe('peace! (2)');
  });
});
