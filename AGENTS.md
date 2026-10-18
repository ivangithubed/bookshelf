# AGENTS.md — Bookshelf (Personal Reading Tracker)

Bookshelf is a **Product Challenge** on [Frontend Mentor](https://www.frontendmentor.io): a personal reading tracker with warm literary aesthetics (`Lora` + `Inter`), shelf organization, reading progress tracking, annual reading goals, Open Library API discovery, Goodreads CSV migration (**Differentiator #4**), narrative `/year-in-review` + deep `/analytics` dashboard (**Differentiator #5**), and WCAG 2.2 AA/AAA Accessibility-First controls (**Differentiator #6**).

---

## 1. Tech Stack & Architecture
- **Runtime:** Node.js 24+ / Browser (Local-First)
- **Language:** TypeScript 5+ (`strict: true`, zero explicit `any`)
- **Framework:** Next.js (App Router, React 19)
- **Styling:** Tailwind CSS v4 + CSS Custom Properties (`src/styles/tokens.css`, `src/styles/tailwind.css`)
- **Storage:** IndexedDB (`bookshelf_db_v1` via `src/lib/db/indexed-db.ts`) + synchronous `localStorage` (`bookshelf_a11y_prefs_v1`) for FOUC-free theme & accessibility preferences
- **Package Manager:** `npm`

---

## 2. Deterministic Quality Gates & Commands
- `npm run dev` — start local Next.js development server
- `npm run typecheck` — strict TypeScript check (`tsc --noEmit`)
- `npm run lint` — static code analysis (`eslint`)
- `npm run test` — unit & integration tests (`vitest run`)
- `npm run build` — production build verification (`next build`)
- `npm run test:e2e` — Playwright E2E + Browser Console/Network Zero-404 smoke verification
- `npm run verify` — unified deterministic gate (`npm run typecheck && npm run lint && npm run test && npm run build`)

---

## 3. Specs & Guidance Reference
| File | Contents |
|------|----------|
| `spec/product-definition.md` | What, who, why |
| `spec/core-requirements.md` | 12 Core + 7 Stretch features with acceptance criteria |
| `spec/design-challenges.md` | 3 design-it-yourself features (Year-in-Review, Discovery, Progress UX) |
| `spec/technical-requirements.md` | Frontend-Only / Local-First architecture, Open Library API, performance targets |
| `spec/differentiators.md` | Chosen differentiators: #4 Goodreads Migration Pro, #5 Statistics Dashboard, #6 Accessibility-First |
| `guidance/brand-kit.md` | Colors, typography (`Lora` + `Inter`), spacing, shadows |
| `guidance/patterns.md` | UI/UX do's and don'ts |
| `guidance/accessibility.md` | WCAG 2.2 AA/AAA checklist |
| `data/README.md` | 45 curated books (`sample-books.json` / `sample-books.csv`) and intentional edge cases |

---

## 4. Multi-Agent Guardrails & Invariants
1. **Zero `any` & Strict Contracts:** Shared interfaces live in `src/types/bookshelf.ts`.
2. **Handoff & File Ownership:** Subagents must only write to files within their assigned `allowed_write_patterns` in `.agentic/specs/dag-spec.json`.
3. **Model Routing:** `Model: 'pro'` for Wave 0 and Wave 3 (Red-Team Audit); `Model: 'flash'` for Wave 1..2 domain workers in `Workspace: 'branch'`.
4. **Browser Support Policy:** Assume Baseline Widely Available web features; provide accessible `<details>` tabular fallbacks for all SVG charts and respect `prefers-reduced-motion` across all animations.
