import { describe, expect, it } from 'vitest';
import { stripPetNameOpener } from './tone';

describe('stripPetNameOpener', () => {
  it.each([
    ['Oh, sweetheart, it’s completely understandable.', 'It’s completely understandable.'],
    ['Oh my dear, I hear you.', 'I hear you.'],
    ['Oh, my dear, it’s alright to feel this way.', 'It’s alright to feel this way.'],
    ['My dear friend, you are not alone.', 'You are not alone.'],
    ['Dear one — that sounds hard.', 'That sounds hard.'],
    ['Honey, take a breath.', 'Take a breath.'],
    ['Oh, darling! You matter.', 'You matter.'],
  ])('strips: %s', (input, expected) => {
    expect(stripPetNameOpener(input)).toBe(expected);
  });

  it.each([
    'Hey there, that sounds really hard.',
    'That’s a heavy thing to carry.',
    'Oh, I hear you.',
    'Love is patient, as 1 Corinthians 13:4-7 reminds us.',
    'Loneliness can feel isolating.',
    'Children often feel this way too.',
  ])('keeps: %s', (input) => {
    expect(stripPetNameOpener(input)).toBe(input);
  });

  it('waits while a streaming reply has only the opener so far', () => {
    expect(stripPetNameOpener('Oh, sweetheart, ')).toBe('Oh, sweetheart, ');
  });
});
