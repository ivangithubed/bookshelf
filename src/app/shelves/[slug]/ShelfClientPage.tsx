'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpDown,
  BookOpen,
  CheckSquare,
  ChevronRight,
  Compass,
  Filter,
  Search,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BookCard } from '@/components/books/BookCard';
import { BulkActionBar } from '@/components/books/BulkActionBar';
import { ShelfManagerBar } from '@/components/shelves/ShelfManagerBar';
import { useBookshelf } from '@/context/BookshelfContext';
import type { Shelf, SortOption } from '@/types/bookshelf';

interface ShelfClientPageProps {
  slug: string;
}

export function ShelfClientPage({ slug }: ShelfClientPageProps) {
  const {
    books,
    shelves,
    allKnownGenres,
    setSearchModalOpen,
    isLoading,
  } = useBookshelf();

  // Selected filters and sort
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [shelfSort, setShelfSort] = useState<SortOption>('recent');

  // Bulk selection mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Ref for keyboard navigation across grid items
  const gridListRef = useRef<HTMLUListElement>(null);

  const isAllShelf = slug === 'all';
  const currentShelf: Shelf | undefined = useMemo(() => {
    if (isAllShelf) {
      return {
        id: 'all',
        slug: 'all',
        name: 'All Books',
        isDefault: true,
        position: -1,
        createdAt: new Date().toISOString(),
      };
    }
    return shelves.find((s) => s.slug === slug || s.id === slug);
  }, [isAllShelf, slug, shelves]);

  // Raw books belonging to this shelf
  const rawShelfBooks = useMemo(() => {
    if (isAllShelf) return books;
    if (!currentShelf) return [];
    return books.filter((b) => b.shelfId === currentShelf.id);
  }, [isAllShelf, currentShelf, books]);

  // Filtered & sorted books
  const displayBooks = useMemo(() => {
    let result = rawShelfBooks;
    if (selectedGenre !== 'all') {
      result = result.filter(
        (b) => Array.isArray(b.genres) && b.genres.includes(selectedGenre)
      );
    }
    if (minRating !== null) {
      result = result.filter((b) => (b.rating ?? 0) >= minRating);
    }

    const copy = [...result];
    switch (shelfSort) {
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
  }, [rawShelfBooks, selectedGenre, minRating, shelfSort]);

  // Bulk actions
  const handleToggleSelect = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
  };

  const handleSelectAll = () => {
    setSelectedBookIds(displayBooks.map((b) => b.id));
  };

  const handleClearSelection = () => {
    setSelectedBookIds([]);
  };

  // Keyboard navigation across the grid items
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!gridListRef.current) return;
    const focusable = Array.from(
      gridListRef.current.querySelectorAll<HTMLElement>(
        'li a, li button, li [tabindex="0"]'
      )
    );
    if (focusable.length === 0) return;

    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = Math.min(focusable.length - 1, currentIndex + 1);
      focusable[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = Math.max(0, currentIndex - 1);
      focusable[prevIndex]?.focus();
    }
  };

  if (!currentShelf && !isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
            Shelf not found
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            The shelf you are looking for does not exist or may have been deleted.
          </p>
          <Link
            href="/library"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent-hover)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Return to Library</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  const shelfName = currentShelf?.name || 'Shelf';

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]"
        >
          <Link
            href="/library"
            className="hover:text-[var(--color-accent)] transition-colors"
          >
            Library
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span
            className="font-medium text-[var(--color-text-primary)]"
            aria-current="page"
          >
            {shelfName}
          </span>
        </nav>

        {/* Header Strip with Title, Count & Bulk Select */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {shelfName}
            </h1>
            <span className="flex h-6 items-center rounded-full bg-[var(--color-accent-subtle)] px-2.5 text-xs font-bold text-[var(--color-accent)]">
              {rawShelfBooks.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {/* Shelf Management Controls (for custom shelves) */}
        {currentShelf && !isAllShelf && (
          <ShelfManagerBar shelf={currentShelf} />
        )}

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 font-semibold text-[var(--color-text-secondary)]">
              <Filter className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
              <span>Filter:</span>
            </div>

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              aria-label="Filter shelf books by genre"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <option value="all">All Genres</option>
              {allKnownGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Rating Filter */}
            <select
              value={minRating === null ? 'all' : String(minRating)}
              onChange={(e) =>
                setMinRating(e.target.value === 'all' ? null : Number(e.target.value))
              }
              aria-label="Filter shelf books by minimum rating"
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <option value="all">All Ratings</option>
              <option value="5">★ 5 Stars only</option>
              <option value="4">★ 4+ Stars</option>
              <option value="3">★ 3+ Stars</option>
            </select>

            {(selectedGenre !== 'all' || minRating !== null) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGenre('all');
                  setMinRating(null);
                }}
                className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <label htmlFor="shelf-sort-select" className="text-[var(--color-text-secondary)]">
              Sort:
            </label>
            <select
              id="shelf-sort-select"
              value={shelfSort}
              onChange={(e) => setShelfSort(e.target.value as SortOption)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <option value="recent">Recently Updated</option>
              <option value="title">Title (A–Z)</option>
              <option value="author">Author (A–Z)</option>
              <option value="dateAdded">Date Added</option>
              <option value="dateFinished">Date Read</option>
              <option value="rating">Rating</option>
              <option value="progress">Reading Progress</option>
            </select>
          </div>
        </div>

        {/* Books Grid OR Empty Shelf State */}
        {rawShelfBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <BookOpen className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-bold text-[var(--color-text-primary)]">
              This shelf is waiting for its first book
            </h2>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Search your library or discover new titles to place on this shelf.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>Search Books</span>
              </button>
              <Link
                href="/discover"
                className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              >
                <Compass className="h-4 w-4" aria-hidden="true" />
                <span>Discover Titles</span>
              </Link>
            </div>
          </div>
        ) : displayBooks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              No books on &ldquo;{shelfName}&rdquo; match your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGenre('all');
                setMinRating(null);
              }}
              className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul
            ref={gridListRef}
            role="list"
            onKeyDown={handleGridKeyDown}
            aria-label={`Books on shelf ${shelfName}`}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {displayBooks.map((book) => (
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
        )}

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedBookIds={selectedBookIds}
          totalBooksCount={displayBooks.length}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
        />
      </div>
    </AppShell>
  );
}
