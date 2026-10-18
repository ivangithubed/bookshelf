'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  FolderInput,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';

export interface BulkActionBarProps {
  selectedBookIds: string[];
  totalBooksCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  className?: string;
}

export function BulkActionBar({
  selectedBookIds,
  totalBooksCount,
  onSelectAll,
  onClearSelection,
  className = '',
}: BulkActionBarProps) {
  const {
    shelves,
    allKnownGenres,
    bulkMoveBooks,
    bulkAddGenre,
    bulkDeleteBooks,
  } = useBookshelf();

  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [newGenreInput, setNewGenreInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close Delete Confirmation Modal on Escape (F-01)
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

  const selectedCount = selectedBookIds.length;
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalBooksCount && totalBooksCount > 0;

  const handleMove = async (shelfId: string) => {
    setIsProcessing(true);
    try {
      await bulkMoveBooks(selectedBookIds, shelfId);
      setIsMoveOpen(false);
      onClearSelection();
    } catch (err) {
      console.error('Failed to bulk move books:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreInput.trim()) return;
    setIsProcessing(true);
    try {
      await bulkAddGenre(selectedBookIds, newGenreInput.trim());
      setNewGenreInput('');
      setIsGenreOpen(false);
    } catch (err) {
      console.error('Failed to bulk add genre:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    try {
      await bulkDeleteBooks(selectedBookIds);
      setIsDeleteModalOpen(false);
      onClearSelection();
    } catch (err) {
      console.error('Failed to bulk delete books:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Bar */}
      <div
        role="toolbar"
        aria-label="Bulk actions for selected books"
        className={`fixed bottom-6 left-1/2 z-40 -translate-x-1/2 w-[94%] max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 sm:px-5 sm:py-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${className}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Selected Count & Toggle All */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 items-center rounded-full bg-[var(--color-accent-subtle)] px-3 text-xs font-bold text-[var(--color-accent)]">
              {selectedCount} selected
            </span>

            {isAllSelected ? (
              <button
                type="button"
                onClick={onClearSelection}
                className="min-h-[36px] px-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Deselect All
              </button>
            ) : (
              <button
                type="button"
                onClick={onSelectAll}
                className="min-h-[36px] px-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Select All ({totalBooksCount})
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Move to Shelf Button */}
            <div className="relative">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setIsMoveOpen(!isMoveOpen);
                  setIsGenreOpen(false);
                }}
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
                aria-haspopup="true"
                aria-expanded={isMoveOpen}
              >
                <FolderInput className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span className="hidden sm:inline">Move</span>
              </button>

              {/* Move Dropdown Menu */}
              {isMoveOpen && (
                <div
                  role="menu"
                  className="absolute bottom-full mb-2 left-0 sm:right-0 sm:left-auto w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-xl"
                >
                  <p className="px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    Move to shelf
                  </p>
                  {shelves.map((shelf) => (
                    <button
                      key={shelf.id}
                      type="button"
                      role="menuitem"
                      onClick={() => handleMove(shelf.id)}
                      className="flex w-full min-h-[36px] items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent)]"
                    >
                      <span>{shelf.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Genre Button */}
            <div className="relative">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setIsGenreOpen(!isGenreOpen);
                  setIsMoveOpen(false);
                }}
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:opacity-50"
                aria-haspopup="true"
                aria-expanded={isGenreOpen}
              >
                <Tag className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />
                <span className="hidden sm:inline">Tag</span>
              </button>

              {/* Add Genre Popover */}
              {isGenreOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-xl">
                  <form onSubmit={handleAddGenre} className="space-y-2">
                    <label
                      htmlFor="bulk-genre-input"
                      className="block text-xs font-semibold text-[var(--color-text-primary)]"
                    >
                      Add genre to {selectedCount} books:
                    </label>
                    <input
                      id="bulk-genre-input"
                      list="bulk-known-genres"
                      type="text"
                      value={newGenreInput}
                      onChange={(e) => setNewGenreInput(e.target.value)}
                      placeholder="e.g. Sci-Fi, Biography"
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                    />
                    <datalist id="bulk-known-genres">
                      {allKnownGenres.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsGenreOpen(false)}
                        className="rounded px-2.5 py-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!newGenreInput.trim() || isProcessing}
                        className="flex items-center gap-1 rounded bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        <span>Add</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Delete Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--color-error)] disabled:opacity-50"
              aria-label={`Delete ${selectedCount} selected books`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              type="button"
              onClick={onClearSelection}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-delete-title"
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
              <h3 id="bulk-delete-title" className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
                Delete {selectedCount} books?
              </h3>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Are you sure you want to remove <strong className="text-[var(--color-text-primary)]">{selectedCount} books</strong> from your library? This action will remove all reading progress and ratings associated with these books.
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
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[var(--color-error)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-error)] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Delete {selectedCount} Books</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
