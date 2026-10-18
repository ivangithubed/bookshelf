# ADR-001: Local-First Dual Storage Architecture (IndexedDB + Synchronous localStorage)

- **Status:** Accepted
- **Date:** 2026-10-18
- **Context:** The project follows the official Frontend-Only / Local-First architectural path defined in `spec/technical-requirements.md#frontend-only-alternative`. However, the scope includes Differentiator #4 (Goodreads CSV Migration Pro supporting 500+ books), Stretch #17 (Activity Timeline with 200+ events), and Differentiator #5 (Daily Reading Calendar Heatmap requiring granular `ReadingSessionLog` records).
- **Decision:**
  1. Primary relational-like storage uses **IndexedDB** (`bookshelf_db_v1`) with object stores for `books`, `shelves`, `reading_sessions`, `activity_events`, and `goals`, plus a deterministic in-memory fallback for SSR and headless unit test environments.
  2. Visual & accessibility preferences (`AccessibilityPreferences`: theme, WCAG AAA high-contrast mode, font scale, line-height, `OpenDyslexic` font toggle, reduced motion override) are mirrored synchronously into **`localStorage`** (`bookshelf_a11y_prefs_v1`) and applied via an inline script in `<head>` prior to hydration.
- **Consequences:**
  - Avoids `localStorage` 5 MB quota errors and main-thread JSON serialization stalls (`INP < 200ms`) during large Goodreads CSV imports.
  - Eliminates Flash of Unstyled/Wrong Theme Content (FOUC) on initial page load.
