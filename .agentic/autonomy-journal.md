# Журнал Автономності та Рішень Агентів (Autonomy Journal)

## Проєкт: Bookshelf — Personal Reading Tracker
- **Дата старту:** 2026-10-18
- **Run ID:** `run-20261018-bookshelf-sdd-01`
- **Базовий коміт (Baseline Hash):** `b9b7fda5c1fa923a177ebed901fa011b521509de`

---

## 1. Зафіксовані Автономні Рішення (Agent Decisions)

| Хвиля / Модуль | Рішення | Мотивація / Альтернативи | Вплив на архітектуру |
|---|---|---|---|
| **Preflight & SDD** | Використання двошарового сховища: IndexedDB (`bookshelf_db_v1`) для книг/полиць/сесій + синхронний `localStorage` (`bookshelf_a11y_prefs_v1`) для теми та A11y | Усуває обмеження 5 МБ і блокування головного потоку `localStorage` при імпорті 500+ книг з Goodreads CSV, водночас гарантуючи 0% FOUC при першому рендері теми | Високий (`ADR-001`) |
| **Wave 0 (Data Model)** | Відокремлення `isRead` / `dateFinished` від `shelfId` (`ADR-002`) | Дозволяє книгам на кастомній полиці `"Favorites"` (як у `preview.jpg`) зберігати свій статус прочитаного для річної цілі (`15 / 24 books`) та статистики року | Високий (`ADR-002`) |
| **Wave 0 (Seed Engine)** | Детермінований розподіл 45 книг із `sample-books.json` у точній відповідності до `preview.jpg`: 5 `Currently Reading` (Project Hail Mary 65%, Educated 30%, The Name of the Wind 82%, Deep Work 15%, Circe 47%), 15 `Want to Read`, 20 `Read`, 5 `Favorites`, з яких 15 прочитані у 2026 році та 10 у 2025 році | Забезпечує 100% візуальну та числову відповідність `preview.jpg` та багаті дані для `/year-in-review`, `/analytics` і `/timeline` з першого відкриття | Середній |
| **Wave 0 (CSV & A11y)** | Двоетапний імпорт CSV (клієнтський парсер `<200ms` + фонова черга дозбагачення Open Library 1 req/s) та нативні SVG-графіки з `<details>` таблицями (`ADR-003`) | Дотримується ліміту Open Library API без блокування UI, забезпечує WCAG 2.2 AA/AAA доступність без важких сторонніх чарт-бібліотек | Високий (`ADR-003`) |

---

## 2. Втручання та Рішення Людини (Human Decisions & Overrides)

| Дата / Час | Етап / Розділ | Запит ШІ | Рішення людини |
|---|---|---|---|
| 2026-10-18 19:26 | Фаза 1 (Раунд 1 — Продукт і Scope) | Вибір архітектурного шляху, Stretch-фіч, Differentiators та мови UI | Обрано **Frontend-Only / Local-First** офіційну альтернативу; включено **всі 6 Stretch-фіч (#13–#18)** + Performance (#19); обрано **3 Differentiators (#4 Goodreads Migration Pro, #5 Reading Statistics Dashboard, #6 Accessibility-First)**; мова UI — **English (`lang="en"`)**, цільовий стан — **`local green`**. |
| 2026-10-18 19:30 | Фаза 1 (Раунд 2 — UX, UI та Дані) | Організація Year-in-Review vs Analytics Dashboard, Progress UX, Discovery Hub та правил полиць | Відхилено об'єднання на одній сторінці: затверджено **дві окремі сторінки у сайдбарі (`/year-in-review` та `/analytics`)**; затверджено Quick-Increment чіпи (`+10p`, `+25p`, `+50p`) + Popover із записом у `ReadingSessionLog`; затверджено Discovery Hub (`/discover`) та незалежне збереження `dateFinished`/`isRead` при перенесенні на кастомні полиці. |
| 2026-10-18 19:46 | Фаза 1 (Раунд 3 — Архітектура та Виконання) | Пайплайн імпорту CSV, стек графіків, маршрути `/`, `/library`, `/guest` та погодження Блоків 1–4 | Затверджено двоетапний імпорт CSV з фоновою чергою 1 req/s, стек Next.js + Tailwind v4 + IndexedDB + кастомні доступні SVG-графіки, маршрутизацію `/` (Landing), `/library` (Dashboard) та `/guest` -> `/library`. Блоки 1–4 затверджено. |
| 2026-10-18 19:56 | Перехід у Фазу 2 | Очікування контрольної фрази | Отримано `ПЛАН ЗАТВЕРДЖЕНО. ПОЧИНАЙ IMPLEMENTATION.` |

| **Wave 1A & 1B (Parallel DAG)** | Реалізація доменних сервісів (`goodreads-parser.ts`, `stats-engine.ts`, `open-library/client.ts`, `/api/books/*`, 44 unit tests) та App Shell / A11y Engine (`BookshelfContext`, `Sidebar`, `HeaderBar`, `LibrarySearchModal`, `KeyboardShortcutsModal`, `/`, `/guest`, `/accessibility`) | Ізольовані гілки `Workspace: 'branch'` на моделі `flash` із нульовим перетином файлів. **Sync Gate 1 (`typecheck + lint + test`):** `exit code 0` (44/44 тести). | Середній |
| **Wave 2A & 2B (Parallel DAG)** | Реалізація клієнтського досвіду бібліотеки (`BookCover`, `StarRatingInput`, `ProgressPopover`, `BookCard`, `BulkActionBar`, `ShelfManagerBar`, `/library`, `/shelves/[slug]`, `/books/[id]`) та модулів аналітики й імпорту (`AccessibleChartFrame`, `/discover`, `/import`, `/timeline`, `/year-in-review`, `/analytics`, `tests/e2e/bookshelf.spec.ts`, `README.md`) | Ізольовані гілки `Workspace: 'branch'` на моделі `flash`. **Sync Gate 2 (`npm run verify`):** `exit code 0` (14 маршрутів зібрано). | Середній |
| **Wave 3 (Red-Team Audit & Remediation Loop)** | Незалежний аудит (`Model: 'pro'`) за стандартом ISO/IEC 25010:2023 та 6 векторами 2026 року виявив 0 P0/P1 та 7 ергономічних/захисних покращень (`F-01`..`F-07`), а Playwright E2E виявив дубльований `<h1>` у `HeaderBar.tsx`, відсутність `id="main-content"` на `/` та потребу в статичному `public/favicon.ico` | Виконано цільову ремедіацію силами воркерів за матрицею володіння файлами. Фінальний прогін `npm run verify && npm run test:e2e` завершився з `exit code 0` (44/44 unit + 9/9 E2E, 0 Console Errors, 0 Network 404s). Фінальна оцінка аудитора: **Grade A+ (99 / 100)**. | Високий |
