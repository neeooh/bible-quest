export interface WordResult {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
}

export interface CompareResult {
  accuracy: number;
  words: WordResult[];
}

/** Lowercase the word, normalise apostrophes, and strip leading/trailing punctuation. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9]+$/, '');
}

/** Common contractions mapped to their expanded forms. */
const CONTRACTIONS: Record<string, string> = {
  "can't": 'cannot',
  "cant": 'cannot',
  "won't": 'will not',
  "wont": 'will not',
  "don't": 'do not',
  "dont": 'do not',
  "doesn't": 'does not',
  "doesnt": 'does not',
  "didn't": 'did not',
  "didnt": 'did not',
  "isn't": 'is not',
  "isnt": 'is not',
  "aren't": 'are not',
  "arent": 'are not',
  "wasn't": 'was not',
  "wasnt": 'was not',
  "weren't": 'were not',
  "werent": 'were not',
  "hasn't": 'has not',
  "hasnt": 'has not',
  "haven't": 'have not',
  "havent": 'have not',
  "hadn't": 'had not',
  "hadnt": 'had not',
  "wouldn't": 'would not',
  "wouldnt": 'would not',
  "couldn't": 'could not',
  "couldnt": 'could not',
  "shouldn't": 'should not',
  "shouldnt": 'should not',
  "i'm": 'i am',
  "im": 'i am',
  "you're": 'you are',
  "youre": 'you are',
  "we're": 'we are',
  "were": 'we are',
  "they're": 'they are',
  "theyre": 'they are',
  "he's": 'he is',
  "hes": 'he is',
  "she's": 'she is',
  "shes": 'she is',
  "it's": 'it is',
  "its": 'it is',
  "that's": 'that is',
  "thats": 'that is',
  "there's": 'there is',
  "theres": 'there is',
  "who's": 'who is',
  "whos": 'who is',
  "what's": 'what is',
  "whats": 'what is',
  "i'll": 'i will',
  "you'll": 'you will',
  "he'll": 'he will',
  "she'll": 'she will',
  "we'll": 'we will',
  "they'll": 'they will',
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "they've": 'they have',
  "i'd": 'i would',
  "you'd": 'you would',
  "he'd": 'he would',
  "she'd": 'she would',
  "we'd": 'we would',
  "they'd": 'they would',
  "let's": 'let us',
  "lets": 'let us',
};

/**
 * Expand a normalized word to its canonical form.
 * Strips all non-alphanumeric chars so "cant" and "can't" both become "cannot".
 */
function canonicalize(word: string): string {
  const norm = normalizeWord(word);
  // Strip all remaining apostrophes for contraction lookup
  const stripped = norm.replace(/'/g, '');
  // Check both with and without apostrophe
  return CONTRACTIONS[norm] ?? CONTRACTIONS[stripped] ?? norm;
}

/**
 * Check if two words match, accounting for contractions and minor variations.
 * "can't" === "cannot" === "can not" === "cant"
 */
export function wordsMatch(a: string, b: string): boolean {
  const na = normalizeWord(a);
  const nb = normalizeWord(b);
  if (na === nb) return true;
  // Compare canonical (expanded) forms
  return canonicalize(a) === canonicalize(b);
}

/**
 * Split text into non-empty words.
 * Keeps the original casing so the UI can display it, but comparison
 * uses normalized forms.
 */
function tokenize(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

/**
 * Align two word sequences using a Levenshtein-style DP on the word level.
 *
 * Returns a list of WordResult entries that describe matches, mismatches,
 * missing words (in the original but not the attempt) and extra words
 * (in the attempt but not the original).
 */
function alignWords(original: string[], attempt: string[]): WordResult[] {
  const m = original.length;
  const n = attempt.length;

  // Cost matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array<number>(n + 1).fill(0),
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = wordsMatch(original[i - 1], attempt[j - 1]) ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion (missing word)
        dp[i][j - 1] + 1, // insertion (extra word)
        dp[i - 1][j - 1] + cost, // match / substitution
      );
    }
  }

  // Backtrack to build the alignment.
  const results: WordResult[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      dp[i][j] ===
        dp[i - 1][j - 1] +
          (wordsMatch(original[i - 1], attempt[j - 1])
            ? 0
            : 1)
    ) {
      const match = wordsMatch(original[i - 1], attempt[j - 1]);
      results.push({
        word: original[i - 1],
        status: match ? 'correct' : 'incorrect',
      });
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      results.push({ word: original[i - 1], status: 'missing' });
      i--;
    } else {
      results.push({ word: attempt[j - 1], status: 'extra' });
      j--;
    }
  }

  results.reverse();
  return results;
}

/**
 * Compare an original text with the user's attempt.
 *
 * Returns an accuracy score (0–1) and a per-word breakdown.
 * Accuracy = correct words / total original words.
 */
export function compareTexts(original: string, attempt: string): CompareResult {
  const origTokens = tokenize(original);
  const attTokens = tokenize(attempt);

  if (origTokens.length === 0) {
    return { accuracy: attTokens.length === 0 ? 1 : 0, words: [] };
  }

  const words = alignWords(origTokens, attTokens);

  const correctCount = words.filter((w) => w.status === 'correct').length;
  const accuracy = correctCount / origTokens.length;

  return { accuracy, words };
}

/**
 * Pick `count` unique random indices from the range [0, total).
 * Useful for selecting which words to hide in a missing-words exercise.
 */
export function getRandomIndices(total: number, count: number): number[] {
  const clamped = Math.min(count, total);
  const indices = new Set<number>();

  while (indices.size < clamped) {
    indices.add(Math.floor(Math.random() * total));
  }

  return Array.from(indices).sort((a, b) => a - b);
}
