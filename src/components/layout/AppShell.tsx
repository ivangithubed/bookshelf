'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Accessibility,
  Compass,
  Library,
  Search,
  Sparkles,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { LibrarySearchModal } from './LibrarySearchModal';
import { KeyboardShortcutsModal } from '../a11y/KeyboardShortcutsModal';
import { useBookshelf } from '@/context/BookshelfContext';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { setSearchModalOpen } = useBookshelf();

  const mobileNavClass = (href: string) => {
    const isActive = pathname === href || (href !== '/library' && pathname.startsWith(href));
    return `flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] text-[10px] font-medium transition ${
      isActive
        ? 'text-[var(--color-accent)] font-semibold'
        : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
    }`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Primary Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <HeaderBar onMobileMenuClick={() => setIsMobileOpen(true)} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[var(--container-page)] w-full mx-auto outline-none"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border-subtle)] flex items-center justify-around px-2 shadow-lg"
      >
        <Link href="/library" className={mobileNavClass('/library')}>
          <Library className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Library</span>
        </Link>

        <button
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1.5 min-h-[48px] text-[10px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition"
          aria-label="Search Library"
        >
          <Search className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Search</span>
        </button>

        <Link href="/discover" className={mobileNavClass('/discover')}>
          <Compass className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Discover</span>
        </Link>

        <Link href="/year-in-review" className={mobileNavClass('/year-in-review')}>
          <Sparkles className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Review</span>
        </Link>

        <Link href="/accessibility" className={mobileNavClass('/accessibility')}>
          <Accessibility className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>A11y</span>
        </Link>
      </nav>

      {/* Search Modal */}
      <LibrarySearchModal />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </div>
  );
}
