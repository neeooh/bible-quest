import { describe, expect, it } from 'vitest';
import { compareTexts, normalizeWord, wordsMatch } from './word-compare';

describe('normalizeWord', () => {
  it('lowercases and strips surrounding punctuation', () => {
    expect(normalizeWord('“Lord,')).toBe('lord');
  });

  it('normalises curly apostrophes', () => {
    expect(normalizeWord('don’t')).toBe("don't");
  });
});

describe('wordsMatch', () => {
  it('ignores case and punctuation', () => {
    expect(wordsMatch('Shepherd;', 'shepherd')).toBe(true);
  });
});

describe('compareTexts', () => {
  it('scores an exact recitation as 100%', () => {
    const text = 'Yahweh is my shepherd: I shall lack nothing.';
    expect(compareTexts(text, text).accuracy).toBe(1);
  });

  it('scores an empty attempt as 0%', () => {
    expect(compareTexts('Jesus wept.', '').accuracy).toBe(0);
  });
});
