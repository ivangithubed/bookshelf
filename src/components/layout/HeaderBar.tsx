'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HelpCircle,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';

interface HeaderBarProps {
  onMobileMenuClick?: () => void;
}

export function HeaderBar({ onMobileMenuClick }: HeaderBarProps) {
  const pathname = usePathname();
  const {
    setSearchModalOpen,
    setShortcutsModalOpen,
    a11yPrefs,
    updateA11yPrefs,
  } = useBookshelf();

  // Compute breadcrumb/title from pathname
  const getPageTitle = (path: string): string => {
    if (path === '/' || path === '/library') return 'All Books';
    if (path.startsWith('/shelves/currently-reading')) return 'Currently Reading';
    if (path.startsWith('/shelves/want-to-read')) return 'Want to Read';
    if (path.startsWith('/shelves/read')) return 'Read';
    if (path.startsWith('/shelves/')) {
      const slug = path.replace('/shelves/', '');
      return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (path.startsWith('/discover')) return 'Discover Books';
    if (path.startsWith('/year-in-review')) return '2026 Year in Review';
    if (path.startsWith('/analytics')) return 'Reading Analytics';
    if (path.startsWith('/timeline')) return 'Activity Timeline';
    if (path.startsWith('/import')) return 'Goodreads Import';
    if (path.startsWith('/accessibility')) return 'Accessibility (AAA)';
    if (path.startsWith('/guest')) return 'Guest Mode';
    return 'Bookshelf';
  };

  const currentTitle = getPageTitle(pathname);

  const toggleTheme = () => {
    const nextTheme = a11yPrefs.theme === 'dark' ? 'light' : 'dark';
    updateA11yPrefs({ theme: nextTheme });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/90 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Menu Toggle + Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMobileMenuClick && (
          <button
            type="button"
            onClick={onMobileMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-2">
          <Link
            href="/library"
            className="hidden text-xs font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] sm:inline"
          >
            Library
          </Link>
          <span className="hidden text-xs text-[var(--color-text-tertiary)] sm:inline" aria-hidden="true">
            /
          </span>
          <span
            aria-current="page"
            className="font-serif-heading text-lg font-bold tracking-tight text-[var(--color-text-primary)] sm:text-xl"
          >
            {currentTitle}
          </span>
        </nav>
      </div>

      {/* Right: Search, Theme Toggle, Shortcuts, Add Book */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button */}
        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-secondary)] shadow-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] sm:w-56 sm:justify-between"
          aria-label="Search library (Press Slash or Command K)"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <span className="hidden sm:inline">Search library...</span>
          </div>
          <kbd className="hidden rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-text-tertiary)] sm:inline-block">
            ⌘K
          </kbd>
        </button>

        {/* Theme Quick Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label={
            a11yPrefs.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
        >
          {a11yPrefs.theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[var(--color-rating)]" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={() => setShortcutsModalOpen(true)}
          className="hidden h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] md:flex"
          aria-label="View keyboard shortcuts (Press Question Mark)"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Discover / Add Book Action */}
        <Link
          href="/discover"
          className="flex h-10 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span className="hidden sm:inline">Add Book</span>
        </Link>
      </div>
    </header>
  );
}
