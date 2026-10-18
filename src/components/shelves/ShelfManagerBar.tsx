'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Edit2,
  Lock,
  Trash2,
  X,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';
import type { Shelf } from '@/types/bookshelf';

export interface ShelfManagerBarProps {
  shelf: Shelf;
  onShelfDeleted?: () => void;
  className?: string;
}

export function ShelfManagerBar({
  shelf,
  onShelfDeleted,
  className = '',
}: ShelfManagerBarProps) {
  const router = useRouter();
  const { renameShelf, deleteShelf, reorderShelf, shelves } = useBookshelf();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(shelf.name);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close Delete Shelf Confirmation Modal on Escape (F-02)
  React.useEffect(() => {
    if (!isDeleteModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsDeleteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleteModalOpen]);

  const shelfIndex = shelves.findIndex((s) => s.id === shelf.id);
  const isFirst = shelfIndex === 0;
  const isLast = shelfIndex === shelves.length - 1;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSubmitting(true);
    try {
      await renameShelf(shelf.id, nameInput.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to rename shelf:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteShelf(shelf.id);
      setIsDeleteModalOpen(false);
      if (onShelfDeleted) {
        onShelfDeleted();
      } else {
        router.push('/library');
      }
    } catch (err) {
      console.error('Failed to delete shelf:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (shelf.isDefault) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] ${className}`}
      >
        <Lock className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
        <span className="font-medium">Default System Shelf</span>
        <span className="text-[11px] text-[var(--color-text-tertiary)]">
          (Cannot be removed or reordered)
        </span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 sm:px-4 sm:py-2 shadow-sm ${className}`}
      >
        {/* Left: Shelf Name or Inline Rename Form */}
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                className="h-8 rounded-md border border-[var(--color-accent)] bg-[var(--color-bg-primary)] px-2.5 text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting || !nameInput.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                aria-label="Save shelf name"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setNameInput(shelf.name);
                  setIsEditingName(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
                aria-label="Cancel rename"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                Custom Shelf
              </span>
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="flex min-h-[36px] items-center gap-1 rounded-md px-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                aria-label={`Rename shelf ${shelf.name}`}
              >
                <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Rename</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Reorder Up/Down & Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => reorderShelf(shelf.id, 'up')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Move shelf up"
            title="Move shelf up"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => reorderShelf(shelf.id, 'down')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label="Move shelf down"
            title="Move shelf down"
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex min-h-[36px] items-center gap-1 rounded-md px-2.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 focus-visible:ring-2 focus-visible:ring-[var(--color-error)]"
            aria-label={`Delete custom shelf ${shelf.name}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Delete Shelf</span>
          </button>
        </div>
      </div>

      {/* Delete Shelf Confirmation Modal (ADR-002) */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-shelf-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-[var(--color-error)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 id="delete-shelf-title" className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
                Delete shelf &ldquo;{shelf.name}&rdquo;?
              </h3>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Books on this shelf will <strong className="text-[var(--color-text-primary)]">not</strong> be lost. According to library policy (ADR-002), any books on this shelf will safely move to <strong className="text-[var(--color-text-primary)]">&ldquo;Read&rdquo;</strong> (if completed) or <strong className="text-[var(--color-text-primary)]">&ldquo;Want to Read&rdquo;</strong>.
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
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--color-error)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-error)] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Delete Shelf</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
