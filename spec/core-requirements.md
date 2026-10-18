# Core Requirements

These features are organized into two tiers. **Core** gives you a complete, impressive product. **Stretch** takes it to the next level. The remaining features (year-in-review & reading insights, book discovery & recommendations, reading progress tracking) are design challenges where you make the product decisions — see `design-challenges.md`.

Completing Core + a design-it-yourself feature + a differentiator is a strong portfolio piece.

---

# Core

These 12 features form a complete book tracking app. A fully working product with authentication, guest access, book search, shelves, and a polished landing page.

---

## 1. Book Search & Add

Users can search for books by title, author, or ISBN and add them to their library.

**Acceptance criteria:**

- Search books using the Open Library API (or Google Books API)
- Display search results with: cover image, title, author(s), first publish year, and page count
- Handle searches that return many results — show a reasonable number (20-30) with clear indication of more available
- Handle searches that return no results — show helpful messaging ("No books found. Try a different title or check the spelling.")
- Add a book from search results to a shelf with a single action
- When adding, let the user choose which shelf to place it on (default: "Want to Read")
- Handle books with missing cover images — display a tasteful placeholder, not a broken image
- Handle books with incomplete metadata (missing page count, missing author, missing publish date)
- Prevent duplicate additions — if a book is already in the user's library, indicate that clearly

---

## 2. Shelf Management

Users organize books into customizable shelves.

**Acceptance criteria:**

- Three default shelves: "Want to Read", "Currently Reading", and "Read"
- Create custom shelves with user-defined names (e.g., "Favorites", "Book Club 2026", "Lent Out")
- Rename and delete custom shelves (default shelves cannot be deleted)
- Move a book between shelves
- A book belongs to exactly one shelf (moving it removes it from the previous shelf)
- Display book count per shelf
- View all books on a specific shelf
- Reorder shelves via drag-and-drop or manual ordering
- Empty shelf state with helpful guidance ("No books on this shelf yet. Search for books to add.")

---

## 3. Book Detail View

A dedicated view for each book in the user's library.

**Acceptance criteria:**

- Display: cover image (large), title, author(s), page count, publish year, ISBN, publisher, description
- Show which shelf the book is on, with the ability to change it
- Show reading progress if the book is on "Currently Reading" (see Feature 5)
- Show date added to library and date finished (if on "Read" shelf)
- User can add a personal rating (1-5 stars or equivalent)
- User can write and edit personal notes about the book
- Link to external sources (Open Library page, publisher site, or similar)
- Gracefully handle books with sparse metadata — don't show empty fields, adapt the layout

---

## 4. Library Overview

The main dashboard showing the user's complete library at a glance.

**Acceptance criteria:**

- Show all shelves with a preview of books on each (e.g., first 5-8 cover thumbnails per shelf)
- Display total books in library, books read this year, and current reading goal progress
- Quick access to "Currently Reading" books with progress indicators
- Sort books within a shelf by: title, author, date added, date read, rating
- Filter books across the library by genre, author, or rating
- Responsive layout that adapts shelf previews across breakpoints
- Performance: library with 100+ books should load without noticeable delay

---

## 5. Reading Progress

Track how far through a book the user has read.

**Acceptance criteria:**

- For books on "Currently Reading", track current page number
- Display progress as a visual indicator (progress bar, percentage, or equivalent)
- Update progress from the book detail view and from the library overview
- When progress reaches 100% (current page equals page count), prompt to move the book to "Read" shelf
- Handle books without a page count — allow percentage-based tracking as fallback
- Show a "last updated" timestamp for reading progress
- Progress updates should feel immediate (optimistic UI)

---

## 6. Reading Goal

Users set and track an annual reading goal.

**Acceptance criteria:**

- Set a goal for books to read in the current year (e.g., "Read 24 books in 2026")
- Display progress toward the goal: books completed vs. target
- Visual progress indicator (progress bar, ring, or equivalent)
- Show whether the user is ahead, on track, or behind pace based on current date
- "On pace" calculation: if the goal is 24 books and it's July 1st, the user should have read ~12 books
- Allow goal to be edited mid-year
- Handle the case where no goal is set — don't show broken or empty goal UI, just omit or show a CTA to set one
- Celebrate goal completion with a clear, positive visual moment (not just a number change)

---

## 7. Responsive Design

The app works well across devices.

**Acceptance criteria:**

- The layout adapts naturally across screen sizes — let your content dictate the breakpoints rather than targeting specific pixel values
- On smaller screens: single-column layout, touch-friendly tap targets, book covers sized appropriately
- On larger screens: take advantage of the space — navigation, book grids, and detail views can coexist comfortably
- No horizontal scrolling
- Navigation is accessible and usable on all screen sizes
- Book cover grids adapt fluidly — more columns on wider screens, fewer on narrow
- Reading progress and goal indicators are visible and usable on mobile

---

## 8. User Authentication

Secure, personal experience.

**Acceptance criteria:**

- Sign up with email and password
- Sign in / sign out
- Password reset flow
- Persist all user data (library, shelves, progress, goals, ratings, notes) per account
- Auth state persists across browser sessions
- Protected routes redirect unauthenticated users to sign-in
- Guest mode allows full exploration without an account (see "Try as Guest" requirements)

---

## 9. Landing Page

The first impression and entry point.

**Acceptance criteria:**

- Hero section with clear, compelling value proposition
- 3-4 feature highlights that communicate what makes Bookshelf useful
- Dual CTAs: "Sign Up" and "Try as Guest" — both prominent
- Visual showcase of the product — show book covers, shelves, or statistics to give visitors a taste
- Responsive design that works well on mobile through desktop
- Visual quality that sets the professional tone for the entire product
- Fast load time (no heavy assets blocking render)

---

## 10. "Try as Guest" Experience

Visitors can explore the full app without creating an account. This is critical for portfolio value — when a hiring manager, colleague, or community member clicks your deployed link, they're not going to create an account. Guest mode is what lets them see your work.

**Acceptance criteria:**

- Single click from landing page enters guest mode
- Library is pre-loaded with 45 curated books across 5 genres (see `data/` files)
- Books are distributed across shelves: some on "Read", some on "Currently Reading" with progress, some on "Want to Read", and some on custom shelves
- Guest sees reading goal progress, ratings, and notes on some books
- Year-in-review statistics are pre-populated with compelling data
- Guest can browse shelves, view book details, and explore statistics
- Gentle prompts to sign up to save their data (not aggressive gating)
- Guest data is session-based (not persisted across visits unless they sign up)
- Clear messaging about what signing up unlocks (persistence, custom shelves, personal data)

---

## 11. Data Persistence

All user data stored in a real database.

**Acceptance criteria:**

- Use a real database service (Supabase, Firebase, Neon, PlanetScale, etc.)
- Store: user library (books, shelves, shelf assignments), reading progress, ratings, notes, goals, preferences
- Data persists across sessions and devices for authenticated users
- Efficient queries — don't fetch the entire library when only showing one shelf
- Handle concurrent updates gracefully (multiple tabs, optimistic updates)

---

## 12. Error Handling & Edge Cases

Gracefully handle the reality of unreliable external APIs and messy data.

**Acceptance criteria:**

- Show clear error state when the book API is unavailable or slow
- Handle API rate limiting gracefully (Open Library has rate limits) — queue or throttle requests, show a helpful message
- Handle network errors during search — don't show a blank screen
- Handle books with missing ISBNs (common for older or self-published books)
- Handle multiple editions of the same book — search results may show duplicates with different covers/publishers
- Loading states for search results (skeleton screens or spinners)
- Empty states for all views (empty library, empty shelf, no search results, no reading goal)
- Error states are specific and helpful, not generic "Something went wrong" messages

---

# Stretch

These features take the product to the next level. They build on the Core foundation and are recommended for developers who want to go deeper.

---

## 13. Goodreads CSV Import

Import reading history from Goodreads.

**Acceptance criteria:**

- Upload a Goodreads CSV export file
- Parse the Goodreads CSV format (see `data/sample-books.csv` for the quirky column format)
- Show import preview: list of books to be added, with duplicates flagged
- Map Goodreads shelves to Bookshelf shelves (read → Read, to-read → Want to Read, currently-reading → Currently Reading)
- Handle custom Goodreads shelves — create matching shelves or let the user map them
- Import ratings, date read, and date added where available
- Report import results: X books added, Y duplicates skipped, Z books not found
- Handle CSV format variations (missing columns, extra whitespace, quoted fields with commas)
- Handle large imports (500+ books) without crashing or timing out

---

## 14. Search Within Library

Find books in your own collection.

**Acceptance criteria:**

- Search across titles, authors, and personal notes within the user's library
- Results update as the user types (debounced) or within 500ms of submission
- Filter library search by shelf, genre, or rating
- Show "no results" state with helpful messaging
- Search is distinct from the book discovery search (API search) — clearly differentiated in the UI
- Keyboard shortcut to focus library search (recommended: `/` or `Cmd/Ctrl + K`)

---

## 15. Dark Mode

Support light and dark color schemes.

**Acceptance criteria:**

- Detect system preference via `prefers-color-scheme` and apply automatically
- Manual toggle to override system preference
- Persist the user's choice across sessions
- All UI elements, including book cover placeholders and progress indicators, look correct in both modes
- Smooth transition between modes (no flash of wrong theme on load)
- The brand kit provides both light and dark mode tokens — use them

---

## 16. Genre Tagging

Categorize books by genre for filtering and statistics.

**Acceptance criteria:**

- Auto-populate genres from API data where available
- Allow users to add, edit, and remove genre tags on any book
- Filter the library by genre
- Show genre distribution in statistics (how many books per genre)
- Support multi-genre tagging (a book can be both "Fiction" and "Sci-Fi")
- Provide genre suggestions based on the user's existing tags (don't make them type from scratch every time)

---

## 17. Activity Timeline

A chronological record of the user's reading activity.

**Acceptance criteria:**

- Show a timeline of events: book added, book finished, progress updated, rating added, goal set/completed
- Filter timeline by event type
- Timeline entries link to the relevant book
- Show dates in a clear, readable format (relative for recent: "2 days ago", absolute for older: "March 15, 2026")
- Performance: timeline with 200+ events should load and scroll smoothly
- Useful for the guest experience — shows a realistic reading history

---

## 18. Bulk Actions

Manage multiple books efficiently.

**Acceptance criteria:**

- Select multiple books (checkboxes or selection mode)
- Move selected books to a different shelf
- Delete selected books from library
- Add a genre tag to selected books
- Clear selection with a single action
- Show count of selected items
- Confirmation dialog for destructive actions (delete)

---

## 19. Performance

The app must feel fast and responsive.

**Acceptance criteria:**

- Initial library load completes in under 3 seconds
- Book search results appear within 1 second of the API response
- Smooth scrolling through large shelves (50+ books) with no jank
- Book cover images lazy-load to avoid blocking initial render
- Library search results appear within 500ms
- Time to interactive on landing page under 2 seconds
- No layout shifts during content loading (use skeleton screens or placeholders)
- Cover images are appropriately sized — don't load full-resolution images for thumbnail views
