# Technical Requirements

This challenge supports two paths: **full-stack** (recommended) and **[frontend-only](#frontend-only-alternative)**. The sections below describe the full-stack approach. If you'd rather skip auth and database work, jump to the Frontend-Only Alternative at the bottom — it explains what changes and what stays the same.

## Database

Use a real database service — not localStorage or in-memory storage.

**Recommended options:** Supabase, Firebase, Neon, PlanetScale, Turso, or equivalent.

**Must store:**

- User accounts and authentication data
- Book library (title, author, cover URL, ISBN, page count, publish date, genres, description, publisher, source API ID)
- Shelves (name, position, is_default flag) and book-to-shelf assignments
- Reading progress per book (current page, percentage, last updated timestamp)
- Ratings and personal notes per book
- Reading goals (year, target count, completion status)
- User preferences (theme, default shelf, display settings)

**Things to think about:**

- How will you store books that come from the API? Do you cache the API response, or store a normalized version? What happens if the API data changes later (cover URL updates, description corrections)?
- What's your strategy for identifying "the same book" across different API results? A search for "Dune" might return ISBN-10, ISBN-13, and editions without any ISBN. How do you prevent duplicates in a user's library?
- How will you handle a user with 500+ books across many shelves? What indexes do you need for efficient shelf filtering, genre filtering, and sorting?
- When a shelf is deleted, what happens to its books — move to a default shelf, or delete the shelf assignment? What about a custom shelf with 50 books?
- How will you store reading progress history if you want to support statistics like "pages read per week"? A single `current_page` column won't be enough.
- What's the schema for the guest experience? Do you create temporary database records, or serve from a static JSON file?

## Authentication

Implement real user authentication — not simulated or mocked.

**Required flows:**

- Sign up (email + password minimum)
- Sign in
- Sign out
- Password reset
- Session persistence across browser refreshes

**Recommended:** Use your database provider's built-in auth (Supabase Auth, Firebase Auth) or a dedicated auth service (Clerk, Auth0, NextAuth).

**Guest mode:** Must work without authentication. Guest data is session-scoped and does not persist.

## Book Data API Integration

Book metadata comes from an external API. This is a required integration, not optional.

**Recommended APIs:**

- **Open Library API** (openlibrary.org) — Free, no API key required, extensive catalog, inconsistent data quality. Covers available via `covers.openlibrary.org`. Good default choice.
- **Google Books API** — Requires an API key (free tier), better data consistency for popular books, limited free quota. Good alternative.

**Requirements:**

- Search by title, author, or ISBN
- Fetch book details: title, author(s), cover image URL, page count, publish date, description, ISBN-10/13, publisher, genres/subjects
- Handle missing fields gracefully — many books are missing covers, page counts, or descriptions
- Handle API rate limiting — Open Library recommends max 1 request per second for sustained use. Google Books has a daily quota.
- Cache API responses where possible to reduce redundant requests and improve perceived performance
- Handle API errors (timeouts, 500s, malformed responses) without crashing the app
- Handle the book cover image pipeline — covers may be slow to load, may not exist, or may be low quality. Show placeholders appropriately.

**Data quality challenges you'll encounter:**

- Same book, multiple editions with different ISBNs, page counts, and cover images
- Author names in inconsistent formats ("J.R.R. Tolkien" vs "Tolkien, J.R.R." vs "John Ronald Reuel Tolkien")
- Missing cover images (~20-30% of books, especially older or niche titles)
- Descriptions that range from one sentence to full summaries with HTML entities
- Subject/genre data that's inconsistent and deeply nested (Open Library subjects can include everything from "Fiction" to "Accessible book")
- Some books return no results at all despite being well-known (search query sensitivity)

## Deployment

Deploy to a live, publicly accessible URL.

**Recommended platforms:** Vercel, Netlify, Render, Fly.io, or equivalent.

**Requirements:**

- Accessible via HTTPS
- No local-only dependencies (everything works for any visitor)
- Environment variables properly configured (no exposed secrets)
- API keys (if using Google Books) are not exposed to the client
- Reasonable cold start time if using serverless

## Performance Targets

| Metric | Target |
|--------|--------|
| Landing page Time to Interactive | < 2 seconds |
| Library load (after auth) | < 3 seconds |
| Book search results | < 1.5 seconds (includes API latency) |
| Library search results | < 500ms |
| Scrolling through 50+ book covers | Smooth (60fps, no jank) |
| Layout shift during load | Minimal (use skeletons/placeholders) |

### Lighthouse Benchmarks

Run Lighthouse on your deployed site. Target scores:

| Category | Target |
|----------|--------|
| Performance | > 85 |
| Accessibility | > 90 |
| Best Practices | > 90 |

Include your Lighthouse scores in your README.

## Technology Choice

This challenge is **framework-agnostic**. Use whatever you're most productive with.

**Common choices:**

- Next.js, Nuxt, SvelteKit, Remix, Astro (full-stack frameworks)
- React, Vue, Svelte, Solid (with separate backend)
- Any other approach that meets the requirements

The starter files provide CSS custom properties and a Tailwind v4 config, but neither CSS nor Tailwind is required. Use whatever styling approach you prefer.

## Frontend-Only Alternative

The sections above describe the recommended full-stack approach. If you're focused on frontend development and not ready to implement authentication and a database, you can build a frontend-only version instead. Everything below explains what changes and what stays the same.

**What replaces the database:**

Use localStorage (or IndexedDB for larger datasets) to persist all user data: book library, shelves, reading progress, goals, ratings, notes, and preferences. Be aware that localStorage has a ~5 MB limit per origin and that all data lives in a single browser — there is no cross-device sync.

**What changes in the product experience:**

- No authentication — the app is single-user with no sign-up, sign-in, or password reset flows
- No "guest mode" concept — there is just the app, and everyone who opens it is the user
- The landing page has a single CTA ("Get Started" or "Open My Library") instead of dual sign-up and guest buttons
- No cross-device sync — switching browsers or clearing storage means starting over
- Pre-loaded sample books become the default starting state rather than a guest-specific experience

**What stays the same:**

- Book API integration — still required for searching and adding books
- All shelf management, reading progress, goal tracking, and statistics features
- Deployment to a live, publicly accessible URL
- The performance targets listed above

**Tradeoff to consider:**

Both paths produce strong portfolio pieces. The full-stack version demonstrates additional skills (auth flows, database design, protected routes, data modeling), while the frontend-only version lets you focus on UI/UX craft, API integration, data visualization, state management, and frontend engineering. Choose the path that matches your current skill level and learning goals.
