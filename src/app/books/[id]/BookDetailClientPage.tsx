'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  ExternalLink,
  History,
  PenSquare,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BookCover } from '@/components/books/BookCover';
import { StarRatingInput } from '@/components/books/StarRatingInput';
import { ProgressPopover } from '@/components/books/ProgressPopover';
import { useBookshelf } from '@/context/BookshelfContext';

interface BookDetailClientPageProps {
  id: string;
}

function formatDate(isoString: string | null): string | null {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function BookDetailClientPage({ id }: BookDetailClientPageProps) {
  const router = useRouter();

  const {
    books,
    shelves,
    sessions,
    moveBookToShelf,
    updateBookDetails,
    deleteBook,
    allKnownGenres,
    isLoading,
  } = useBookshelf();

  const book = useMemo(() => books.find((b) => b.id === id), [books, id]);
  const currentShelf = useMemo(
    () => (book ? shelves.find((s) => s.id === book.shelfId) : undefined),
    [book, shelves]
  );

  // Book sessions
  const bookSessions = useMemo(() => {
    if (!book) return [];
    return sessions
      .filter((s) => s.bookId === book.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [sessions, book]);

  // Notes state
  const [notes, setNotes] = useState('');
  const [isNotesDirty, setIsNotesDirty] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // New genre input state (Stretch #16)
  const [isAddingGenre, setIsAddingGenre] = useState(false);
  const [genreInputValue, setGenreInputValue] = useState('');

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (book) {
      setNotes(book.notes || '');
      setIsNotesDirty(false);
    }
  }, [book]);

  if (!book && !isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
            Book Not Found
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
            This book could not be found in your library.
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

  if (!book) {
    return (
      <AppShell>
        <div className="py-12 text-center text-xs text-[var(--color-text-tertiary)]">
          Loading book details...
        </div>
      </AppShell>
    );
  }

  // Adaptive Sparse Metadata (Core #3) items list:
  // Only render items where value is present and non-empty. Never render null or empty rows!
  const metadataItems: Array<{ label: string; value: string }> = [];

  if (typeof book.pageCount === 'number' && book.pageCount > 0) {
    metadataItems.push({ label: 'Page Count', value: `${book.pageCount} pages` });
  }
  if (book.publishedDate) {
    metadataItems.push({ label: 'Published', value: book.publishedDate });
  }
  if (book.publisher) {
    metadataItems.push({ label: 'Publisher', value: book.publisher });
  }
  if (book.isbn13) {
    metadataItems.push({ label: 'ISBN-13', value: book.isbn13 });
  }
  if (book.isbn10) {
    metadataItems.push({ label: 'ISBN-10', value: book.isbn10 });
  }
  const formattedDateAdded = formatDate(book.dateAdded);
  if (formattedDateAdded) {
    metadataItems.push({ label: 'Added to Library', value: formattedDateAdded });
  }
  const formattedDateStarted = formatDate(book.dateStarted);
  if (formattedDateStarted) {
    metadataItems.push({ label: 'Started Reading', value: formattedDateStarted });
  }
  const formattedDateFinished = formatDate(book.dateFinished);
  if (formattedDateFinished) {
    metadataItems.push({ label: 'Finished Reading', value: formattedDateFinished });
  }
  if (book.readCount > 1) {
    metadataItems.push({ label: 'Times Read', value: `${book.readCount} times` });
  }

  // Open Library external search URL
  const openLibraryUrl = book.isbn13
    ? `https://openlibrary.org/isbn/${book.isbn13}`
    : book.isbn10
    ? `https://openlibrary.org/isbn/${book.isbn10}`
    : `https://openlibrary.org/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}`;

  const handleRatingChange = async (newRating: number | null) => {
    await updateBookDetails(book.id, { rating: newRating });
  };

  const handleShelfChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetShelfId = e.target.value;
    if (targetShelfId && targetShelfId !== book.shelfId) {
      await moveBookToShelf(book.id, targetShelfId);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateBookDetails(book.id, { notes });
      setIsNotesDirty(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = genreInputValue.trim();
    if (!clean) return;

    if (!book.genres.includes(clean)) {
      const updated = [...book.genres, clean];
      await updateBookDetails(book.id, { genres: updated });
    }
    setGenreInputValue('');
    setIsAddingGenre(false);
  };

  const handleRemoveGenre = async (genreToRemove: string) => {
    const updated = book.genres.filter((g) => g !== genreToRemove);
    await updateBookDetails(book.id, { genres: updated });
  };

  const handleDeleteBook = async () => {
    setIsDeleting(true);
    try {
      await deleteBook(book.id);
      router.push('/library');
    } catch (err) {
      console.error('Failed to delete book:', err);
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-8 pb-20">
        {/* Breadcrumb Navigation & Back Link */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Breadcrumb navigation"
            className="flex items-center gap-1.5 text-xs text-[var(--color-text-tertiary)]"
          >
            <Link
              href="/library"
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Library
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            {currentShelf ? (
              <Link
                href={`/shelves/${currentShelf.slug || currentShelf.id}`}
                className="hover:text-[var(--color-accent)] transition-colors"
              >
                {currentShelf.name}
              </Link>
            ) : (
              <span>Shelves</span>
            )}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span
              className="font-medium text-[var(--color-text-primary)] line-clamp-1 max-w-[200px] sm:max-w-md"
              aria-current="page"
            >
              {book.title}
            </span>
          </nav>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back</span>
          </button>
        </div>

        {/* Primary Hero Section: Cover on Left, Header & Actions on Right */}
        <section
          aria-labelledby="book-hero-title"
          className="grid grid-cols-1 gap-6 sm:grid-cols-12 sm:gap-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm"
        >
          {/* Left Column: 2:3 Large Cover */}
          <div className="sm:col-span-4 lg:col-span-3 flex flex-col items-center sm:items-start">
            <div className="w-48 sm:w-full max-w-[240px]">
              <BookCover
                title={book.title}
                author={book.author}
                coverUrl={book.coverUrl}
                interactive={true}
                priority={true}
              />
            </div>

            {/* External Open Library Link */}
            <a
              href={openLibraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline"
            >
              <span>View on Open Library</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Right Column: Title, Author, Shelf Switcher, Rating, Delete */}
          <div className="sm:col-span-8 lg:col-span-9 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              {/* Shelf Selector & Delete Button Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                    Shelf:
                  </span>
                  <select
                    value={book.shelfId}
                    onChange={handleShelfChange}
                    aria-label={`Current shelf for ${book.title}`}
                    className="cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                  >
                    {shelves.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex min-h-[36px] items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 focus-visible:ring-2 focus-visible:ring-[var(--color-error)]"
                  aria-label={`Delete ${book.title} from library`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Delete Book</span>
                </button>
              </div>

              {/* Title (h1 in Lora) */}
              <h1
                id="book-hero-title"
                className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] leading-tight"
              >
                {book.title}
              </h1>

              {/* Author */}
              <p className="font-sans text-base sm:text-lg font-medium text-[var(--color-text-secondary)]">
                by {book.author}
              </p>

              {/* Star Rating Section */}
              <div className="pt-2">
                <span className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Your Rating
                </span>
                <StarRatingInput
                  rating={book.rating}
                  onChange={handleRatingChange}
                  size="lg"
                  showSummary={true}
                />
              </div>
            </div>

            {/* Reading Progress Block (Core #5) */}
            <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    Reading Progress
                  </span>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {book.pageCount && book.currentPage !== null
                      ? `Page ${book.currentPage} of ${book.pageCount}`
                      : `${book.progressPercent}% completed`}
                  </p>
                </div>

                <ProgressPopover book={book} />
              </div>

              {/* Progress bar */}
              <div
                role="progressbar"
                aria-valuenow={book.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Reading progress: ${book.progressPercent}%`}
                className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]"
              >
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                  style={{ width: `${book.progressPercent}%` }}
                />
              </div>
            </div>

            {/* Multi-Genre Tagging (Stretch #16) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Genres &amp; Tags
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {book.genres.map((genre) => (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)]"
                  >
                    <Tag className="h-3 w-3 text-[var(--color-accent)]" aria-hidden="true" />
                    <span>{genre}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGenre(genre)}
                      className="ml-0.5 rounded-full p-0.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
                      aria-label={`Remove genre ${genre}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}

                {isAddingGenre ? (
                  <form onSubmit={handleAddGenre} className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      list="known-genres-detail"
                      value={genreInputValue}
                      onChange={(e) => setGenreInputValue(e.target.value)}
                      placeholder="Add genre..."
                      autoFocus
                      className="h-7 w-28 rounded-md border border-[var(--color-accent)] bg-[var(--color-surface)] px-2 text-xs text-[var(--color-text-primary)] focus:outline-none"
                    />
                    <datalist id="known-genres-detail">
                      {allKnownGenres.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <button
                      type="submit"
                      disabled={!genreInputValue.trim()}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
                      aria-label="Confirm add genre"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGenreInputValue('');
                        setIsAddingGenre(false);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]"
                      aria-label="Cancel adding genre"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingGenre(true)}
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-dashed border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    <span>Add Tag</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Adaptive Sparse Metadata Grid (Core #3) */}
        {metadataItems.length > 0 && (
          <section
            aria-labelledby="book-metadata-heading"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
          >
            <h2
              id="book-metadata-heading"
              className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-4"
            >
              Book Information
            </h2>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
              {metadataItems.map((item) => (
                <div key={item.label} className="border-b border-[var(--color-border-subtle)] pb-2">
                  <dt className="text-xs font-medium text-[var(--color-text-tertiary)]">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Book Description (rendered with .reading-prose so A11y preferences apply live) */}
        {book.description && (
          <section
            aria-labelledby="book-description-heading"
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
          >
            <h2
              id="book-description-heading"
              className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-3"
            >
              Overview &amp; Synopsis
            </h2>
            <div className="reading-prose text-[var(--color-text-secondary)] leading-relaxed">
              <p>{book.description}</p>
            </div>
          </section>
        )}

        {/* Personal Notes (rendered with .reading-prose) */}
        <section
          aria-labelledby="book-notes-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2
              id="book-notes-heading"
              className="font-heading text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2"
            >
              <PenSquare className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
              <span>Personal Notes &amp; Reflections</span>
            </h2>

            {isNotesDirty && (
              <button
                type="button"
                disabled={isSavingNotes}
                onClick={handleSaveNotes}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save Notes</span>
              </button>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-tertiary)]">
            These notes adapt live to your typography preferences (font size, line height, and dyslexia-friendly font).
          </p>

          <textarea
            rows={5}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setIsNotesDirty(true);
            }}
            placeholder="Write personal reflections, quotes, thoughts, or review notes here..."
            className="reading-prose w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4 text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Personal reading notes"
          />
        </section>

        {/* Reading Session History Log (Core #5) */}
        <section
          aria-labelledby="book-history-heading"
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
            <h2
              id="book-history-heading"
              className="font-heading text-lg font-bold text-[var(--color-text-primary)]"
            >
              Reading Session History ({bookSessions.length})
            </h2>
          </div>

          {bookSessions.length > 0 ? (
            <ul role="list" className="divide-y divide-[var(--color-border-subtle)]">
              {bookSessions.map((session) => (
                <li key={session.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[var(--color-text-primary)]">
                        {session.pagesDelta > 0
                          ? `+${session.pagesDelta} pages read`
                          : `Progress set to ${session.newPercent}%`}
                      </span>
                      {session.newPage && (
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">
                          (Reached page {session.newPage})
                        </span>
                      )}
                    </div>
                    {session.note && (
                      <p className="text-xs text-[var(--color-text-secondary)] italic">
                        &ldquo;{session.note}&rdquo;
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] text-[var(--color-text-tertiary)]">
                    {formatDate(session.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--color-text-tertiary)]">
              No individual reading sessions logged yet. Use the progress updater above to record your daily reading.
            </p>
          )}
        </section>

        {/* Delete Book Confirmation Modal */}
        {isDeleteModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-book-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
          >
            <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-[var(--color-error)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3
                  id="delete-book-modal-title"
                  className="font-heading text-lg font-bold text-[var(--color-text-primary)]"
                >
                  Delete &ldquo;{book.title}&rdquo;?
                </h3>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Are you sure you want to permanently remove <strong className="text-[var(--color-text-primary)]">{book.title}</strong> from your library? All reading history, progress, and personal notes will be deleted.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="min-h-[44px] rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteBook}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--color-error)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-error)] disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  <span>Delete Book</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
