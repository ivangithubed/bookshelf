'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  BookOpen,
  Check,
  Plus,
  ExternalLink,
  AlertCircle,
  Compass,
  Bookmark,
  Layers,
  Clock,
  Tag,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useBookshelf } from '@/context/BookshelfContext';
import {
  CURATED_DISCOVERY_COLLECTIONS,
  buildPersonalizedRecommendations,
  searchOpenLibraryBooks,
} from '@/lib/open-library/client';
import type { OpenLibraryBookCandidate, BookItem } from '@/types/bookshelf';

export default function DiscoverPage() {
  const { books, shelves, addBookToLibrary } = useBookshelf();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OpenLibraryBookCandidate[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [activeCollectionId, setActiveCollectionId] = useState<string>(
    CURATED_DISCOVERY_COLLECTIONS[0]?.id || 'staff-picks'
  );
  const [selectedShelfMap, setSelectedShelfMap] = useState<Record<string, string>>({});
  const [addingBookKey, setAddingBookKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Helper to check if candidate is already in user's library
  const getExistingBook = useMemo(() => {
    return (candidate: OpenLibraryBookCandidate): BookItem | undefined => {
      return books.find((b) => {
        if (candidate.isbn13 && b.isbn13 && candidate.isbn13 === b.isbn13) return true;
        if (candidate.isbn10 && b.isbn10 && candidate.isbn10 === b.isbn10) return true;
        const normTitleCand = candidate.title.trim().toLowerCase();
        const normTitleB = b.title.trim().toLowerCase();
        const normAuthorCand = candidate.author.trim().toLowerCase();
        const normAuthorB = b.author.trim().toLowerCase();
        return normTitleCand === normTitleB && normAuthorCand === normAuthorB;
      });
    };
  }, [books]);

  // Debounce search query input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      setIsOfflineFallback(false);
      return;
    }

    let active = true;
    setIsSearching(true);
    setSearchError(null);

    searchOpenLibraryBooks(debouncedQuery)
      .then((res) => {
        if (!active) return;
        startTransition(() => {
          setSearchResults(res.items);
          setIsOfflineFallback(Boolean(res.cached || res.rateLimited));
          setIsSearching(false);
        });
      })
      .catch((err: Error) => {
        if (!active) return;
        setSearchError(err.message || 'Failed to search Open Library.');
        setIsSearching(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  // Personalized recommendations
  const personalizedLanes = useMemo(() => {
    return buildPersonalizedRecommendations(books);
  }, [books]);

  // Handle adding book to library with shelf picker
  const handleAdd = async (candidate: OpenLibraryBookCandidate) => {
    const candidateKey = candidate.isbn13 || candidate.workKey || candidate.title;
    const targetShelf = selectedShelfMap[candidateKey] || 'want-to-read';
    setAddingBookKey(candidateKey);
    try {
      await addBookToLibrary(candidate, targetShelf);
    } finally {
      setAddingBookKey(null);
    }
  };

  const handleShelfChange = (candidateKey: string, shelfId: string) => {
    setSelectedShelfMap((prev) => ({ ...prev, [candidateKey]: shelfId }));
  };

  return (
    <AppShell>
      <div className="space-y-10 pb-12">
        {/* Page Header */}
        <section className="border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>Discovery Hub</span>
              </div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">
                Find Your Next Great Read
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
                Search Open Library for millions of titles or explore curated editorial collections and personalized recommendations.
              </p>
            </div>
          </div>

          {/* Live Open Library Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <label htmlFor="open-library-search" className="sr-only">
              Search Open Library by title, author, or ISBN
            </label>
            <div className="relative">
              <Search
                className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="open-library-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, author, or ISBN (e.g. Dune, Andy Weir, 9780593135204)..."
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] shadow-sm outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Offline or Rate Limit Fallback Notice */}
            {isOfflineFallback && !isSearching && debouncedQuery && (
              <div className="mt-2 text-xs text-[var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Showing curated matching titles from offline pool.</span>
              </div>
            )}
          </div>
        </section>

        {/* Search Results State */}
        {debouncedQuery && (
          <section aria-labelledby="search-results-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="search-results-heading"
                className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2"
              >
                <Search className="w-5 h-5 text-[var(--color-accent)]" />
                <span>
                  Search Results for &ldquo;{debouncedQuery}&rdquo;
                </span>
                {!isSearching && (
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                    ({searchResults.length} {searchResults.length === 1 ? 'book' : 'books'} found)
                  </span>
                )}
              </h2>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] animate-pulse flex gap-4"
                  >
                    <div className="w-20 h-28 bg-[var(--color-border-subtle)] rounded-md flex-shrink-0 aspect-[2/3]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[var(--color-border-subtle)] rounded w-3/4" />
                      <div className="h-3 bg-[var(--color-border-subtle)] rounded w-1/2" />
                      <div className="h-8 bg-[var(--color-border-subtle)] rounded w-full mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchError ? (
              <div className="p-6 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 text-center">
                <p className="text-sm text-[var(--color-error)]">{searchError}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Try searching for a different title or author.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <BookOpen className="w-10 h-10 mx-auto text-[var(--color-text-tertiary)] mb-2" />
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  No books found matching &ldquo;{debouncedQuery}&rdquo;
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
                  Try checking spelling, searching by the author’s last name, or using a 10/13-digit ISBN.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {searchResults.map((book) => {
                  const key = book.isbn13 || book.workKey || book.title;
                  return (
                    <DiscoveryBookCard
                      key={key}
                      candidate={book}
                      existingBook={getExistingBook(book)}
                      shelves={shelves}
                      selectedShelf={selectedShelfMap[key] || 'want-to-read'}
                      isAdding={addingBookKey === key}
                      onShelfChange={(shelfId) => handleShelfChange(key, shelfId)}
                      onAdd={() => handleAdd(book)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Personalized Recommendations Section ("Because you enjoyed...") */}
        {personalizedLanes.length > 0 && !debouncedQuery && (
          <section aria-labelledby="recommendations-heading" className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                <span>Tailored For You</span>
              </div>
              <h2
                id="recommendations-heading"
                className="font-serif-heading text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]"
              >
                Personalized Recommendations
              </h2>
            </div>

            <div className="space-y-8">
              {personalizedLanes.map((lane, laneIdx) => (
                <div key={laneIdx} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {lane.reason}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {lane.candidates.slice(0, 4).map((candidate) => {
                      const key = candidate.isbn13 || candidate.workKey || candidate.title;
                      return (
                        <DiscoveryBookCard
                          key={key}
                          candidate={candidate}
                          existingBook={getExistingBook(candidate)}
                          shelves={shelves}
                          selectedShelf={selectedShelfMap[key] || 'want-to-read'}
                          isAdding={addingBookKey === key}
                          onShelfChange={(shelfId) => handleShelfChange(key, shelfId)}
                          onAdd={() => handleAdd(candidate)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Curated Editorial Collections (Cold-start and inspiration) */}
        {!debouncedQuery && (
          <section aria-labelledby="curated-heading" className="space-y-6">
            <div className="border-t border-[var(--color-border-subtle)] pt-8">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                <Layers className="w-4 h-4" />
                <span>Curated Collections</span>
              </div>
              <h2
                id="curated-heading"
                className="font-serif-heading text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]"
              >
                Explore By Theme
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                Hand-picked reading lists to jumpstart your shelves and ignite your curiosity.
              </p>
            </div>

            {/* Collection Tab Selector */}
            <div
              role="tablist"
              aria-label="Curated Collections"
              className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
            >
              {CURATED_DISCOVERY_COLLECTIONS.map((col) => {
                const isActive = activeCollectionId === col.id;
                return (
                  <button
                    key={col.id}
                    role="tab"
                    id={`tab-${col.id}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${col.id}`}
                    onClick={() => setActiveCollectionId(col.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
                    }`}
                  >
                    {col.name}
                  </button>
                );
              })}
            </div>

            {/* Active Collection Panel */}
            {CURATED_DISCOVERY_COLLECTIONS.map((col) => {
              if (col.id !== activeCollectionId) return null;
              return (
                <div
                  key={col.id}
                  id={`panel-${col.id}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${col.id}`}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {col.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {col.description}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                      {col.books.length} Books
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {col.books.map((candidate) => {
                      const key = candidate.isbn13 || candidate.workKey || candidate.title;
                      return (
                        <DiscoveryBookCard
                          key={key}
                          candidate={candidate}
                          existingBook={getExistingBook(candidate)}
                          shelves={shelves}
                          selectedShelf={selectedShelfMap[key] || 'want-to-read'}
                          isAdding={addingBookKey === key}
                          onShelfChange={(shelfId) => handleShelfChange(key, shelfId)}
                          onAdd={() => handleAdd(candidate)}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </AppShell>
  );
}

interface DiscoveryBookCardProps {
  candidate: OpenLibraryBookCandidate;
  existingBook?: BookItem;
  shelves: Array<{ id: string; name: string }>;
  selectedShelf: string;
  isAdding: boolean;
  onShelfChange: (shelfId: string) => void;
  onAdd: () => void;
}

function DiscoveryBookCard({
  candidate,
  existingBook,
  shelves,
  selectedShelf,
  isAdding,
  onShelfChange,
  onAdd,
}: DiscoveryBookCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-sm hover:border-[var(--color-border)] hover:shadow-md transition-all">
      <div>
        {/* Book Cover Thumbnail (Self-contained 2:3 aspect ratio per independence rule) */}
        <div className="relative aspect-[2/3] w-full max-w-[150px] mx-auto rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] shadow-sm border border-[var(--color-border-subtle)] mb-3">
          {candidate.coverUrl && !imageError ? (
            <img
              src={candidate.coverUrl}
              alt={`Cover of ${candidate.title} by ${candidate.author}`}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col justify-between p-3 bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] border-l-4 border-l-[var(--color-accent)] text-center">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-mono line-clamp-1">
                {candidate.genres[0] || 'Book'}
              </span>
              <p className="font-serif-heading font-semibold text-xs text-[var(--color-text-primary)] line-clamp-3 leading-snug">
                {candidate.title}
              </p>
              <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
                {candidate.author}
              </p>
            </div>
          )}

          {/* Existing In Library Badge */}
          {existingBook && (
            <div className="absolute top-2 right-2 bg-[var(--color-success)] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>In Library</span>
            </div>
          )}
        </div>

        {/* Book Meta */}
        <div className="space-y-1">
          <h4
            className="font-serif-heading font-semibold text-sm text-[var(--color-text-primary)] line-clamp-2 leading-tight"
            title={candidate.title}
          >
            {candidate.title}
          </h4>
          <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
            {candidate.author}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-[11px] text-[var(--color-text-tertiary)]">
            {candidate.firstPublishYear && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {candidate.firstPublishYear}
              </span>
            )}
            {candidate.pageCount && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {candidate.pageCount}p
              </span>
            )}
          </div>

          {/* Genre Pills */}
          {candidate.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1.5">
              {candidate.genres.slice(0, 2).map((g, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
                >
                  <Tag className="w-2.5 h-2.5 opacity-60" />
                  {g}
                </span>
              ))}
            </div>
          )}

          {candidate.description && (
            <p className="text-xs text-[var(--color-text-secondary)]/80 line-clamp-2 pt-1 leading-relaxed italic">
              &ldquo;{candidate.description}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Shelf Selection & Action Button */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] space-y-2">
        {existingBook ? (
          <Link
            href={`/books/${existingBook.id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition border border-[var(--color-border-subtle)]"
          >
            <Bookmark className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>View In Library</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-auto" />
          </Link>
        ) : (
          <div className="space-y-2">
            <label htmlFor={`shelf-select-${candidate.isbn13 || candidate.title}`} className="sr-only">
              Select destination shelf for {candidate.title}
            </label>
            <select
              id={`shelf-select-${candidate.isbn13 || candidate.title}`}
              value={selectedShelf}
              onChange={(e) => onShelfChange(e.target.value)}
              className="w-full text-xs py-1.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            >
              {shelves.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={isAdding}
              onClick={onAdd}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Adding...' : 'Add to Shelf'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
