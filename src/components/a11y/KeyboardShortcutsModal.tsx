'use client';

import React, { useEffect, useId, useRef } from 'react';
import { HelpCircle, Keyboard, X } from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';

interface ShortcutGroup {
  category: string;
  items: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Global & Search',
    items: [
      { keys: ['/'], description: 'Open quick library search' },
      { keys: ['⌘', 'K'], description: 'Command palette / Search modal' },
      { keys: ['?'], description: 'Show keyboard shortcuts cheat sheet' },
      { keys: ['Esc'], description: 'Close any open modal or drawer' },
    ],
  },
  {
    category: 'Accessibility & View',
    items: [
      { keys: ['Alt', 'T'], description: 'Quick toggle Light / Dark theme' },
      { keys: ['Tab'], description: 'Move focus to next interactive element' },
      { keys: ['Shift', 'Tab'], description: 'Move focus to previous element' },
      { keys: ['Enter'], description: 'Select / activate highlighted book or button' },
      { keys: ['↑', '↓'], description: 'Navigate search results or list options' },
    ],
  },
  {
    category: 'Quick Navigation (G + Key)',
    items: [
      { keys: ['G', 'L'], description: 'Go to All Books (/library)' },
      { keys: ['G', 'R'], description: 'Go to Currently Reading (/shelves/currently-reading)' },
      { keys: ['G', 'W'], description: 'Go to Want to Read (/shelves/want-to-read)' },
      { keys: ['G', 'D'], description: 'Go to Read (/shelves/read)' },
      { keys: ['G', 'Y'], description: 'Go to 2026 Year in Review' },
      { keys: ['G', 'A'], description: 'Go to Accessibility Control Center' },
    ],
  },
];

export function KeyboardShortcutsModal() {
  const { isShortcutsModalOpen, setShortcutsModalOpen } = useBookshelf();
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open
  useEffect(() => {
    if (isShortcutsModalOpen) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
  }, [isShortcutsModalOpen]);

  // Handle Escape
  useEffect(() => {
    if (!isShortcutsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShortcutsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsModalOpen, setShortcutsModalOpen]);

  if (!isShortcutsModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setShortcutsModalOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Keyboard className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2
                id={titleId}
                className="font-serif-heading text-lg font-bold text-[var(--color-text-primary)]"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Navigate Bookshelf without touching your mouse
              </p>
            </div>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setShortcutsModalOpen(false)}
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close keyboard shortcuts dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Shortcuts Body */}
        <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                {group.category}
              </h3>
              <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)] divide-y divide-[var(--color-border-subtle)]">
                {group.items.map((item) => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-[var(--color-text-secondary)] font-medium">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[11px] font-semibold text-[var(--color-text-primary)] shadow-xs">
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className="text-[var(--color-text-tertiary)] text-[10px]">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Fully WCAG 2.2 compliant keyboard navigation</span>
          </div>
          <button
            type="button"
            onClick={() => setShortcutsModalOpen(false)}
            className="px-3 py-1.5 rounded-md bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] font-medium text-xs transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
