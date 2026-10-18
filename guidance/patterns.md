# UI/UX Patterns: Bookshelf

## Patterns to Follow

### Book Cover Display

- Book covers are the primary visual element — give them generous size and consistent aspect ratios (standard book ratio is approximately 2:3)
- Display covers with a subtle shadow to create depth and a "standing on shelf" feel
- Use consistent cover sizes within a view — don't mix thumbnail and large sizes in the same grid
- When a cover is missing, show a styled placeholder with the book title and author in brand typography — never show a broken image icon or generic "no image" graphic
- On hover, elevate the cover slightly (shadow + subtle scale) to create a tactile, physical sensation
- Cover images should lazy-load with a subtle fade-in, not pop in abruptly

### Book Metadata Hierarchy

- Title is always the most prominent element (largest, boldest)
- Author comes second — visible but de-emphasized relative to the title
- Metadata (page count, publish year, genre tags) is tertiary — small, muted, and not competing for attention
- Don't show all metadata everywhere — a shelf grid only needs cover + title + author; save page count, ISBN, and publisher for the detail view
- Ratings (stars or equivalent) should be visually warm and distinct — use the gold `--color-rating` token

### Navigation & Information Architecture

- Primary navigation in a sidebar (desktop) listing shelves, with quick access to search, statistics, and goals
- Shelves are the primary organizational metaphor — they should be prominently listed in navigation with book counts
- "Currently Reading" should feel like a priority section — it's what the user cares about most on each visit
- Current location should be obvious at all times (active state in nav, page title)
- Collapsible sidebar to maximize library browsing area when desired
- Mobile: bottom bar or hamburger navigation — shelves accessible within one tap

### Loading & Empty States

- Skeleton screens for book grids — use cover-shaped rectangles with the right aspect ratio (2:3)
- Spinner or progress indicator for book search (API calls take 1-2 seconds)
- Empty shelf states should be warm and inviting: "This shelf is waiting for its first book. Search to add one." — not cold or clinical
- Empty library (new user) should feel like an exciting beginning, not an empty void
- Error states should be specific: "Couldn't load cover image for this book" not "Something went wrong"

### Search

- Book search (API) should be prominently accessible — a search bar in the header or a prominent search action
- Search results should show cover thumbnails, title, author, and year — enough to identify the right edition
- Results should indicate if a book is already in the user's library ("In your library" badge or similar)
- Library search (within own books) should be fast and incremental — results filter as the user types
- "No results" should suggest alternatives ("Try searching by author name instead" or "Check the spelling")

### Reading Progress

- Progress should be visible at a glance on "Currently Reading" books — a progress bar on the cover, a percentage badge, or similar
- Updating progress should be low-friction — ideally achievable without navigating to the book detail page
- The transition from "Currently Reading" to "Read" (100% progress) should feel like a moment of accomplishment
- Progress bars should use a warm accent color and feel smooth (animated fills, not instant jumps)

### Responsive Behavior

- Book grids should be fluid — more columns on wider screens, fewer on narrow, with consistent gaps
- Sidebar collapses to overlay or bottom nav on mobile
- Book detail view should be full-width on mobile with comfortable margins and large cover image
- Touch targets minimum 44x44px on mobile — this applies to shelf actions, rating stars, and progress controls
- Cover sizes should scale down gracefully on mobile — don't show tiny, unreadable covers

## Anti-Patterns to Avoid

### Information Overload

- Don't show ISBN, publisher, and full description on every book in a shelf grid — keep grid items lean (cover + title + author)
- Don't display more than 2-3 pieces of metadata alongside a book in list view
- Don't use more than 2 font sizes in a single book card
- Don't overwhelm the library overview with every shelf expanded — show previews with "See all" actions

### Aggressive UI

- Don't gate guest features behind sign-up prompts — let guests explore freely, prompt gently
- Don't use modals for routine actions (adding a book to a shelf, updating progress)
- Don't auto-play animations or transitions that distract from browsing
- Don't show "upgrade" or "sign up" banners that cover book content
- Don't punish users who haven't set a reading goal — the goalless experience should still be complete

### Layout Pitfalls

- Don't force a fixed sidebar on mobile — it consumes too much screen real estate
- Don't use horizontal scrolling for shelf contents on mobile (vertical scroll with grid is more natural)
- Don't mix book cover orientations (portrait and landscape) in the same grid — standardize on portrait (2:3 ratio)
- Don't let book grids stretch to full page width on ultrawide screens — constrain to a comfortable width
- Don't show a single column of books on tablet — 2-3 columns is more engaging

### Performance

- Don't load all book covers on initial render — lazy-load below the fold
- Don't fetch full-resolution cover images for thumbnail views — use smaller API image sizes where available
- Don't re-fetch the book API on every navigation — cache library data aggressively
- Don't block the UI while API search is running — show a loading indicator and keep the interface responsive
- Don't render 100+ books simultaneously — virtualize or paginate long shelf views

### Error Handling

- Don't show raw API error responses to users
- Don't silently fail when a book cover can't be loaded — show the styled placeholder
- Don't treat all API errors the same — a rate limit (429) is different from a network error is different from "no results found"
- Don't let a single broken book (bad data) crash the entire shelf view — handle per-book errors gracefully
