export interface WordResult {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
}

export interface CompareResult {
  accuracy: number;
  words: WordResult[];
}

/** Lowercase the word and strip leading/trailing punctuation. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[^a-z0-9]+/, '')
    .replace(/[^a-z0-9]+$/, '');
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
      const origNorm = normalizeWord(original[i - 1]);
      const attNorm = normalizeWord(attempt[j - 1]);
      const cost = origNorm === attNorm ? 0 : 1;

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
          (normalizeWord(original[i - 1]) === normalizeWord(attempt[j - 1])
            ? 0
            : 1)
    ) {
      const match =
        normalizeWord(original[i - 1]) === normalizeWord(attempt[j - 1]);
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
