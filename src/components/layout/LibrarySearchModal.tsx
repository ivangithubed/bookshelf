'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Compass,
  CornerDownLeft,
  Search,
  Star,
  X,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import type { BookItem } from '@/types/bookshelf';

export function LibrarySearchModal() {
  const router = useRouter();
  const { isSearchModalOpen, setSearchModalOpen, books, shelves } = useBookshelf();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'title' | 'author' | 'genre'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  // Focus management on open/close
  useEffect(() => {
    if (isSearchModalOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isSearchModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setSearchModalOpen]);

  // Filter books based on query & scope
  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show up to 6 recently added books as suggestions when query is empty
      return books.slice(0, 6);
    }

    return books.filter((book) => {
      const matchTitle = book.title.toLowerCase().includes(q);
      const matchAuthor = book.author.toLowerCase().includes(q);
      const matchGenre = Array.isArray(book.genres) &&
        book.genres.some((g) => g.toLowerCase().includes(q));
      const matchNotes = book.notes ? book.notes.toLowerCase().includes(q) : false;

      if (scope === 'title') return matchTitle;
      if (scope === 'author') return matchAuthor;
      if (scope === 'genre') return matchGenre;
      return matchTitle || matchAuthor || matchGenre || matchNotes;
    });
  }, [books, query, scope]);

  // Reset selectedIndex when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredBooks]);

  const handleSelectBook = (book: BookItem) => {
    setSearchModalOpen(false);
    // Navigate to library with book param or shelf
    router.push(`/library?book=${book.id}`);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredBooks.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredBooks.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredBooks.length) % filteredBooks.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredBooks[selectedIndex];
      if (current) {
        handleSelectBook(current);
      }
    }
  };

  const getShelfName = (shelfId: string) => {
    const s = shelves.find((shelf) => shelf.id === shelfId);
    return s?.name || shelfId;
  };

  if (!isSearchModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setSearchModalOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
          <Search className="w-5 h-5 text-[var(--color-text-tertiary)] shrink-0 mr-3" aria-hidden="true" />
          <h2 id={titleId} className="sr-only">
            Search Personal Library
          </h2>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search by title, author, genre, or notes..."
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none"
            aria-label="Search library books"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded mr-2"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            className="p-1.5 text-xs font-semibold rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label="Close search"
          >
            Esc
          </button>
        </div>

        {/* Scope Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]/50 text-xs">
          <span className="text-[var(--color-text-tertiary)] mr-1 font-medium">Filter:</span>
          {(['all', 'title', 'author', 'genre'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                scope === s
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-[var(--color-text-tertiary)]">
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2" role="listbox" aria-label="Search results">
          {filteredBooks.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <BookOpen className="w-10 h-10 mx-auto text-[var(--color-text-tertiary)] mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                No books found matching &quot;{query}&quot;
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
                Try checking the spelling or searching by author name.
              </p>
              <div className="mt-4">
                <Link
                  href="/discover"
                  onClick={() => setSearchModalOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                >
                  <Compass className="w-4 h-4" />
                  <span>Looking for new books? Search Open Library &rarr;</span>
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredBooks.map((book, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <li
                    key={book.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectBook(book)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-[var(--color-accent-subtle)] border-l-4 border-[var(--color-accent)]'
                        : 'hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                  >
                    {/* Cover or placeholder */}
                    <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-[var(--color-bg-tertiary)] shadow-sm flex items-center justify-center relative">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={`Cover of ${book.title}`}
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[10px] font-serif font-bold text-[var(--color-accent)] p-1 text-center line-clamp-2">
                          {book.title}
                        </span>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {book.title}
                        </h3>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] shrink-0">
                          {getShelfName(book.shelfId)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">
                        {book.author}
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                        {book.rating && (
                          <span className="flex items-center gap-0.5 text-[var(--color-rating)] font-medium">
                            <Star className="w-3 h-3 fill-current" />
                            {book.rating}/5
                          </span>
                        )}
                        {book.progressPercent > 0 && book.progressPercent < 100 && (
                          <span>{book.progressPercent}% read</span>
                        )}
                        {book.genres && book.genres.length > 0 && (
                          <span className="truncate">{book.genres.slice(0, 2).join(', ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Select indicator */}
                    {isSelected && (
                      <CornerDownLeft className="w-4 h-4 text-[var(--color-accent)] shrink-0 mr-1" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[11px] text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-2">
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] font-mono text-[10px]">↑↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 rounded bg-[var(--color-bg-tertiary)] font-mono text-[10px]">Enter</kbd> to select
            </span>
          </div>
          <Link
            href="/discover"
            onClick={() => setSearchModalOpen(false)}
            className="text-[var(--color-accent)] hover:underline font-medium"
          >
            Discover more books &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
