# Design Challenges

These features require you to make genuine product decisions. There's no single right answer — your solution should reflect your understanding of the users, your design taste, and thoughtful trade-offs.

For each, document your approach and reasoning in your README.

---

## 1. Year-in-Review & Reading Insights

**The problem:** Readers love reflecting on their reading year — what they read, how much, which genres dominated, how their pace changed across seasons. But raw numbers alone aren't compelling. The year-in-review needs to tell a story about the user's reading life in a way that's visually engaging, informative, and genuinely fun to explore (and share).

**Design this:**

- What data do you show? Consider: books read per month, total pages, genre breakdown, average rating, longest/shortest book, reading streaks, author diversity, time-to-finish trends.
- How do you visualize it? Charts, infographics, illustrated summaries, scrollable story format (like Spotify Wrapped), static dashboard, or something else entirely?
- How does it handle a user who has only read 3 books vs. one who has read 50? The design should feel rewarding at any scale, not embarrassing for light readers.
- Is this a standalone page, a section of the dashboard, or an interactive experience? Can it be shared (screenshot, link, export)?
- How do you handle the current year (incomplete data) vs. a completed year? Is there a "so far this year" view?

**Questions to consider:**

- What's the balance between data density and visual storytelling? A chart-heavy dashboard feels different from a narrative scroll.
- Should the year-in-review focus on celebration (your reading wins!) or analysis (your reading patterns)? Or both?
- How do you make this screen visually distinctive from the rest of the app — it should feel like a special moment, not just another page.
- What would make someone screenshot this and share it on social media?

---

## 2. Book Discovery & Recommendations

**The problem:** Users need to find books to add to their library. The book search API returns raw results, but that's not discovery — it's just a search box. How do you help users find their next great read? How does the empty state guide new users toward building a meaningful library?

**Design this:**

- How do users discover books beyond direct search? Consider: curated lists, "similar to books you've read", trending/popular books, genre browsing, staff picks, "if you liked X, try Y".
- What does the onboarding experience look like for a brand-new user with an empty library? How do you make the first 5 minutes feel productive and exciting rather than empty?
- How do search results present themselves? Just a list? Cards with covers? Grouped by relevance, edition, or format?
- Is there a "browse" or "explore" mode distinct from search? What does it contain?
- How do you handle the reality that API data is imperfect — some books have great covers and descriptions, others have nothing?

**Questions to consider:**

- Should discovery be a dedicated section or woven into the main experience (e.g., suggestions on empty shelves, recommendations on the dashboard)?
- How much curation vs. personalization? Curated lists are easy to build but generic; personalized recommendations require data and algorithms.
- How do you handle the cold-start problem — recommending books when you know nothing about the user's taste?
- What's the right level of friction for adding a book? One-click add vs. "review details first"?

---

## 3. Reading Progress Tracking UX

**The problem:** Tracking reading progress sounds simple — "I'm on page 147 of 350" — but the UX has real complexity. How do users update their progress? How often? What does the interaction feel like? The progress tracking needs to be low-friction enough that users actually do it, but informative enough that the data is useful for statistics and goal tracking.

**Design this:**

- What's the primary input method for progress? Page number entry? Slider? Percentage? "Sessions" (start/end page per sitting)? Quick increment buttons (+10 pages, +25 pages)?
- Where can users update progress? Only on the book detail page? From the dashboard? From a floating widget? Via a "log reading" action?
- How is progress displayed? Progress bar? Percentage? Pages remaining? Estimated time to finish? "X% through" visual on the book cover?
- What happens at key milestones? Starting a book (0%), halfway (50%), almost done (90%), finished (100%)? Should any of these trigger special UI moments?
- How does progress data feed into statistics? Reading pace (pages per day), estimated completion date, time spent per book?

**Questions to consider:**

- How do you balance precision (exact page numbers) with convenience (quick approximate updates)?
- Should progress tracking support audiobooks or e-books where "page numbers" don't apply? How would that change the UX?
- Is there value in tracking *when* progress was updated (reading sessions over time) vs. just the current position?
- How do you make progress updates feel satisfying rather than tedious? This interaction happens frequently — it needs to spark a small moment of accomplishment.
