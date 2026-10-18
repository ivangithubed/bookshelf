# Accessibility Requirements: Bookshelf

## WCAG 2.1 AA Compliance Checklist

This checklist covers the accessibility requirements for Bookshelf. All items are required unless marked as recommended.

### Perceivable

#### Text & Color

- [ ] All text meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- [ ] Color is never the sole means of conveying information (e.g., reading progress uses bar + percentage text, not just a colored bar)
- [ ] Reading goal status (ahead/on-pace/behind) uses icons or text in addition to color
- [ ] Star ratings are conveyed with more than just color — use filled/empty shapes or provide text alternative ("3 out of 5 stars")
- [ ] Links are distinguishable from surrounding text without relying on color alone (underline or other indicator)

#### Images & Media

- [ ] All book cover images have alt text (book title + author, e.g., `alt="Cover of Dune by Frank Herbert"`)
- [ ] Missing cover placeholders have appropriate alt text describing the book, not "placeholder image"
- [ ] Decorative elements (shelf backgrounds, dividers) use `alt=""` or are CSS-only
- [ ] No images of text (use real text for all UI elements — including book titles that might appear on placeholder covers)

#### Structure

- [ ] Proper heading hierarchy (h1 for page title, h2 for shelf names, h3 for book titles within shelves — no skipped levels)
- [ ] Landmark regions used appropriately (`<nav>` for sidebar/shelves, `<main>` for library content, `<aside>` for statistics sidebar if applicable)
- [ ] Book grids use `<ul>` / `<li>` for lists of books
- [ ] Tables (if used in statistics) have proper headers and captions
- [ ] Page titles are descriptive and unique per view (e.g., "Currently Reading — Bookshelf", "Year in Review 2026 — Bookshelf")

### Operable

#### Keyboard

- [ ] All interactive elements are reachable via Tab key
- [ ] Focus order follows a logical reading sequence — sidebar nav, then main content, then secondary actions
- [ ] Focus is visible on all interactive elements (`:focus-visible` styling)
- [ ] No keyboard traps — users can always Tab away from a component
- [ ] Modal/dialog focus is trapped within the dialog and restored on close (e.g., "Add to shelf" dialog, book detail overlay)
- [ ] Custom keyboard shortcuts (if implemented) don't conflict with assistive technology
- [ ] Skip link provided to bypass sidebar navigation and jump to main library content
- [ ] Star rating is keyboard-accessible (arrow keys to change rating, Enter to confirm)

#### Navigation

- [ ] Current shelf/page is indicated in navigation (`aria-current="page"`)
- [ ] Breadcrumbs or clear location indicators provided (e.g., "Library > Currently Reading > Book Title")
- [ ] Back button / navigation works predictably — especially when navigating from shelf to book detail and back
- [ ] Multiple ways to reach a book (shelf navigation, search, library overview, direct URL)

#### Timing

- [ ] No time limits on interaction (guest session is an exception — document it)
- [ ] Animations respect `prefers-reduced-motion` media query — especially cover hover effects, progress bar fills, and page transitions
- [ ] If auto-refresh is implemented for reading stats, it doesn't disrupt the user's current position

### Understandable

#### Forms & Input

- [ ] All form fields have visible labels (not just placeholder text) — especially book search, page number input, goal input, notes textarea
- [ ] Error messages are specific and associated with the relevant field (via `aria-describedby`)
- [ ] Required fields are indicated both visually and programmatically (`aria-required`)
- [ ] Form submission errors don't clear already-entered data
- [ ] Book search provides helpful error messages ("No books found for that title. Try checking the spelling or searching by author.")
- [ ] Page number input validates range (0 to page count) with clear feedback

#### Language & Content

- [ ] Page language is set (`<html lang="en">`)
- [ ] Book descriptions from the API that may contain HTML are sanitized and rendered with proper semantic structure
- [ ] Error messages use plain language, not technical jargon ("Couldn't connect to book database" not "API request returned 503")

### Robust

#### Assistive Technology

- [ ] Valid, well-structured HTML
- [ ] ARIA attributes used correctly (roles, states, properties)
- [ ] Dynamic content changes announced via `aria-live` regions — especially: search results appearing, book added to shelf confirmation, progress update confirmation, goal completion
- [ ] Custom components (dropdowns, modals, tabs, star rating) follow ARIA authoring practices
- [ ] Book items in shelves work with screen readers — title, author, and shelf assignment are announced in a meaningful order

#### Interactive Components

- [ ] Dropdown menus (shelf selector, sort options) are keyboard accessible and announce their state (expanded/collapsed)
- [ ] Toggle buttons (dark mode, view options) announce their state (pressed/not pressed)
- [ ] Loading states are announced to screen readers ("Searching for books...", "Loading your library...")
- [ ] Bulk actions (move multiple books, delete) confirm the result to screen readers ("5 books moved to Read shelf")
- [ ] Star rating component announces current rating and allows keyboard adjustment

## Bookshelf-Specific Accessibility Considerations

### Book Cover Images

- Book covers are the primary visual element but must not be the only way to identify a book. Every book must also display its title and author as real text.
- Cover images from the API may lack alt text — generate meaningful alt text programmatically: "Cover of [Title] by [Author]"
- When covers fail to load, the placeholder must be accessible — styled text showing title and author, not just a decorative fallback

### Reading Progress

- Progress indicators (bars, percentages, rings) must convey their value to screen readers via `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` (e.g., `aria-label="Reading progress: 45% complete"`)
- Avoid communicating progress only through visual bar width — include a text percentage

### Statistics & Data Visualization

- Charts in year-in-review and statistics must have text alternatives — either a data table fallback, descriptive `aria-label`, or screen-reader-only summary text
- Don't rely on chart colors alone to distinguish genres or categories — use labels, patterns, or legends
- Interactive chart elements (hover tooltips) should have keyboard-accessible equivalents

### Star Ratings

- Implement star ratings as a radio group or slider pattern with proper ARIA
- Each star should be a clear hit target (minimum 44x44px on mobile)
- Announce the rating value: "Rating: 4 out of 5 stars"
- Allow keyboard input: arrow keys to adjust, Enter to confirm

## Recommended (Beyond AA)

These go beyond minimum compliance and signal strong accessibility awareness:

- [ ] Customizable font size for book descriptions and notes
- [ ] Customizable line height for comfortable reading
- [ ] High contrast mode option
- [ ] Reduced motion mode that eliminates all non-essential animation (cover hovers, progress fills, transitions)
- [ ] Screen reader testing with at least one of: VoiceOver (Mac), NVDA (Windows), or TalkBack (Android)
- [ ] Keyboard shortcut reference accessible via `?` key (if keyboard shortcuts are implemented)
- [ ] Focus-visible styling that integrates with the warm brand aesthetic — not just a default blue outline

## Testing

Before submission, verify:

1. Navigate the entire app using only the keyboard — add a book, update progress, rate it, browse shelves, view statistics
2. Use a screen reader to complete the core reading tracking workflow
3. Check all pages with a contrast checker tool — pay special attention to the warm color palette, which can sometimes have lower contrast than cooler palettes
4. Test with browser zoom at 200% — book grids should reflow, not overflow
5. Test with `prefers-reduced-motion: reduce` enabled
6. Run an automated audit (Lighthouse, axe, or WAVE)
