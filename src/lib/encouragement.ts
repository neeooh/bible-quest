/**
 * Return an encouraging message based on accuracy score.
 * Designed to never make the user feel like they failed.
 */
export function getEncouragement(accuracy: number): string {
  if (accuracy >= 1.0) return 'Perfect! Every single word.';
  if (accuracy >= 0.95) return 'Outstanding — almost flawless.';
  if (accuracy >= 0.9) return 'Excellent work. You know this passage well.';
  if (accuracy >= 0.85) return 'Great recall. You are ready for retention.';
  if (accuracy >= 0.8) return 'Strong effort. Just a few words to brush up on.';
  if (accuracy >= 0.7) return 'Good progress. The passage is coming together.';
  if (accuracy >= 0.6) return 'Solid foundation. Keep practising and it will stick.';
  if (accuracy >= 0.5) return 'You remember more than half — that is a real start.';
  if (accuracy >= 0.35) return 'You are building the groundwork. Each try strengthens your memory.';
  if (accuracy >= 0.2) return 'Every word you recall is progress. Keep going.';
  if (accuracy > 0) return 'A journey of a thousand miles starts with a single step. You have begun.';
  return 'Do not worry — this is how learning starts. Try again with hints.';
}
