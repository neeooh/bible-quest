# Not Implemented

Features from `docs/bible-memorisation-app-improvements.md` that the app does not yet implement.

## Stage 2 gaps

### Word Order advanced difficulty
Section 5. The normal mode exists (scrambled individual words). The advanced mode — where some words are removed entirely, requiring the user to remember them — is not implemented.

### Voice Recall self-assessment
Section 7. Voice Recall uses speech-to-text accuracy only. The spec recommends allowing users to rate themselves (Perfectly, Almost perfectly, Needed help) so speech-recognition errors do not punish the user.

### Exercise availability gated by learning stage
Section 8. All six exercises are available at all stages. The spec recommends restricting exercises by stage:
- **Learning:** Missing Words, Progressive Recall, Word Ordering.
- **Memorising:** First Letters, Progressive Recall, Full Recitation, Voice Recall.
- **Retention:** Full Recitation, Voice Recall, First Letters (optional).

### Exercise grouping (Guided / Recall)
Section 9B. Exercises appear as a flat tab list. The spec suggests grouping them:
- **Guided:** Missing Words, Progressive, Word Ordering.
- **Recall:** First Letters, Full Recitation, Voice.

### Advanced progress page
Section 9D. The progress page shows basic XP, streak, and exercise history. The spec recommends retention-focused metrics:
- Passages memorised.
- Currently learning.
- Retention rate.
- Reviews completed.
- Activity calendar.

### Surrounding verse context
Section 10. When a user memorises a single verse, only the selected verse is displayed. The spec recommends showing surrounding verses as context so the user understands what the verse is part of.

### Full spaced repetition algorithm
Section 12. The app has learning stages and "next review" dates. It does not implement a full SM-2 style algorithm with interval, repetitions, and difficulty factor.

### Audio playback
Section 11 (Stage 2 priority list). A `useTextToSpeech` hook exists but is not integrated into the exercise flow as a "listen before you practise" feature.

### Reading plans
Section 11 (Stage 2 priority list). Not implemented.

## Stage 3 (ambitious features, not expected yet)

- AI-assisted Scripture exploration.
- Contextual cross-references.
- Additional translations (app uses WEB only).
- User-created memorisation challenges.
- Community features.
- Cloud synchronisation.

## Backlog (ideas to tackle later)

### Verse cards as flashcards
*Added 2026-11-15.* The verse cards in AI Chat (and potentially the passage cards in My Verses and Collections) could double as flashcards, another way to memorise a passage alongside the five exercises.

- Front: the reference (e.g. "Psalm 34:18"), optionally with a hint such as the first few words. Back: the full WEB text.
- Tap or click to flip; the user marks themselves "Got it" / "Not yet", which could feed the existing learning stages and spaced-repetition reviews.
- Could also run as a deck: flip through every card in a chat, a collection or the passages due for review.
- Open questions: where the deck lives (a new exercise type on the Memorise page, or a mode on the card itself), and whether self-rating counts towards XP and stages like the other exercises.
