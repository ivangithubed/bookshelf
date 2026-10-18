# Sample Data: Books & Edge Cases

## Files

| File | Format | Purpose |
|------|--------|---------|
| `sample-books.json` | JSON | 45 curated books in a developer-friendly format — use for seeding the guest experience |
| `sample-books.csv` | CSV | Same books in Goodreads CSV export format — use for testing Goodreads import |

Both files contain the same 45 curated books across 5 genres, plus intentional edge cases that test robust data handling.

## Curated Books (45 books across 5 genres)

### Fiction (10 books)
- The Great Gatsby, To Kill a Mockingbird, 1984, Pride and Prejudice, The Catcher in the Rye, Beloved, The Road, Normal People, A Gentleman in Moscow, Circe

### Non-Fiction (10 books)
- Sapiens, Educated, The Immortal Life of Henrietta Lacks, Thinking Fast and Slow, Born a Crime, Atomic Habits, The Body, Quiet, Range, Say Nothing

### Sci-Fi & Fantasy (10 books)
- Dune, The Left Hand of Darkness, Neuromancer, The Name of the Wind, Project Hail Mary, The Fifth Season, Piranesi, Children of Time, The Dispossessed, Ancillary Justice

### Self-Improvement (7 books)
- Deep Work, The Psychology of Money, Digital Minimalism, Four Thousand Weeks, Essentialism, Thinking in Bets, The Obstacle Is the Way

### Tech & Programming (8 books)
- The Pragmatic Programmer, Clean Code, Designing Data-Intensive Applications, A Philosophy of Software Design, Refactoring, The Mythical Man-Month, Don't Make Me Think, Eloquent JavaScript

These books are chosen because they are well-known, span a wide range of genres and reading tastes, include books that developers would recognize and relate to, and provide real cover images from Open Library for a visually compelling guest experience.

## Edge Cases

The sample data includes intentional problems that test robust book data handling. These reflect real-world issues you'll encounter building a book tracking app.

### Metadata Variations

| Edge Case | Where | What to Handle |
|-----------|-------|----------------|
| **Missing cover image** | 5 books (Piranesi, The Dispossessed, Four Thousand Weeks, Thinking in Bets, A Philosophy of Software Design) | `coverUrl` is `null` — display a styled placeholder with title and author |
| **Missing ISBN-10** | 4 books (Say Nothing, The Psychology of Money, Four Thousand Weeks, A Philosophy of Software Design) | These books only have ISBN-13 — don't require both |
| **Missing page count** | 2 books (Eloquent JavaScript, Say Nothing) | `pageCount` is `null` — reading progress tracking needs a fallback (percentage-based) |
| **Very long title** | 1 book (The Immortal Life of Henrietta Lacks) | Title wraps or truncates gracefully in shelf grids |
| **No description** | 1 book (The Mythical Man-Month) | `description` is `null` — show a graceful empty state |
| **Multiple authors** | 1 book (The Pragmatic Programmer: David Thomas, Andrew Hunt) | Handle display of co-authors |

### ISBN Variations

| Edge Case | Where | What to Handle |
|-----------|-------|----------------|
| **ISBN-13 only** | 4 books (Say Nothing, The Psychology of Money, Four Thousand Weeks, A Philosophy of Software Design) | Missing ISBN-10 — don't require both identifiers |
| **No ISBN at all** | 1 book (Eloquent JavaScript — free online edition) | Both `isbn10` and `isbn13` are `null` — handle API lookups by title/author instead |

### Goodreads CSV Edge Cases

| Edge Case | Where in CSV | What to Handle |
|-----------|--------------|----------------|
| **ISBN format wrapping** | ISBN and ISBN13 columns | Goodreads wraps ISBNs as `="0123456789"` — strip the `="` and `"` |
| **Empty date fields** | Several books | `Date Read` is empty for unfinished books — don't crash on parse |
| **Multiple shelves** | `Bookshelves` column | Some books appear on multiple Goodreads shelves (e.g., "favorites, read") — map to single Bookshelf shelf |
| **Rating of 0** | Unrated books | Goodreads uses 0 for "not rated" — don't display as 0 stars, treat as unrated |
| **Author l-f format** | `Author l-f` column | "Herbert, Frank" vs "Frank Herbert" — normalize to first-last |
| **Additional Authors** | `Additional Authors` column | "David Thomas" as additional author for Pragmatic Programmer — combine with primary author |
| **Private notes** | `Private Notes` column | May contain commas or quotes — CSV parsing must handle properly |
| **High read count** | 1 book with Read Count of 3 | Some books are re-reads — handle or note in import |
| **HTML in reviews** | `My Review` column | Some reviews contain basic HTML entities — sanitize or strip |
| **Varied date formats** | `Date Read`, `Date Added` | Goodreads uses `YYYY/MM/DD` format — some may be empty or malformed |

## Using the Sample Data

### For the Guest Experience

Use `sample-books.json` to seed the guest library. The 45 books across 5 genres provide a visually compelling first impression with real book covers, varied reading states, and pre-populated statistics.

**Recommended approach:**
1. On "Try as Guest", load the sample books into the session
2. Pre-assign books to shelves: ~15 on "Read" (with ratings and dates), ~5 on "Currently Reading" (with progress), ~15 on "Want to Read", ~5 on custom shelves ("Favorites", "Book Club")
3. Pre-populate a reading goal (e.g., "Read 24 books in 2026" with 15 completed) so the goal UI is visible
4. Pre-populate year-in-review statistics using the "Read" books — dates, genres, and page counts provide enough data for compelling charts

### For Goodreads Import Testing

Use `sample-books.csv` to test your import flow. It includes all 45 books in the Goodreads export format with the edge cases listed above. A robust import should:

- Successfully parse all 45 rows
- Handle the ISBN `="..."` format wrapping without breaking
- Map Goodreads exclusive shelves (read, to-read, currently-reading) to Bookshelf equivalents
- Import ratings (1-5) while treating 0 as "unrated"
- Import dates where available, skip gracefully where missing
- Handle additional authors by combining with the primary author
- Report results: books imported, any parsing issues encountered

### For Development & Testing

The books are all real and exist in the Open Library and Google Books databases. You can use the ISBNs to test your book API integration — search by ISBN should return matching results for most books in the sample data.

**Note:** API data for these books may differ slightly from the sample data (different cover URLs, updated descriptions, varied edition information). Your app should handle books regardless of API response variations. Don't hardcode expectations about specific metadata values.
