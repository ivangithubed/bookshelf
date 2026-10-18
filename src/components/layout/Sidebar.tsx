'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Accessibility,
  BarChart3,
  BookMarked,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock,
  Compass,
  Edit2,
  Folder,
  Library,
  Plus,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import type { PaceStatus } from '@/types/bookshelf';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const {
    shelves,
    books,
    currentYearGoal,
    booksReadIn2026Count,
    setReadingGoal,
    createShelf,
  } = useBookshelf();

  const [shelfFilter, setShelfFilter] = useState('');
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [targetGoalInput, setTargetGoalInput] = useState(
    currentYearGoal?.targetBooks ? String(currentYearGoal.targetBooks) : '24'
  );

  const searchInputId = useId();

  // Red-Team Finding F-03: Close mobile sidebar drawer on Escape key press
  useEffect(() => {
    if (!isMobileOpen || !onMobileClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onMobileClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  // Book counts per shelf
  const counts = useMemo(() => {
    const total = books.length;
    const currentlyReading = books.filter((b) => b.shelfId === 'currently-reading').length;
    const wantToRead = books.filter((b) => b.shelfId === 'want-to-read').length;
    const read = books.filter((b) => b.shelfId === 'read' || b.isRead).length;

    const customCounts: Record<string, number> = {};
    for (const shelf of shelves) {
      if (!shelf.isDefault) {
        customCounts[shelf.id] = books.filter((b) => b.shelfId === shelf.id).length;
      }
    }

    return { total, currentlyReading, wantToRead, read, customCounts };
  }, [books, shelves]);

  // Filtered custom shelves
  const customShelves = useMemo(() => {
    return shelves.filter((s) => !s.isDefault);
  }, [shelves]);

  const filteredCustomShelves = useMemo(() => {
    if (!shelfFilter.trim()) return customShelves;
    const q = shelfFilter.toLowerCase().trim();
    return customShelves.filter((s) => s.name.toLowerCase().includes(q));
  }, [customShelves, shelfFilter]);

  // Goal calculation
  const targetBooks = currentYearGoal?.targetBooks ?? 24;
  const completedBooks = booksReadIn2026Count;
  const percentComplete = Math.min(100, Math.round((completedBooks / targetBooks) * 100));
  const remainingBooks = Math.max(0, targetBooks - completedBooks);

  // Pace status
  const pace: { status: PaceStatus; message: string } = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const expected = (dayOfYear / 365) * targetBooks;
    const delta = completedBooks - expected;

    if (completedBooks >= targetBooks) {
      return { status: 'ahead', message: 'Goal achieved! 🎉' };
    }
    if (delta >= 1) {
      return { status: 'ahead', message: `${Math.round(delta)} book${Math.round(delta) > 1 ? 's' : ''} ahead` };
    }
    if (delta <= -1) {
      return { status: 'behind', message: `${Math.abs(Math.round(delta))} book${Math.abs(Math.round(delta)) > 1 ? 's' : ''} behind` };
    }
    return { status: 'on_track', message: 'On track' };
  }, [completedBooks, targetBooks]);

  const handleCreateShelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelfName.trim()) return;
    const created = await createShelf(newShelfName.trim());
    if (created) {
      setNewShelfName('');
      setIsAddingShelf(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(targetGoalInput, 10);
    if (!isNaN(val) && val > 0) {
      await setReadingGoal(2026, val);
    }
    setIsEditingGoal(false);
  };

  const navClass = (href: string) => {
    const isActive = pathname === href || (href !== '/library' && pathname.startsWith(href));
    return `group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors min-h-[40px] ${
      isActive
        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold dark:bg-[var(--color-accent-subtle)]'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
    }`;
  };

  const content = (
    <div className="flex h-full flex-col bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border-subtle)]">
        <Link
          href="/library"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-md px-1 py-0.5"
          aria-label="Bookshelf Home"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white shadow-sm transition-transform group-hover:scale-105">
            <BookOpen className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
          </div>
          <span className="font-serif-heading text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Bookshelf
          </span>
        </Link>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="lg:hidden p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {/* LIBRARY Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-tertiary)]">
              Library
            </span>
          </div>

          <nav aria-label="Library shelves" className="space-y-0.5">
            <Link
              href="/library"
              onClick={onMobileClose}
              className={navClass('/library')}
              aria-current={pathname === '/library' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Library className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>All Books</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-medium">
                {counts.total}
              </span>
            </Link>

            <Link
              href="/shelves/currently-reading"
              onClick={onMobileClose}
              className={navClass('/shelves/currently-reading')}
              aria-current={pathname === '/shelves/currently-reading' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <BookMarked className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Currently Reading</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-medium">
                {counts.currentlyReading}
              </span>
            </Link>

            <Link
              href="/shelves/want-to-read"
              onClick={onMobileClose}
              className={navClass('/shelves/want-to-read')}
              aria-current={pathname === '/shelves/want-to-read' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Bookmark className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Want to Read</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-medium">
                {counts.wantToRead}
              </span>
            </Link>

            <Link
              href="/shelves/read"
              onClick={onMobileClose}
              className={navClass('/shelves/read')}
              aria-current={pathname === '/shelves/read' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" aria-hidden="true" />
                <span>Read</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-medium">
                {counts.read}
              </span>
            </Link>
          </nav>
        </div>

        {/* CUSTOM SHELVES Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-tertiary)]">
              Custom Shelves
            </span>
            <button
              type="button"
              onClick={() => setIsAddingShelf((prev) => !prev)}
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1 min-h-[36px] px-1 rounded"
              aria-label="Add new custom shelf"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>

          {/* Quick filter if more than 3 custom shelves */}
          {customShelves.length > 3 && (
            <div className="px-2 mb-2">
              <label htmlFor={searchInputId} className="sr-only">
                Filter shelves
              </label>
              <div className="relative">
                <Search
                  className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                  aria-hidden="true"
                />
                <input
                  id={searchInputId}
                  type="text"
                  placeholder="Filter shelves..."
                  value={shelfFilter}
                  onChange={(e) => setShelfFilter(e.target.value)}
                  className="w-full text-xs pl-8 pr-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>
          )}

          {/* Inline Add Shelf Form */}
          {isAddingShelf && (
            <form onSubmit={handleCreateShelf} className="px-2 mb-2 flex gap-1.5 items-center">
              <input
                type="text"
                autoFocus
                placeholder="Shelf name..."
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
              <button
                type="submit"
                className="text-xs px-2.5 py-1.5 bg-[var(--color-accent)] text-white rounded font-medium hover:bg-[var(--color-accent-hover)]"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingShelf(false);
                  setNewShelfName('');
                }}
                className="text-xs p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                aria-label="Cancel adding shelf"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>
          )}

          <nav aria-label="Custom user shelves" className="space-y-0.5">
            {filteredCustomShelves.map((shelf) => {
              const shelfHref = `/shelves/${shelf.slug}`;
              return (
                <Link
                  key={shelf.id}
                  href={shelfHref}
                  onClick={onMobileClose}
                  className={navClass(shelfHref)}
                  aria-current={pathname === shelfHref ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className="w-4 h-4 text-[var(--color-accent)] shrink-0" aria-hidden="true" />
                    <span className="truncate">{shelf.name}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] font-medium">
                    {counts.customCounts[shelf.id] ?? 0}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* INSIGHTS & TOOLS Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-tertiary)]">
              Insights &amp; Tools
            </span>
          </div>

          <nav aria-label="Reading insights and tools" className="space-y-0.5">
            <Link
              href="/discover"
              onClick={onMobileClose}
              className={navClass('/discover')}
              aria-current={pathname === '/discover' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Discover Books</span>
              </div>
            </Link>

            <Link
              href="/year-in-review"
              onClick={onMobileClose}
              className={navClass('/year-in-review')}
              aria-current={pathname === '/year-in-review' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[var(--color-rating)]" aria-hidden="true" />
                <span>Year in Review</span>
              </div>
            </Link>

            <Link
              href="/analytics"
              onClick={onMobileClose}
              className={navClass('/analytics')}
              aria-current={pathname === '/analytics' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Reading Analytics</span>
              </div>
            </Link>

            <Link
              href="/timeline"
              onClick={onMobileClose}
              className={navClass('/timeline')}
              aria-current={pathname === '/timeline' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Activity Timeline</span>
              </div>
            </Link>

            <Link
              href="/import"
              onClick={onMobileClose}
              className={navClass('/import')}
              aria-current={pathname === '/import' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <UploadCloud className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Goodreads Import</span>
              </div>
            </Link>

            <Link
              href="/accessibility"
              onClick={onMobileClose}
              className={navClass('/accessibility')}
              aria-current={pathname === '/accessibility' ? 'page' : undefined}
            >
              <div className="flex items-center gap-2.5">
                <Accessibility className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span>Accessibility (AAA)</span>
              </div>
            </Link>
          </nav>
        </div>
      </div>

      {/* Bottom READING GOAL Widget matching preview.jpg */}
      <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Reading Goal
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                2026
              </span>
              <button
                type="button"
                onClick={() => setIsEditingGoal((prev) => !prev)}
                className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                aria-label="Edit reading goal target"
              >
                <Edit2 className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </div>

          {isEditingGoal ? (
            <form onSubmit={handleSaveGoal} className="mt-2 mb-2 flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="500"
                value={targetGoalInput}
                onChange={(e) => setTargetGoalInput(e.target.value)}
                className="w-16 px-2 py-1 text-xs rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                aria-label="Target books for 2026"
              />
              <span className="text-xs text-[var(--color-text-secondary)]">books</span>
              <button
                type="submit"
                className="ml-auto text-xs px-2 py-1 bg-[var(--color-accent)] text-white rounded font-medium"
              >
                Save
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-1">
                <div className="text-sm font-bold text-[var(--color-text-primary)]">
                  {completedBooks}{' '}
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)]">
                    / {targetBooks} books
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium">
                  {pace.status === 'ahead' ? (
                    <span className="text-[var(--color-success)] flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                      {pace.message}
                    </span>
                  ) : pace.status === 'behind' ? (
                    <span className="text-[var(--color-warning)] flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" aria-hidden="true" />
                      {pace.message}
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">{pace.message}</span>
                  )}
                </div>
              </div>

              {/* Progress Bar with WCAG Attributes */}
              <div
                role="progressbar"
                aria-valuenow={percentComplete}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`2026 Reading Goal: ${completedBooks} of ${targetBooks} books completed`}
                className="w-full h-2 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden mb-1.5"
              >
                <div
                  className="h-full bg-[var(--color-progress)] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-[var(--color-text-tertiary)]">
                <span>{percentComplete}% complete</span>
                <span>{remainingBooks > 0 ? `${remainingBooks} to go` : 'Done!'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[var(--color-border-subtle)] h-screen sticky top-0"
        aria-label="Sidebar Navigation"
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
