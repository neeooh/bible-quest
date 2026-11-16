# Bible Memorisation App: UX and Feature Improvements

## Overview

The app already has a coherent memorisation system, not just a Bible
reader with flashcards bolted onto it. The existing dark navy and gold
visual identity works well and does not need a complete redesign.

The strongest direction is to make memorisation the heart of the
experience: a Bible reader, personal Scripture library and intelligent
memorisation system.

**Core concept:** A Bible memorisation tool that gradually takes away
the user's dependence on the written text until they can recall
Scripture independently.

------------------------------------------------------------------------

## 1. Rethink the memorisation modes

The current modes are Missing Words, Progressive, Full Recitation and
Voice.

Missing Words and Progressive Recall are conceptually similar. Give each
mode a clearly defined purpose.

  -----------------------------------------------------------------------
  Mode                    Purpose                 Difficulty
  ----------------------- ----------------------- -----------------------
  Missing Words           Fill in missing words   Easy to hard

  Progressive Recall      Gradually remove more   Easy to hard
                          of the passage          

  First Letters           Reconstruct the passage Hard
                          using first letters     

  Word Ordering           Reconstruct the passage Easy to medium
                          from scrambled words    

  Full Recitation         Recall the entire       Very hard
                          passage                 

  Voice Recall            Recite the passage      Very hard
                          aloud                   
  -----------------------------------------------------------------------

There is no need to display all six modes as equally prominent tabs.
They can be grouped into Guided and Recall exercises, or displayed in a
responsive grid.

## 2. Missing Words

Keep the existing difficulty slider, but make its levels more
descriptive.

-   **Easy:** Remove 15% of words.
-   **Medium:** Remove 35% of words.
-   **Hard:** Remove 60% of words.
-   **Expert:** Remove 85% of words.

The user should gradually become less dependent on visual clues.

Also consider allowing users to reveal individual missing words when
they get stuck. This could be a small hint button rather than forcing
them to restart the exercise.

## 3. Progressive Recall

Make this a genuine progression from reading to independent recall.

1.  **0% hidden:** Display the entire passage.
2.  **25% hidden:** Remove some words.
3.  **50% hidden:** Remove considerably more words.
4.  **75% hidden:** Leave only a few words visible.
5.  **100% hidden:** Recall the entire passage.

The user progresses through the stages sequentially.

This differs from Missing Words because the user experiences a gradual
transition from reading to independent recall within one exercise.
Retain the existing timeline visualisation.

## 4. First Letters

This is a valuable addition because it occupies the middle ground
between fill-in-the-blanks and complete recitation.

Example, Matthew 5:14:

> You are the light of the world. A city located on a hill can't be
> hidden.

Becomes:

> Y a t l o t w. A c l o a h c b h.

The user reconstructs the original passage.

Suggested interaction:

-   Display the first-letter version in a large, readable area.
-   Provide a text input where the user types the complete passage.
-   Allow the user to reveal individual words.
-   Allow the user to reveal the entire passage.
-   Provide a Check answer action.
-   Allow the user to try again.

Difficulty could gradually increase by removing punctuation or other
visual clues.

## 5. Word Ordering

This exercise tests recognition and sentence structure more than pure
recall, so treat it as a supplementary exercise rather than a core
measure of memorisation.

Example:

Original: **For God so loved the world.**

Scrambled words: `world` `God` `the` `loved` `For` `so`

The user arranges them into: **For God so loved the world.**

Suggested interaction:

-   Click words to add them to the sentence.
-   Drag and drop to rearrange them.
-   Remove individual words.
-   Check the answer.

Suggested difficulty levels:

-   **Normal:** Individual words are displayed.
-   **Advanced:** Some words are removed entirely, requiring the user to
    remember them.

## 6. Full Recitation

The existing approach is a good foundation:

-   Display the reference.
-   Provide a text area.
-   Let the user enter the passage.
-   Compare the answer.
-   Display an accuracy percentage.

Improve the comparison experience with word-level feedback:

-   Correct words: green.
-   Missing words: red.
-   Incorrect words: orange.

Distinguish between minor punctuation differences, capitalisation
differences, missing words, incorrect words and word-order mistakes.

A user should not receive a poor score because they forgot a comma.
Calculate accuracy using word-level comparison, not character-level
comparison.

## 7. Voice Recall

Speech recognition can misinterpret accents, omit or insert words,
struggle with biblical names and produce inconsistent punctuation.

Two improvements are recommended:

1.  Compare the recognised transcript with the original passage using
    the same word-level comparison as Full Recitation.
2.  Allow users to assess themselves: **Perfectly**, **Almost
    perfectly** or **Needed help**.

A speech-recognition error should not automatically punish the user.

Keep Voice Recall optional rather than making it central to the
memorisation algorithm.

## 8. Introduce a learning progression

Introduce three distinct stages.

### Stage 1: Learning

The user is getting familiar with the passage.

Available exercises: - Missing Words - Progressive Recall - Word
Ordering

### Stage 2: Memorising

The user is gradually removing their dependence on visual clues.

Available exercises: - First Letters - Progressive Recall - Full
Recitation - Voice Recall

### Stage 3: Retention

The user has successfully memorised the passage. The system periodically
tests their memory.

Available exercises: - Full Recitation - Voice Recall - First Letters
(optional)

**A passage being memorised isn't the same as a passage being
retained.** Someone might successfully recite a verse today and forget
it next week. The application should recognise that distinction.

## 9. Specific improvements to the existing UI

These are refinements, not a complete redesign.

### A. Passage selector

The selector currently occupies quite a lot of vertical space. Keep it,
but consider making it collapsible after a passage has been selected.

For example:

**Currently selected: Matthew 5:14--16**

`Change passage ↓`

This gives more room to the actual exercise.

### B. Exercise navigation

The current navigation is:

`Missing Words | Progressive | Full Recitation | Voice`

Consider grouping exercises:

**Guided** - Missing Words - Progressive - Word Ordering

**Recall** - First Letters - Full Recitation - Voice

This could be a secondary navigation row or a dropdown. Avoid
unnecessary navigation complexity; a responsive grid of six buttons
would also work.

### C. My Verses page

Add a small status indicator to each passage:

-   Learning
-   Memorised
-   Retention

Also consider displaying `Next review: Tomorrow`.

### D. Progress page

Focus on actual retention rather than simply how many passages users
have added.

Possible metrics:

  Metric                 Example
  -------------------- ---------
  Passages memorised          24
  Currently learning           5
  Retention rate             92%
  Reviews completed          143

A simple activity calendar would also be useful.

## 10. Passage context

When someone selects Matthew 5:14, they're memorising an individual
verse. But Matthew 5:14--16 is a larger passage about being the light of
the world.

Let users choose between:

-   Individual verse.
-   Multiple consecutive verses.
-   Entire chapter.

Display the surrounding verses as context, even when only one verse is
being memorised.

This is particularly important for a Bible application. The goal should
not be to encourage people to memorise isolated sentences without
understanding what they're part of.

## 11. Implementation priorities

Avoid implementing everything simultaneously.

### Stage 1: Core improvements

1.  Complete WEB Bible reader.
2.  Verse and passage selection.
3.  Personal memorisation library.
4.  Read-and-repeat exercise.
5.  Fill-in-the-blanks exercise.
6.  Complete recall exercise.
7.  Basic spaced repetition.
8.  Daily review screen.
9.  Basic progress tracking.

### Stage 2: Better memorisation

1.  First-letter recall.
2.  Word ordering.
3.  Audio playback.
4.  Voice recall.
5.  Collections and tags.
6.  Advanced retention statistics.
7.  Reading plans.

### Stage 3: More ambitious features

1.  AI-assisted Scripture exploration.
2.  Contextual cross-references.
3.  Additional translations.
4.  User-created memorisation challenges.
5.  Optional community features.
6.  Cloud synchronisation.

### Feature priority summary

  -----------------------------------------------------------------------
  Feature                 Priority                Reason
  ----------------------- ----------------------- -----------------------
  First Letters           Very high               Genuinely different
                                                  recall exercise

  Improve Progressive     Very high               Make it a proper
                                                  learning progression

  Better Full Recitation  High                    Core memorisation
  feedback                                        functionality

  Learning / Memorised /  Very high               Improves the overall
  Retention states                                product architecture

  Word Ordering           Medium                  Useful supplementary
                                                  exercise

  Voice improvements      Medium                  Existing feature, but
                                                  reliability needs work

  Collections             Medium                  Better organisation

  Advanced statistics     Low                     Not essential to the
                                                  core experience
  -----------------------------------------------------------------------

## 12. Architectural recommendation

Separate the passage's memorisation state from the individual exercise
modes.

For example:

``` json
{
  "passage": "Matthew 5:14",
  "status": "learning",
  "exercises": [
    "missing_words",
    "progressive",
    "first_letters",
    "word_ordering",
    "full_recitation",
    "voice"
  ],
  "review": {
    "next_review_at": "...",
    "interval": 0,
    "repetitions": 0,
    "difficulty": 0
  }
}
```

The exact data model will depend on the existing application, but the
principle is important:

**One memorisation system with six ways of exercising memory.**

Avoid building six independent memorisation systems. This distinction
becomes increasingly important when spaced repetition is implemented.

Also, don't require users to complete every exercise before a passage
can become memorised. Let successful recall determine progression, not
arbitrary completion requirements.

## 13. Product philosophy

Keep the existing visual identity and general page structure.
Concentrate on making the exercises genuinely distinct, improving the
learning progression and making long-term retention the central concept.

Most importantly, don't make users feel they're constantly failing
because they forgot something.

Forgetting is part of how memory works. The application should help them
recover that knowledge, not punish them for being human.

A person who memorises 30 passages over six months and genuinely
remembers them five years later has achieved something more valuable
than someone who memorises 300 and forgets 290.
