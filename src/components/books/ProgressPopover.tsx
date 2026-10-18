'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import type { BookItem } from '@/types/bookshelf';
import { StarRatingInput } from './StarRatingInput';

export interface ProgressPopoverProps {
  book: BookItem;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function formatRelativeTimestamp(isoString: string | null): string {
  if (!isoString) return 'Not yet recorded';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 2) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return 'Recently';
  }
}

export function ProgressPopover({
  book,
  trigger,
  isOpen: controlledIsOpen,
  onOpenChange,
  className = '',
}: ProgressPopoverProps) {
  const { updateReadingProgress, markBookFinished } = useBookshelf();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = React.useCallback(
    (next: boolean) => {
      if (onOpenChange) {
        onOpenChange(next);
      } else {
        setInternalIsOpen(next);
      }
    },
    [onOpenChange]
  );

  const hasPageCount = typeof book.pageCount === 'number' && book.pageCount > 0;
  const [mode, setMode] = useState<'page' | 'percent'>(hasPageCount ? 'page' : 'percent');
  const [inputValue, setInputValue] = useState<string>(
    hasPageCount ? String(book.currentPage ?? 0) : String(book.progressPercent ?? 0)
  );
  const [sessionNote, setSessionNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCelebration, setIsCelebration] = useState(book.progressPercent >= 100);
  const [celebrationRating, setCelebrationRating] = useState<number | null>(book.rating);
  const [celebrationNote, setCelebrationNote] = useState(book.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputId = useId();
  const errorId = useId();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync state whenever book changes or popover opens
  useEffect(() => {
    if (isOpen) {
      const isPages = hasPageCount;
      setMode(isPages ? 'page' : 'percent');
      setInputValue(
        isPages ? String(book.currentPage ?? 0) : String(book.progressPercent ?? 0)
      );
      setSessionNote('');
      setErrorMessage(null);
      setIsCelebration(book.progressPercent >= 100 && !book.isRead);
      setCelebrationRating(book.rating);
      setCelebrationNote(book.notes || '');
    }
  }, [isOpen, book, hasPageCount]);

  // Handle ESC key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const handleQuickIncrement = async (increment: number, unit: 'page' | 'percent') => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      let targetVal: number;
      if (unit === 'page') {
        const cur = book.currentPage ?? 0;
        targetVal = cur + increment;
        if (book.pageCount) {
          targetVal = Math.min(book.pageCount, targetVal);
        }
      } else {
        const cur = book.progressPercent ?? 0;
        targetVal = Math.min(100, cur + increment);
      }

      const result = await updateReadingProgress(
        book.id,
        targetVal,
        unit,
        `Quick increment +${increment}${unit === 'page' ? 'p' : '%'}`
      );

      if (result.reached100Percent) {
        setIsCelebration(true);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to quick-increment progress:', err);
      setErrorMessage('Failed to save progress update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const num = Number(inputValue);
    if (isNaN(num)) {
      setErrorMessage('Please enter a valid number.');
      return;
    }

    if (num < 0) {
      setErrorMessage('Value cannot be negative.');
      return;
    }

    if (mode === 'percent' && num > 100) {
      setErrorMessage('Percentage cannot exceed 100%.');
      return;
    }

    if (mode === 'page' && hasPageCount && book.pageCount && num > book.pageCount) {
      setErrorMessage(`Page number cannot exceed ${book.pageCount}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateReadingProgress(
        book.id,
        num,
        mode,
        sessionNote.trim() || undefined
      );

      if (result.reached100Percent) {
        setIsCelebration(true);
      } else {
        setIsOpen(false);
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
      setErrorMessage('Failed to save progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFinished = async () => {
    setIsSubmitting(true);
    try {
      await markBookFinished(book.id, celebrationRating, celebrationNote.trim() || undefined);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to mark finished:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {trigger ? (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="inline-block"
        >
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] shadow-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent)]" aria-hidden="true" />
          <span>Update Progress</span>
        </button>
      )}

      {/* Popover Card */}
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="progress-popover-title"
          className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
              <h3
                id="progress-popover-title"
                className="font-serif-heading text-sm font-bold text-[var(--color-text-primary)]"
              >
                Reading Progress
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label="Close progress popover"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Body: Celebration State OR Normal Progress State */}
          {isCelebration ? (
            /* 100% Celebration Prompt (Core #5 & Challenge #3) */
            <div className="mt-3 space-y-3.5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <Award className="h-6 w-6" aria-hidden="true" />
              </div>

              <div>
                <h4 className="font-heading text-base font-bold text-[var(--color-text-primary)]">
                  Book Completed! 🎉
                </h4>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Congratulations on finishing <strong className="font-semibold text-[var(--color-text-primary)]">&ldquo;{book.title}&rdquo;</strong>! Ready to move it to your Read shelf and rate it?
                </p>
              </div>

              {/* Star Rating Input */}
              <div className="flex flex-col items-center justify-center py-1">
                <span className="text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Rate this book:
                </span>
                <StarRatingInput
                  rating={celebrationRating}
                  onChange={setCelebrationRating}
                  size="md"
                />
              </div>

              {/* Final Note */}
              <div className="text-left">
                <label
                  htmlFor="celebration-note-input"
                  className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
                >
                  Final thoughts or key takeaways (optional):
                </label>
                <textarea
                  id="celebration-note-input"
                  rows={2}
                  value={celebrationNote}
                  onChange={(e) => setCelebrationNote(e.target.value)}
                  placeholder="What will you remember most about this book?"
                  className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCelebration(false)}
                  className="min-h-[36px] rounded-lg px-3 text-xs font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmFinished}
                  className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Mark Finished &amp; Save</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Progress Tracking State */
            <div className="mt-3 space-y-4">
              {/* Current Progress Visual Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[var(--color-text-secondary)]">
                    {hasPageCount && book.currentPage !== null
                      ? `Page ${book.currentPage} of ${book.pageCount}`
                      : `${book.progressPercent}% completed`}
                  </span>
                  <span className="font-semibold text-[var(--color-accent)]">
                    {book.progressPercent}%
                  </span>
                </div>
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
              </div>

              {/* Quick-Increment Chips */}
              <div>
                <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1.5">
                  Quick Add
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hasPageCount ? (
                    <>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickIncrement(10, 'page')}
                        className="min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        +10p
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickIncrement(25, 'page')}
                        className="min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        +25p
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickIncrement(50, 'page')}
                        className="min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        +50p
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickIncrement(10, 'percent')}
                        className="min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleQuickIncrement(25, 'percent')}
                        className="min-h-[36px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      >
                        +25%
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsCelebration(true)}
                    className="min-h-[36px] ml-auto flex items-center gap-1 rounded-lg bg-[var(--color-accent-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    <span>Finished!</span>
                  </button>
                </div>
              </div>

              {/* Exact Update Form */}
              <form onSubmit={handleExactSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={inputId}
                    className="text-xs font-medium text-[var(--color-text-secondary)]"
                  >
                    Exact {mode === 'page' ? 'Page Number' : 'Percentage'}:
                  </label>
                  {hasPageCount && (
                    <div className="flex items-center rounded-md border border-[var(--color-border-subtle)] p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('page');
                          setInputValue(String(book.currentPage ?? 0));
                        }}
                        className={`px-2 py-0.5 rounded ${
                          mode === 'page'
                            ? 'bg-[var(--color-accent)] text-white font-medium'
                            : 'text-[var(--color-text-tertiary)]'
                        }`}
                      >
                        Page
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('percent');
                          setInputValue(String(book.progressPercent ?? 0));
                        }}
                        className={`px-2 py-0.5 rounded ${
                          mode === 'percent'
                            ? 'bg-[var(--color-accent)] text-white font-medium'
                            : 'text-[var(--color-text-tertiary)]'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    id={inputId}
                    type="number"
                    min={0}
                    max={mode === 'page' && hasPageCount && book.pageCount ? book.pageCount : 100}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    aria-describedby={errorMessage ? errorId : undefined}
                    aria-invalid={Boolean(errorMessage)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-sm font-medium text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  />
                  <span className="pointer-events-none absolute right-3 top-1.5 text-xs text-[var(--color-text-tertiary)]">
                    {mode === 'page' ? (hasPageCount ? `/ ${book.pageCount}p` : 'pages') : '%'}
                  </span>
                </div>

                {errorMessage && (
                  <p id={errorId} className="text-xs font-medium text-[var(--color-error)]" role="alert">
                    {errorMessage}
                  </p>
                )}

                {/* Session Note */}
                <div>
                  <label
                    htmlFor="session-note-input"
                    className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1"
                  >
                    Session note (optional):
                  </label>
                  <input
                    id="session-note-input"
                    type="text"
                    value={sessionNote}
                    onChange={(e) => setSessionNote(e.target.value)}
                    placeholder="e.g. Chapter 4 finished, brilliant plot twist"
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  />
                </div>

                {/* Submit & Timestamp Footer */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>Updated {formatRelativeTimestamp(book.lastProgressUpdatedAt)}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex min-h-[36px] items-center gap-1 rounded-lg bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
