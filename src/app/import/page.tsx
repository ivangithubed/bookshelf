'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  XCircle,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useBookshelf } from '@/context/BookshelfContext';
import {
  parseGoodreadsCsv,
  executeGoodreadsImport,
} from '@/lib/csv/goodreads-parser';
import { enrichBookFromOpenLibrary } from '@/lib/open-library/client';
import type {
  ConflictResolutionStrategy,
  CsvParseResult,
  ImportExecutionSummary,
  ImportPreviewItem,
  BookItem,
} from '@/types/bookshelf';
import type { BookshelfSnapshot } from '@/lib/db/indexed-db';

export default function ImportPage() {
  const {
    books,
    shelves,
    sessions,
    events,
    goals,
    replaceSnapshot,
    updateBookDetails,
    announce,
  } = useBookshelf();

  // File Upload & Parsing States
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [globalResolution, setGlobalResolution] = useState<ConflictResolutionStrategy>('skip');
  const [previewItems, setPreviewItems] = useState<ImportPreviewItem[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'duplicates' | 'new'>('all');
  const [dragActive, setDragActive] = useState(false);

  // Execution Summary State
  const [importSummary, setImportSummary] = useState<ImportExecutionSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Background Enrichment Queue States
  const [enrichmentQueue, setEnrichmentQueue] = useState<string[]>([]);
  const [enrichmentProgress, setEnrichmentProgress] = useState<{
    total: number;
    currentIdx: number;
    enrichedCount: number;
    notFoundCount: number;
    currentTitle: string | null;
  }>({
    total: 0,
    currentIdx: 0,
    enrichedCount: 0,
    notFoundCount: 0,
    currentTitle: null,
  });
  const [isEnriching, setIsEnriching] = useState(false);
  const isEnrichmentCancelledRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process raw CSV string
  const processCsvText = useCallback(
    (csvText: string) => {
      setIsParsing(true);
      setParseError(null);
      setImportSummary(null);

      try {
        const result = parseGoodreadsCsv(csvText, books, globalResolution);
        if (result.validRows === 0 && result.warnings.length > 0) {
          setParseError(result.warnings[0] || 'Unable to parse valid books from CSV.');
          setParseResult(null);
          setPreviewItems([]);
        } else {
          setParseResult(result);
          setPreviewItems(result.items);
          announce(
            `Parsed ${result.validRows} books from CSV with ${result.duplicateCount} duplicates detected.`
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error reading CSV file';
        setParseError(msg);
        setParseResult(null);
        setPreviewItems([]);
      } finally {
        setIsParsing(false);
      }
    },
    [books, globalResolution, announce]
  );

  // 1-Click Load Sample Goodreads CSV
  const handleLoadSampleCsv = async () => {
    setIsParsing(true);
    setParseError(null);
    try {
      let res = await fetch('/data/sample-books.csv');
      if (!res.ok) {
        res = await fetch('/bookshelf/data/sample-books.csv');
      }
      if (!res.ok) {
        throw new Error(`Failed to load sample CSV: status ${res.status}`);
      }
      const text = await res.text();
      processCsvText(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch sample CSV';
      setParseError(msg);
      setIsParsing(false);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please upload a valid .csv file exported from Goodreads.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        processCsvText(text);
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  // Global resolution toggle updates all duplicate items
  const handleGlobalResolutionChange = (newResolution: ConflictResolutionStrategy) => {
    setGlobalResolution(newResolution);
    setPreviewItems((prev) =>
      prev.map((item) => (item.isDuplicate ? { ...item, resolution: newResolution } : item))
    );
  };

  // Per-row resolution toggle
  const handleRowResolutionChange = (index: number, newResolution: ConflictResolutionStrategy) => {
    setPreviewItems((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index]!, resolution: newResolution };
      }
      return copy;
    });
  };

  // Filtered preview items
  const filteredPreview = useMemo(() => {
    if (previewFilter === 'duplicates') {
      return previewItems.filter((item) => item.isDuplicate);
    }
    if (previewFilter === 'new') {
      return previewItems.filter((item) => !item.isDuplicate);
    }
    return previewItems;
  }, [previewItems, previewFilter]);

  // Commit Import to Library
  const handleCommitImport = async () => {
    if (previewItems.length === 0) return;

    setIsImporting(true);
    try {
      const currentSnapshot: BookshelfSnapshot = {
        shelves,
        books,
        sessions,
        events,
        goals,
      };

      const { snapshot: nextSnapshot, summary } = executeGoodreadsImport(
        currentSnapshot,
        previewItems
      );

      await replaceSnapshot(
        nextSnapshot,
        `Goodreads migration complete: ${summary.addedCount} added, ${summary.replacedCount} updated, ${summary.skippedCount} skipped.`
      );

      setImportSummary(summary);
      setParseResult(null);
      setPreviewItems([]);

      // Populate enrichment queue
      if (summary.booksNeedingEnrichment.length > 0) {
        setEnrichmentQueue(summary.booksNeedingEnrichment);
        setEnrichmentProgress({
          total: summary.booksNeedingEnrichment.length,
          currentIdx: 0,
          enrichedCount: 0,
          notFoundCount: 0,
          currentTitle: null,
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Background Enrichment Worker (1 req/sec throttled)
  const startEnrichmentQueue = useCallback(async () => {
    if (isEnriching || enrichmentQueue.length === 0) return;

    setIsEnriching(true);
    isEnrichmentCancelledRef.current = false;

    const queue = [...enrichmentQueue];
    let enriched = enrichmentProgress.enrichedCount;
    let notFound = enrichmentProgress.notFoundCount;

    for (let i = 0; i < queue.length; i++) {
      if (isEnrichmentCancelledRef.current) break;

      const bookId = queue[i]!;
      const targetBook = books.find((b: BookItem) => b.id === bookId);

      if (!targetBook) {
        notFound++;
        continue;
      }

      setEnrichmentProgress((prev) => ({
        ...prev,
        currentIdx: i + 1,
        currentTitle: targetBook.title,
      }));

      try {
        const enrichedData = await enrichBookFromOpenLibrary({
          isbn: targetBook.isbn13 || targetBook.isbn10,
          title: targetBook.title,
          author: targetBook.author,
        });

        if (enrichedData && (enrichedData.coverUrl || enrichedData.description)) {
          await updateBookDetails(bookId, {
            coverUrl: targetBook.coverUrl || enrichedData.coverUrl || null,
            description: targetBook.description || enrichedData.description || null,
            pageCount: targetBook.pageCount || enrichedData.pageCount || null,
            publisher: targetBook.publisher || enrichedData.publisher || null,
            publishedDate: targetBook.publishedDate || enrichedData.publishedDate || null,
            genres: targetBook.genres.length > 0 ? targetBook.genres : (enrichedData.genres || []),
          });
          enriched++;
        } else {
          notFound++;
        }
      } catch {
        notFound++;
      }

      setEnrichmentProgress((prev) => ({
        ...prev,
        enrichedCount: enriched,
        notFoundCount: notFound,
      }));

      // Polite 1-second delay between Open Library requests
      if (i < queue.length - 1 && !isEnrichmentCancelledRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsEnriching(false);
    announce(`Metadata enrichment finished. ${enriched} covers and descriptions updated.`);
  }, [
    isEnriching,
    enrichmentQueue,
    enrichmentProgress,
    books,
    updateBookDetails,
    announce,
  ]);

  const handlePauseEnrichment = () => {
    isEnrichmentCancelledRef.current = true;
    setIsEnriching(false);
    announce('Metadata enrichment queue paused');
  };

  const handleClearEnrichment = () => {
    isEnrichmentCancelledRef.current = true;
    setIsEnriching(false);
    setEnrichmentQueue([]);
    setEnrichmentProgress({
      total: 0,
      currentIdx: 0,
      enrichedCount: 0,
      notFoundCount: 0,
      currentTitle: null,
    });
  };

  // Find books in current library missing coverUrl or description to allow manual enrichment anytime
  const booksMissingMetaCount = useMemo(() => {
    return books.filter((b) => !b.coverUrl || !b.description).length;
  }, [books]);

  const handleEnrichAllMissing = () => {
    const missingIds = books
      .filter((b) => !b.coverUrl || !b.description)
      .map((b) => b.id);
    if (missingIds.length === 0) return;
    setEnrichmentQueue(missingIds);
    setEnrichmentProgress({
      total: missingIds.length,
      currentIdx: 0,
      enrichedCount: 0,
      notFoundCount: 0,
      currentTitle: null,
    });
  };

  return (
    <AppShell>
      <div className="space-y-10 pb-16">
        {/* Header */}
        <section className="border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <Database className="w-4 h-4" />
            <span>Differentiator #4 — CSV Migration Pro</span>
          </div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">
            Goodreads Import Studio
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            Seamlessly migrate your complete Goodreads library with RFC-4180 parsing, interactive duplicate conflict resolution, and background Open Library metadata enrichment.
          </p>
        </section>

        {/* Stage 1: Upload & Instant Parse */}
        {!importSummary && (
          <section aria-labelledby="upload-section-heading" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2
                id="upload-section-heading"
                className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)]"
              >
                1. Select or Drop Your Goodreads Export
              </h2>
              {/* One-Click Sample Loader */}
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                disabled={isParsing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)] hover:text-white transition shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load Sample Goodreads CSV (45 Curated Books)</span>
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]/40 scale-[1.01]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload Goodreads CSV export"
              />
              <UploadCloud
                className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                  dragActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-tertiary)]'
                }`}
              />
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Drag and drop your `goodreads_library_export.csv` here
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                or click to browse from your device
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-[11px] text-[var(--color-text-tertiary)] font-mono bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full border border-[var(--color-border-subtle)]">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" />
                <span>Client-side only &bull; Zero server uploads &bull; Clean ISBN cleaning</span>
              </div>
            </div>

            {/* Parse Error Box */}
            {parseError && (
              <div
                role="alert"
                className="p-4 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 text-[var(--color-error)] flex items-start gap-3 text-sm"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Import Error</p>
                  <p className="text-xs mt-0.5">{parseError}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Stage 2: Parse Metrics & Conflict Resolution Preview */}
        {parseResult && !importSummary && (
          <section aria-labelledby="preview-section-heading" className="space-y-6">
            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Total Rows</span>
                <p className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                  {parseResult.validRows}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Duplicate Matches</span>
                <p className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-warning)]">
                  {parseResult.duplicateCount}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Custom Shelves</span>
                <p className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-accent)]">
                  {parseResult.customShelvesDetected.length}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Parse Speed</span>
                <p className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-success)]">
                  {Math.round(parseResult.parseDurationMs)}ms
                </p>
              </div>
            </div>

            {/* Custom Shelves Notice */}
            {parseResult.customShelvesDetected.length > 0 && (
              <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] flex items-center gap-2 text-xs">
                <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="text-[var(--color-text-secondary)]">Custom shelves detected:</span>
                <div className="flex flex-wrap gap-1">
                  {parseResult.customShelvesDetected.map((shelfName) => (
                    <span
                      key={shelfName}
                      className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] font-medium"
                    >
                      {shelfName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Conflict Strategy Controller & Filters */}
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label
                  htmlFor="global-strategy-select"
                  className="text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap"
                >
                  Duplicate Strategy:
                </label>
                <select
                  id="global-strategy-select"
                  value={globalResolution}
                  onChange={(e) =>
                    handleGlobalResolutionChange(e.target.value as ConflictResolutionStrategy)
                  }
                  className="text-xs py-1.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                >
                  <option value="skip">Skip Duplicates (Recommended)</option>
                  <option value="replace">Replace Existing with CSV</option>
                  <option value="keep_both">Keep Both (Import as New Copy)</option>
                </select>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-text-tertiary)]">Filter:</span>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('all')}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                    previewFilter === 'all'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                  }`}
                >
                  All ({previewItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('duplicates')}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                    previewFilter === 'duplicates'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                  }`}
                >
                  Duplicates ({parseResult.duplicateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter('new')}
                  className={`text-xs px-2.5 py-1 rounded-lg border ${
                    previewFilter === 'new'
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]'
                  }`}
                >
                  New ({previewItems.length - parseResult.duplicateCount})
                </button>
              </div>
            </div>

            {/* Preview Items Table */}
            <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-surface)] shadow-sm">
              <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--color-bg-secondary)] sticky top-0 z-10 border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Book
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Shelf / Status
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Rating
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Duplicate Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-right">
                        Resolution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {filteredPreview.map((item, idx) => {
                      const row = item.row;
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-[var(--color-bg-primary)]/50 ${
                            item.isDuplicate ? 'bg-[var(--color-warning)]/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[var(--color-text-primary)] line-clamp-1">
                              {row.title}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-tertiary)]">
                              {row.author} {row.pageCount ? `• ${row.pageCount}p` : ''}
                            </p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="capitalize px-2 py-0.5 rounded text-[11px] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] font-medium">
                              {row.customShelfNames[0] || row.exclusiveShelf}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono text-[var(--color-rating)]">
                            {row.rating ? `${'★'.repeat(row.rating)} (${row.rating})` : '—'}
                          </td>
                          <td className="px-3 py-3">
                            {item.isDuplicate ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-warning)]">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Duplicate ({item.matchedBy})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-success)]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>New Title</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {item.isDuplicate ? (
                              <select
                                value={item.resolution}
                                onChange={(e) =>
                                  handleRowResolutionChange(
                                    idx,
                                    e.target.value as ConflictResolutionStrategy
                                  )
                                }
                                aria-label={`Resolution for ${row.title}`}
                                className="text-xs py-1 px-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-accent)]"
                              >
                                <option value="skip">Skip</option>
                                <option value="replace">Replace</option>
                                <option value="keep_both">Keep Both</option>
                              </select>
                            ) : (
                              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                                Will Import
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit Import Action Bar */}
              <div className="p-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  Ready to migrate {previewItems.length} records into your personal IndexedDB library.
                </span>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={isImporting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition shadow-sm disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>{isImporting ? 'Importing Library...' : 'Commit Import to Library'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Stage 3: Import Success Summary */}
        {importSummary && (
          <section
            aria-labelledby="summary-heading"
            className="p-6 sm:p-8 rounded-2xl border border-[var(--color-success)]/30 bg-[var(--color-surface)] shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="summary-heading"
                  className="font-serif-heading text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]"
                >
                  Migration Successfully Committed!
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Your reading records have been merged into offline-first IndexedDB storage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Added Books</span>
                <p className="text-2xl font-bold font-mono text-[var(--color-success)]">
                  +{importSummary.addedCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Updated Books</span>
                <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">
                  {importSummary.replacedCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Skipped Duplicates</span>
                <p className="text-2xl font-bold font-mono text-[var(--color-text-tertiary)]">
                  {importSummary.skippedCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                <span className="text-xs text-[var(--color-text-tertiary)]">Shelves Created</span>
                <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                  {importSummary.customShelvesCreated.length}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/library"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition shadow-sm"
              >
                <span>View Library</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setImportSummary(null);
                  setParseResult(null);
                  setPreviewItems([]);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition"
              >
                <span>Import Another File</span>
              </button>
            </div>
          </section>
        )}

        {/* Stage 4: Background Open Library Metadata Enrichment Queue (1 req/sec) */}
        <section aria-labelledby="enrichment-section-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Automated Cover & Synopsis Enrichment</span>
              </div>
              <h2
                id="enrichment-section-heading"
                className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)]"
              >
                Open Library Background Enrichment Queue
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Pulls high-resolution book cover artwork, genre tags, and synopses from Open Library at a polite 1 request/second rate.
              </p>
            </div>

            {enrichmentQueue.length === 0 && booksMissingMetaCount > 0 && (
              <button
                type="button"
                onClick={handleEnrichAllMissing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Enrich {booksMissingMetaCount} Books Missing Artwork</span>
              </button>
            )}
          </div>

          {enrichmentQueue.length > 0 ? (
            <div className="p-6 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                      Queue Progress: {enrichmentProgress.currentIdx} of {enrichmentProgress.total} books
                    </span>
                    {isEnriching && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-accent)] animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>Enriching at 1 req/s...</span>
                      </span>
                    )}
                  </div>
                  {enrichmentProgress.currentTitle && (
                    <p className="text-xs text-[var(--color-text-secondary)] italic line-clamp-1">
                      Currently processing: &ldquo;{enrichmentProgress.currentTitle}&rdquo;
                    </p>
                  )}
                </div>

                {/* Queue Control Buttons */}
                <div className="flex items-center gap-2">
                  {!isEnriching ? (
                    <button
                      type="button"
                      onClick={startEnrichmentQueue}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{enrichmentProgress.currentIdx > 0 ? 'Resume' : 'Start Queue'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseEnrichment}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-warning)] text-white hover:opacity-90 transition shadow-sm"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause Queue</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClearEnrichment}
                    aria-label="Cancel and dismiss queue"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>

              {/* Accessible Progress Bar */}
              <div
                role="progressbar"
                aria-valuenow={
                  enrichmentProgress.total > 0
                    ? Math.round((enrichmentProgress.currentIdx / enrichmentProgress.total) * 100)
                    : 0
                }
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Metadata enrichment queue progress"
                className="w-full bg-[var(--color-bg-secondary)] h-2.5 rounded-full overflow-hidden"
              >
                <div
                  className="bg-[var(--color-accent)] h-full transition-all duration-300"
                  style={{
                    width: `${
                      enrichmentProgress.total > 0
                        ? Math.round(
                            (enrichmentProgress.currentIdx / enrichmentProgress.total) * 100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              {/* Counters */}
              <div className="flex items-center gap-6 text-xs text-[var(--color-text-secondary)] font-mono">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  <span>{enrichmentProgress.enrichedCount} Enriched</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                  <span>{enrichmentProgress.notFoundCount} Skipped / Not Found</span>
                </span>
                <span>
                  {enrichmentProgress.total - enrichmentProgress.currentIdx} Remaining
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] flex items-center justify-between">
              <span>
                {booksMissingMetaCount === 0
                  ? 'All books in your library have high-resolution cover artwork and metadata!'
                  : `${booksMissingMetaCount} books in your library could benefit from cover or description enrichment.`}
              </span>
              <span className="text-[var(--color-text-tertiary)] font-mono">Queue Idle</span>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
