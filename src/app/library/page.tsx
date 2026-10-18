'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Compass,
  Filter,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BookCard } from '@/components/books/BookCard';
import { BulkActionBar } from '@/components/books/BulkActionBar';
import { useBookshelf } from '@/context/BookshelfContext';
import { calculateReadingGoalProgress } from '@/lib/stats/stats-engine';
import type { BookItem, SortOption } from '@/types/bookshelf';

export default function LibraryPage() {
  const {
    books,
    shelves,
    currentYearGoal,
    booksReadIn2026Count,
    allKnownGenres,
    setSearchModalOpen,
    resetDemoLibrary,
    isLoading,
  } = useBookshelf();

  // State for Currently Reading Section sort
  const [currentlyReadingSort, setCurrentlyReadingSort] = useState<
    'recent' | 'title' | 'author' | 'progress'
  >('recent');

  // Filter & Sort Toolbar State
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [librarySort, setLibrarySort] = useState<SortOption>('recent');

  // Bulk Selection State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Unique authors across library
  const allAuthors = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) {
      if (b.author) set.add(b.author.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [books]);

  // Goal Progress metrics
  const goalProgress = useMemo(() => {
    return calculateReadingGoalProgress(books, currentYearGoal);
  }, [books, currentYearGoal]);

  // Filter Active Check
  const isFilterActive =
    selectedGenre !== 'all' || selectedAuthor !== 'all' || minRating !== null;

  // Sorting function helper
  const sortBooks = (list: BookItem[], option: SortOption): BookItem[] => {
    const copy = [...list];
    switch (option) {
      case 'title':
        return copy.sort((a, b) => a.title.localeCompare(b.title));
      case 'author':
        return copy.sort((a, b) => a.author.localeCompare(b.author));
      case 'progress':
        return copy.sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0));
      case 'rating':
        return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'dateFinished':
        return copy.sort((a, b) =>
          (b.dateFinished ?? '').localeCompare(a.dateFinished ?? '')
        );
      case 'dateAdded':
      case 'recent':
      default:
        return copy.sort((a, b) =>
          (b.lastProgressUpdatedAt || b.dateAdded).localeCompare(
            a.lastProgressUpdatedAt || a.dateAdded
          )
        );
    }
  };

  // Currently Reading books
  const currentlyReadingBooks = useMemo(() => {
    const reading = books.filter((b) => b.shelfId === 'currently-reading');
    return sortBooks(reading, currentlyReadingSort);
  }, [books, currentlyReadingSort]);

  // Filtered books for library overview
  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedGenre !== 'all') {
      result = result.filter(
        (b) => Array.isArray(b.genres) && b.genres.includes(selectedGenre)
      );
    }
    if (selectedAuthor !== 'all') {
      result = result.filter((b) => b.author === selectedAuthor);
    }
    if (minRating !== null) {
      result = result.filter((b) => (b.rating ?? 0) >= minRating);
    }
    return sortBooks(result, librarySort);
  }, [books, selectedGenre, selectedAuthor, minRating, librarySort]);

  // Bulk selection toggles
  const handleToggleSelect = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    const targetBooks = isFilterActive ? filteredBooks : books;
    setSelectedBookIds(targetBooks.map((b) => b.id));
  };

  const handleClearSelection = () => {
    setSelectedBookIds([]);
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-16">
        {/* Top Summary & Quick Actions Strip */}
        <section
          aria-labelledby="library-summary-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 shadow-sm"
        >
          <h2 id="library-summary-heading" className="sr-only">
            Library Overview &amp; Reading Goals Summary
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
            {/* Metric 1: Total Books */}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Total in Library
              </span>
              <span className="font-heading text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                {books.length}
              </span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                across {shelves.length} shelves
              </span>
            </div>

            {/* Metric 2: Read in 2026 */}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Books Read in 2026
              </span>
              <span className="font-heading text-2xl sm:text-3xl font-bold text-[var(--color-accent)]">
                {booksReadIn2026Count}
              </span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                completed this year
              </span>
            </div>

            {/* Metric 3: Reading Goal Progress */}
            <div className="flex flex-col col-span-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  2026 Reading Goal
                </span>
                {goalProgress && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      goalProgress.paceStatus === 'ahead'
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : goalProgress.paceStatus === 'behind'
                        ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                        : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                    }`}
                  >
                    {goalProgress.paceStatus === 'ahead' ? (
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    ) : goalProgress.paceStatus === 'behind' ? (
                      <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span>{goalProgress.paceMessage}</span>
                  </span>
                )}
              </div>

              {goalProgress ? (
                <>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-heading text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                      {goalProgress.completedBooks} / {goalProgress.targetBooks}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-accent)]">
                      {goalProgress.percentComplete}%
                    </span>
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={goalProgress.percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`2026 Goal Progress: ${goalProgress.percentComplete}%`}
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                      style={{ width: `${goalProgress.percentComplete}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                  No 2026 goal configured yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Search Library (⌘K)</span>
              </button>

              <Link
                href="/discover"
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Discover Books</span>
              </Link>

              <Link
                href="/import"
                className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                <span>Import CSV</span>
              </Link>
            </div>

            {/* Bulk Selection Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsBulkMode(!isBulkMode);
                if (isBulkMode) setSelectedBookIds([]);
              }}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${
                isBulkMode
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <CheckSquare className="h-4 w-4" aria-hidden="true" />
              <span>{isBulkMode ? 'Done Selecting' : 'Bulk Select'}</span>
            </button>
          </div>
        </section>

        {/* Empty Library State (if user cleared all books) */}
        {books.length === 0 && !isLoading ? (
          <section
            aria-labelledby="empty-library-heading"
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <BookOpen className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 id="empty-library-heading" className="mt-4 font-heading text-xl font-bold text-[var(--color-text-primary)]">
              Your library is waiting for its first story
            </h2>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Start building your personal sanctuary of reading. You can restore our curated 45-book classic and modern collection or discover books from Open Library.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetDemoLibrary}
                className="flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Restore 45 Curated Demo Books</span>
              </button>
              <Link
                href="/discover"
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Browse Book Discovery</span>
              </Link>
            </div>
          </section>
        ) : (
          <>
            {/* Priority Section 1: Currently Reading (Horizontal Cards matching preview.jpg) */}
            <section
              aria-labelledby="currently-reading-heading"
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <h2
                    id="currently-reading-heading"
                    className="font-heading text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl"
                  >
                    Currently Reading
                  </h2>
                  <span className="flex h-6 items-center rounded-full bg-[var(--color-accent-subtle)] px-2.5 text-xs font-semibold text-[var(--color-accent)]">
                    {currentlyReadingBooks.length}
                  </span>
                </div>

                {/* Sort Dropdown for Currently Reading */}
                {currentlyReadingBooks.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
                    <label htmlFor="cr-sort-select" className="text-[var(--color-text-secondary)]">
                      Sort by:
                    </label>
                    <select
                      id="cr-sort-select"
                      value={currentlyReadingSort}
                      onChange={(e) =>
                        setCurrentlyReadingSort(
                          e.target.value as 'recent' | 'title' | 'author' | 'progress'
                        )
                      }
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    >
                      <option value="recent">Recent Activity</option>
                      <option value="progress">Highest Progress</option>
                      <option value="title">Title</option>
                      <option value="author">Author</option>
                    </select>
                  </div>
                )}
              </div>

              {currentlyReadingBooks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentlyReadingBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      variant="currently-reading"
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 text-center">
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    You don&rsquo;t have any books marked as Currently Reading right now.
                  </p>
                  <Link
                    href="/shelves/want-to-read"
                    className="mt-2 inline-flex text-xs font-semibold text-[var(--color-accent)] hover:underline"
                  >
                    Pick a book from &ldquo;Want to Read&rdquo; &rarr;
                  </Link>
                </div>
              )}
            </section>

            {/* Filter & Sort Toolbar for Library Overview */}
            <section
              aria-label="Library filters and sorting toolbar"
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:px-4 sm:py-3 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-[var(--color-text-secondary)]">
                    <Filter className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
                    <span>Filter:</span>
                  </div>

                  {/* Genre Filter */}
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    aria-label="Filter books by genre"
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <option value="all">All Genres</option>
                    {allKnownGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>

                  {/* Author Filter */}
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    aria-label="Filter books by author"
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <option value="all">All Authors</option>
                    {allAuthors.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>

                  {/* Rating Filter */}
                  <select
                    value={minRating === null ? 'all' : String(minRating)}
                    onChange={(e) =>
                      setMinRating(e.target.value === 'all' ? null : Number(e.target.value))
                    }
                    aria-label="Filter books by minimum rating"
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">★ 5 Stars only</option>
                    <option value="4">★ 4+ Stars</option>
                    <option value="3">★ 3+ Stars</option>
                  </select>

                  {/* Clear Filters */}
                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGenre('all');
                        setSelectedAuthor('all');
                        setMinRating(null);
                      }}
                      className="rounded px-2 py-1 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      Reset filters
                    </button>
                  )}
                </div>

                {/* Sort selector for overview */}
                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
                  <label htmlFor="lib-sort-select" className="text-[var(--color-text-secondary)]">
                    Sort:
                  </label>
                  <select
                    id="lib-sort-select"
                    value={librarySort}
                    onChange={(e) => setLibrarySort(e.target.value as SortOption)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <option value="recent">Recently Updated</option>
                    <option value="title">Title (A–Z)</option>
                    <option value="author">Author (A–Z)</option>
                    <option value="dateAdded">Date Added</option>
                    <option value="dateFinished">Date Read</option>
                    <option value="rating">Rating</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Filtered View Results OR Shelf Previews */}
            {isFilterActive ? (
              /* When filters are active: Show comprehensive filtered grid */
              <section aria-label="Filtered books list" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
                    Filtered Books ({filteredBooks.length})
                  </h2>
                </div>

                {filteredBooks.length > 0 ? (
                  <ul
                    role="list"
                    className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                  >
                    {filteredBooks.map((book) => (
                      <li key={book.id}>
                        <BookCard
                          book={book}
                          variant="grid"
                          isSelected={selectedBookIds.includes(book.id)}
                          onToggleSelect={handleToggleSelect}
                          showSelectCheckbox={isBulkMode}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                      No books match the selected filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGenre('all');
                        setSelectedAuthor('all');
                        setMinRating(null);
                      }}
                      className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </section>
            ) : (
              /* When no filters active: Show sensory Shelf Previews */
              <div className="space-y-10">
                {shelves.map((shelf) => {
                  const shelfBooks = sortBooks(
                    books.filter((b) => b.shelfId === shelf.id),
                    'recent'
                  );
                  const previewBooks = shelfBooks.slice(0, 6);

                  return (
                    <section
                      key={shelf.id}
                      aria-labelledby={`shelf-heading-${shelf.id}`}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2
                            id={`shelf-heading-${shelf.id}`}
                            className="font-heading text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]"
                          >
                            {shelf.name}
                          </h2>
                          <span className="flex h-5 items-center rounded-full bg-[var(--color-bg-secondary)] px-2 text-[11px] font-semibold text-[var(--color-text-secondary)]">
                            {shelfBooks.length}
                          </span>
                        </div>

                        {shelfBooks.length > 0 && (
                          <Link
                            href={`/shelves/${shelf.slug || shelf.id}`}
                            className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                          >
                            See all {shelfBooks.length} books &rarr;
                          </Link>
                        )}
                      </div>

                      {previewBooks.length > 0 ? (
                        <ul
                          role="list"
                          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                        >
                          {previewBooks.map((book) => (
                            <li key={book.id}>
                              <BookCard
                                book={book}
                                variant="grid"
                                isSelected={selectedBookIds.includes(book.id)}
                                onToggleSelect={handleToggleSelect}
                                showSelectCheckbox={isBulkMode}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="rounded-xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface)]/60 p-4 text-xs text-[var(--color-text-tertiary)]">
                          No books on this shelf yet.{' '}
                          <Link
                            href="/discover"
                            className="font-medium text-[var(--color-accent)] hover:underline"
                          >
                            Discover books to add &rarr;
                          </Link>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Floating Bulk Action Bar */}
        <BulkActionBar
          selectedBookIds={selectedBookIds}
          totalBooksCount={isFilterActive ? filteredBooks.length : books.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
        />
      </div>
    </AppShell>
  );
}
