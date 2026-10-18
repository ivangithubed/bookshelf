# ADR-003: Two-Stage Goodreads CSV Migration & Accessible Native SVG Visualizations

- **Status:** Accepted
- **Date:** 2026-10-18
- **Context:** Open Library enforces a sustained rate limit of 1 request/second (`spec/technical-requirements.md`), which would block a 500-book Goodreads CSV import for over 8 minutes if executed synchronously. Additionally, `guidance/accessibility.md` and Differentiator #6 require WCAG 2.2 AA/AAA compliance and full screen-reader / keyboard accessibility for all charts in `/year-in-review` and `/analytics`.
- **Decision:**
  1. **Two-Stage CSV Import:** Stage 1 parses the Goodreads CSV on the client in `< 200ms` (stripping `="ISBN"`, normalizing `Author l-f` + `Additional Authors`, treating `Rating: 0` as unrated `null`, sanitizing HTML in reviews) and presents an interactive conflict resolution preview (*Keep Existing / Replace / Skip*) before committing to IndexedDB. Stage 2 provides an optional, cancellable background enrichment queue (`1 req/s` via `/api/books/enrich`) for records missing cover images or descriptions.
  2. **Accessible Native SVG Charts:** All visualizations in `/year-in-review` and `/analytics` are built as zero-dependency semantic SVG components paired with `<details><summary>View accessible data table</summary><table>...</table></details>` fallbacks and descriptive ARIA summaries.
- **Consequences:**
  - Instant CSV import UX with full user control over network enrichment.
  - Zero third-party charting bundle bloat, zero SSR hydration mismatches, and guaranteed screen-reader accessibility.
