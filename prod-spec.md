Build BibleQuest – Complete MVP

Build a beautiful, fully functional, mobile-first Bible memorisation application called BibleQuest.

Tagline: Hide the words. Learn the Word.

The application launches with the complete Gospel of Matthew (all 28 chapters), allowing users to read, study and memorise Scripture through interactive exercises and speech recognition.

The priority is to produce a working, deployable MVP as quickly as possible.

1. Technology

* React + Vite
* TypeScript
* Tailwind CSS and ShadCN library
* Browser Web Speech API for speech recognition
* LocalStorage for user progress
* Lucide icons

No backend, authentication, external AI APIs or paid services.

2. Bible Library

Include the complete Gospel of Matthew, chapters 1–28.

Use the World English Bible (WEB), which is public domain.

IMPORTANT:

* Obtain the actual Bible text from a reliable public-domain source.
* Do not invent, paraphrase or generate approximate Scripture passages.
* Bundle the complete text locally as JSON.
* The application must work offline after initial loading.
* Preserve chapter and verse numbering.

Organise the content into chapters and selectable passages.

Users should be able to:

* Browse all 28 chapters.
* Select individual chapters.
* Select individual passages or verse ranges.
* Read the complete chapter.
* Start memorisation exercises from any selected passage.

3. Reading Mode

Create a clean Scripture reading interface.

Features:

* Chapter navigation.
* Clearly displayed verse numbers.
* Adjustable font size.
* Highlight selected verses.
* Select a passage to memorise.
* Previous/next chapter navigation.

4. Memorisation Mode

This is the core product feature.

Implement several interactive exercises:

A. Missing Words

* Hide randomly selected words.
* Display empty spaces where words were removed.
* Let users type the missing words.
* Highlight correct and incorrect answers.
* Allow users to reveal answers.

B. Progressive Memorisation

* Initially display the entire passage.
* Gradually hide more words as the user progresses.
* Let users test their memory.

C. Complete Recitation

* Display the passage.
* Let users attempt to reproduce it from memory.
* Compare their answers against the original.

Provide immediate feedback and an accuracy percentage.

5. Voice Recitation

Implement browser-based speech recognition using SpeechRecognition / webkitSpeechRecognition.

Features:

* Microphone button to start and stop recording.
* Display recognised speech.
* Compare the transcription against the original passage.
* Identify correctly spoken words.
* Highlight missing, incorrect and misplaced words.
* Display an accuracy percentage.
* Identify sections that need additional practice.

Use a word-alignment algorithm rather than simple string equality.

Handle unsupported browsers, microphone permissions and recognition errors gracefully.

Do not require an external AI API.

6. Progress Tracking

Persist progress in LocalStorage.

Track:

* Total XP earned.
* Chapters explored.
* Passages memorised.
* Memorisation accuracy.
* Daily practice streak.
* Practice history.

Include a simple progress dashboard.

Reward users with XP for completing exercises.

Avoid punishing users for missed days.

7. Daily Verse

Display a featured Bible verse on the homepage.

Include:

* Scripture reference.
* Verse text.
* Button to memorise the verse.
* Button to copy the verse.

8. Design Direction

Create a premium, elegant Christian educational application.

Visual identity:

* Deep navy background (#101827).
* Warm gold accents (#D6AD60).
* Cream and white typography.
* Elegant serif headings.
* Modern sans-serif body typography.
* Subtle gradients and animations.
* Refined cards and generous spacing.
* Beautiful typography and readable Scripture.

Avoid generic SaaS dashboard aesthetics.

The application should feel peaceful, focused, premium and welcoming.

Make it fully responsive, particularly for mobile devices.

9. Navigation

Keep navigation simple:

* Home
* Bible Library
* Memorise
* My Progress

Use a responsive navigation bar.

10. Technical Requirements

* All primary interactions must work.
* No placeholder buttons.
* No fake AI functionality.
* No authentication.
* No backend.
* No unnecessary dependencies.
* No external API requirements.
* Persist user progress locally.
* Include appropriate SEO metadata.
* Include a favicon.
* Ensure TypeScript compiles successfully.
* Ensure the production build succeeds.

11. Scope Restrictions

TIME IS CRITICAL.

Do not overengineer.

Prioritise features in this order:

1. Complete Gospel of Matthew text.
2. Bible reading interface.
3. Missing-word memorisation.
4. Voice recitation.
5. Local progress tracking.
6. Visual polish.

If time becomes limited, simplify secondary features rather than compromising the core memorisation experience.

Do not spend time implementing accounts, subscriptions, social features, notifications or complex settings.

12. Final Deliverable

Produce a complete, working application that can be deployed immediately as a static site.

Before finishing:

* Run the production build.
* Fix compilation errors.
* Verify chapter navigation.
* Verify memorisation exercises.
* Verify speech recognition where supported.
* Verify LocalStorage persistence.

Do not just describe what you would build. Actually implement the application.

The goal is to ship BibleQuest asap.
