'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, Star, TrendingUp } from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import type { BookItem } from '@/types/bookshelf';
import { BookCover } from './BookCover';
import { ProgressPopover } from './ProgressPopover';

export interface BookCardProps {
  book: BookItem;
  variant?: 'grid' | 'currently-reading';
  isSelected?: boolean;
  onToggleSelect?: (bookId: string) => void;
  showSelectCheckbox?: boolean;
  className?: string;
}

export function BookCard({
  book,
  variant = 'grid',
  isSelected = false,
  onToggleSelect,
  showSelectCheckbox = false,
  className = '',
}: BookCardProps) {
  const { shelves, moveBookToShelf, updateReadingProgress } = useBookshelf();

  const primaryGenre =
    book.genres && book.genres.length > 0 ? book.genres[0] : null;

  const currentShelf = shelves.find((s) => s.id === book.shelfId);
  const hasPageCount = typeof book.pageCount === 'number' && book.pageCount > 0;

  const handleShelfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const targetShelfId = e.target.value;
    if (targetShelfId && targetShelfId !== book.shelfId) {
      void moveBookToShelf(book.id, targetShelfId);
    }
  };

  const handleQuickAdd = async (e: React.MouseEvent, amount: number, mode: 'page' | 'percent') => {
    e.preventDefault();
    e.stopPropagation();
    const curVal = mode === 'page' ? (book.currentPage ?? 0) : (book.progressPercent ?? 0);
    const maxVal = mode === 'page' && book.pageCount ? book.pageCount : 100;
    const nextVal = Math.min(maxVal, curVal + amount);
    await updateReadingProgress(
      book.id,
      nextVal,
      mode,
      `Quick increment +${amount}${mode === 'page' ? 'p' : '%'}`
    );
  };

  // -------------------------------------------------------------
  // Variant 1: Currently Reading (Horizontal Card, matching preview.jpg)
  // -------------------------------------------------------------
  if (variant === 'currently-reading') {
    return (
      <article
        className={`group relative flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-md ${className}`}
      >
        {/* Left: 2:3 Aspect Ratio Book Cover */}
        <Link
          href={`/books/${book.id}`}
          className="w-24 sm:w-28 shrink-0 overflow-hidden rounded-[var(--radius-sm)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label={`View details for ${book.title} by ${book.author}`}
        >
          <BookCover
            title={book.title}
            author={book.author}
            coverUrl={book.coverUrl}
            interactive={true}
          />
        </Link>

        {/* Right: Book Details & Reading Progress */}
        <div className="flex flex-1 flex-col justify-between self-stretch min-w-0">
          <div>
            {/* Primary Genre Pill & Shelf Tag */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {primaryGenre && (
                <span className="inline-flex items-center rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                  {primaryGenre}
                </span>
              )}
              {currentShelf && !currentShelf.isDefault && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">
                  <Bookmark className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>{currentShelf.name}</span>
                </span>
              )}
            </div>

            {/* Book Title (Lora / font-heading semibold) */}
            <h3 className="font-heading text-base sm:text-lg font-semibold tracking-tight text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors line-clamp-2">
              <Link href={`/books/${book.id}`}>{book.title}</Link>
            </h3>

            {/* Author */}
            <p className="mt-0.5 text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-1">
              {book.author}
            </p>
          </div>

          {/* Progress Section */}
          <div className="mt-4 pt-2 border-t border-[var(--color-border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)] font-medium">
                {hasPageCount && book.currentPage !== null
                  ? `Page ${book.currentPage} of ${book.pageCount}`
                  : `Progress`}
              </span>
              <span className="font-semibold text-[var(--color-accent)]">
                {book.progressPercent}%
              </span>
            </div>

            {/* Accessible Progress Bar */}
            <div
              role="progressbar"
              aria-valuenow={book.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Reading progress: ${book.progressPercent}% complete`}
              className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
            >
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                style={{ width: `${book.progressPercent}%` }}
              />
            </div>

            {/* Inline Quick-Increment Chips & Update Button */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {hasPageCount ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 10, 'page')}
                    className="min-h-[44px] sm:min-h-[36px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label={`Add 10 pages to ${book.title}`}
                  >
                    +10p
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 25, 'page')}
                    className="min-h-[44px] sm:min-h-[36px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label={`Add 25 pages to ${book.title}`}
                  >
                    +25p
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 10, 'percent')}
                    className="min-h-[44px] sm:min-h-[36px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label={`Add 10 percent to ${book.title}`}
                  >
                    +10%
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(e, 25, 'percent')}
                    className="min-h-[44px] sm:min-h-[36px] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label={`Add 25 percent to ${book.title}`}
                  >
                    +25%
                  </button>
                </>
              )}

              {/* Update Popover */}
              <ProgressPopover
                book={book}
                trigger={
                  <button
                    type="button"
                    className="min-h-[44px] sm:min-h-[36px] flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    aria-label={`Open exact progress updater for ${book.title}`}
                  >
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    <span>Update...</span>
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </article>
    );
  }

  // -------------------------------------------------------------
  // Variant 2: Grid View (following guidance/patterns.md anti-overload rule)
  // -------------------------------------------------------------
  return (
    <article
      className={`group relative flex flex-col rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2.5 sm:p-3 shadow-sm transition-all duration-200 hover:border-[var(--color-accent)] hover:shadow-md ${
        isSelected ? 'ring-2 ring-[var(--color-accent)] bg-[var(--color-accent-subtle)]/20' : ''
      } ${className}`}
    >
      {/* Selection Checkbox (for Bulk Actions) */}
      {showSelectCheckbox && onToggleSelect && (
        <label
          className="absolute top-4 left-4 z-20 flex min-h-[36px] min-w-[36px] items-center justify-center cursor-pointer rounded-md bg-[var(--color-surface)]/90 backdrop-blur-sm p-1 shadow-md hover:scale-105"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(book.id)}
            aria-label={`Select ${book.title}`}
            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] cursor-pointer"
          />
        </label>
      )}

      {/* Book Cover */}
      <Link
        href={`/books/${book.id}`}
        className="block aspect-[2/3] w-full overflow-hidden rounded-[var(--radius-sm)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        aria-label={`View details for ${book.title} by ${book.author}`}
      >
        <BookCover
          title={book.title}
          author={book.author}
          coverUrl={book.coverUrl}
          interactive={true}
        />
      </Link>

      {/* Book Metadata */}
      <div className="mt-2.5 flex flex-1 flex-col justify-between">
        <div>
          {/* Title (clamped to 2 lines with full title tooltip) */}
          <h3
            title={book.title}
            className="font-heading text-xs sm:text-sm font-semibold leading-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] line-clamp-2"
          >
            <Link href={`/books/${book.id}`}>{book.title}</Link>
          </h3>

          {/* Author */}
          <p
            title={book.author}
            className="mt-1 text-[11px] sm:text-xs text-[var(--color-text-secondary)] line-clamp-1"
          >
            {book.author}
          </p>
        </div>

        {/* Rating & Shelf Switcher Strip */}
        <div className="mt-2 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-1 text-[11px]">
          {/* Star Rating Badge if rated */}
          {book.rating !== null && book.rating > 0 ? (
            <div
              className="inline-flex items-center gap-0.5 font-semibold text-[var(--color-rating)]"
              aria-label={`Rated ${book.rating} stars`}
            >
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              <span>{book.rating}</span>
            </div>
          ) : (
            <span className="text-[var(--color-text-tertiary)]">—</span>
          )}

          {/* Quick Shelf Switcher Dropdown */}
          <select
            value={book.shelfId}
            onChange={handleShelfChange}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Change shelf for ${book.title}`}
            className="cursor-pointer rounded border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
          >
            {shelves.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reading Progress Line (if partially read) */}
        {book.progressPercent > 0 && book.progressPercent < 100 && (
          <div
            className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--color-bg-secondary)]"
            title={`Reading progress: ${book.progressPercent}%`}
          >
            <div
              className="h-full bg-[var(--color-accent)]"
              style={{ width: `${book.progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
