# ADR-002: Decoupled Reading Status (`isRead` / `dateFinished`) from Single-Shelf Assignment (`shelfId`)

- **Status:** Accepted
- **Date:** 2026-10-18
- **Context:** `spec/core-requirements.md` (Feature 2) requires that *"a book belongs to exactly one shelf (moving it removes it from the previous shelf)"*, while `preview.jpg` and `data/README.md` place 5 books on a custom `"Favorites"` shelf alongside `"Read"` (20), `"Want to Read"` (15), and `"Currently Reading"` (5), and track a 2026 Reading Goal of `15 / 24 books`. Furthermore, `spec/technical-requirements.md` asks what happens when a custom shelf containing books is deleted.
- **Decision:**
  1. Each `BookItem` has a single `shelfId` (satisfying strict single-shelf membership), alongside explicit `isRead: boolean` and `dateFinished: string | null` fields.
  2. Moving a book to the `"Read"` shelf sets `isRead = true`, `progressPercent = 100`, and `dateFinished` (if not already set). Moving an already-finished book to a custom shelf (e.g., `"Favorites"`) updates `shelfId` while preserving `isRead` and `dateFinished` so annual reading goals and `/year-in-review` / `/analytics` metrics remain accurate.
  3. Deleting a custom shelf never deletes user books: books on that shelf are reassigned to `"read"` (if `isRead === true`) or `"want-to-read"` (otherwise). System shelves (`currently-reading`, `want-to-read`, `read`) cannot be deleted.
- **Consequences:**
  - Resolves the specification tension between single-shelf assignment and custom shelves like `"Favorites"` without data loss or broken statistics.
