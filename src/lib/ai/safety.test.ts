import { describe, expect, it } from 'vitest';
import { suggestsCrisis } from './safety';

describe('suggestsCrisis', () => {
  it.each([
    'I want to kill myself',
    'I have been thinking about suicide',
    "I don't want to live anymore",
    'I don’t want to wake up',
    'Everyone would be better off without me',
    'I keep cutting myself',
    'I want to end it all',
    'My husband hits me',
    'I was abused as a child',
    "I'm not safe at home",
    'I wish I was dead',
    'There is no reason to live',
  ])('flags: %s', (text) => {
    expect(suggestsCrisis(text)).toBe(true);
  });

  it.each([
    "I'm feeling lonely",
    'I am anxious about my exams',
    'How can I forgive my brother?',
    'I feel far from God',
    'I want to live a more faithful life',
  ])('does not flag: %s', (text) => {
    expect(suggestsCrisis(text)).toBe(false);
  });
});
