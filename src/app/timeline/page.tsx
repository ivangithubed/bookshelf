'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  CheckCircle2,
  BookPlus,
  TrendingUp,
  Star,
  Target,
  FileSpreadsheet,
  ArrowRightLeft,
  Calendar,
  BookOpen,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useBookshelf } from '@/context/BookshelfContext';
import type { ActivityEvent, ActivityEventType } from '@/types/bookshelf';

type FilterTab = 'all' | ActivityEventType;

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 86400 * 7) return `${Math.floor(diffSeconds / 86400)}d ago`;

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return isoString;
  }
}

function formatFullTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function getEventStyle(type: ActivityEventType): {
  icon: React.ComponentType<{ className?: string }>;
  bgClass: string;
  textClass: string;
  badgeLabel: string;
} {
  switch (type) {
    case 'book_finished':
      return {
        icon: CheckCircle2,
        bgClass: 'bg-[var(--color-success)]/15 border-[var(--color-success)]/30',
        textClass: 'text-[var(--color-success)]',
        badgeLabel: 'Book Finished',
      };
    case 'book_added':
      return {
        icon: BookPlus,
        bgClass: 'bg-[var(--color-accent)]/15 border-[var(--color-accent)]/30',
        textClass: 'text-[var(--color-accent)]',
        badgeLabel: 'Added',
      };
    case 'progress_updated':
      return {
        icon: TrendingUp,
        bgClass: 'bg-blue-500/15 border-blue-500/30 dark:bg-blue-400/15',
        textClass: 'text-blue-600 dark:text-blue-400',
        badgeLabel: 'Progress',
      };
    case 'rating_updated':
      return {
        icon: Star,
        bgClass: 'bg-[var(--color-rating)]/15 border-[var(--color-rating)]/30',
        textClass: 'text-[var(--color-rating)]',
        badgeLabel: 'Rating',
      };
    case 'shelf_moved':
      return {
        icon: ArrowRightLeft,
        bgClass: 'bg-purple-500/15 border-purple-500/30 dark:bg-purple-400/15',
        textClass: 'text-purple-600 dark:text-purple-400',
        badgeLabel: 'Shelf Moved',
      };
    case 'goal_updated':
      return {
        icon: Target,
        bgClass: 'bg-emerald-500/15 border-emerald-500/30',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        badgeLabel: 'Goal',
      };
    case 'csv_imported':
      return {
        icon: FileSpreadsheet,
        bgClass: 'bg-amber-500/15 border-amber-500/30',
        textClass: 'text-amber-600 dark:text-amber-400',
        badgeLabel: 'CSV Import',
      };
    default:
      return {
        icon: Clock,
        bgClass: 'bg-[var(--color-bg-secondary)] border-[var(--color-border)]',
        textClass: 'text-[var(--color-text-secondary)]',
        badgeLabel: 'Event',
      };
  }
}

export default function TimelinePage() {
  const { events } = useBookshelf();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterTabs: Array<{ id: FilterTab; label: string }> = [
    { id: 'all', label: 'All Activity' },
    { id: 'book_finished', label: 'Books Finished' },
    { id: 'progress_updated', label: 'Progress Updates' },
    { id: 'book_added', label: 'Books Added' },
    { id: 'rating_updated', label: 'Ratings' },
    { id: 'shelf_moved', label: 'Shelf Moves' },
    { id: 'goal_updated', label: 'Goals' },
    { id: 'csv_imported', label: 'CSV Imports' },
  ];

  // Filter & Search events
  const filteredEvents = useMemo(() => {
    let list = [...events].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (selectedFilter !== 'all') {
      list = list.filter((e) => e.type === selectedFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((e) => {
        return (
          e.summary.toLowerCase().includes(q) ||
          (e.bookTitle && e.bookTitle.toLowerCase().includes(q)) ||
          (e.detail && e.detail.toLowerCase().includes(q))
        );
      });
    }

    return list;
  }, [events, selectedFilter, searchQuery]);

  // Group events by day or month for narrative flow
  const groupedEvents = useMemo(() => {
    const groups: Array<{ label: string; items: ActivityEvent[] }> = [];
    const groupMap = new Map<string, ActivityEvent[]>();

    for (const event of filteredEvents) {
      try {
        const d = new Date(event.timestamp);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        let groupKey = '';
        if (d.toDateString() === today.toDateString()) {
          groupKey = 'Today';
        } else if (d.toDateString() === yesterday.toDateString()) {
          groupKey = 'Yesterday';
        } else {
          groupKey = d.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          });
        }

        const existing = groupMap.get(groupKey) ?? [];
        existing.push(event);
        groupMap.set(groupKey, existing);
      } catch {
        const fallback = 'Past Activity';
        const existing = groupMap.get(fallback) ?? [];
        existing.push(event);
        groupMap.set(fallback, existing);
      }
    }

    for (const [label, items] of groupMap.entries()) {
      groups.push({ label, items });
    }

    return groups;
  }, [filteredEvents]);

  return (
    <AppShell>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <section className="border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
            <Clock className="w-4 h-4" />
            <span>Stretch #17 — Reading Feed</span>
          </div>
          <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">
            Activity Timeline
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
            A chronological memory journal of your reading milestones, shelf changes, progress updates, and ratings.
          </p>

          {/* Search & Filters */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <label htmlFor="timeline-search" className="sr-only">
                Search timeline events
              </label>
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none" />
              <input
                id="timeline-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, book titles, or notes..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] outline-none transition"
              />
            </div>

            {/* Event Count */}
            <div className="text-xs text-[var(--color-text-tertiary)] font-mono">
              Showing {filteredEvents.length} of {events.length} total events
            </div>
          </div>

          {/* Filter Pills */}
          <div
            role="region"
            aria-label="Event Type Filters"
            className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-none"
          >
            <Filter className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] flex-shrink-0" />
            {filterTabs.map((tab) => {
              const isActive = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Timeline Content */}
        <section aria-labelledby="timeline-feed-heading">
          <h2 id="timeline-feed-heading" className="sr-only">
            Chronological Activity Feed
          </h2>

          {filteredEvents.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
              <Calendar className="w-12 h-12 mx-auto text-[var(--color-text-tertiary)] mb-3" />
              <h3 className="font-serif-heading text-lg font-semibold text-[var(--color-text-primary)]">
                No activity found
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 max-w-sm mx-auto">
                {searchQuery || selectedFilter !== 'all'
                  ? 'No activity matches your current filters. Try resetting search or selecting All Activity.'
                  : 'Your activity log will start recording as soon as you add books, update progress, or import a Goodreads CSV!'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedEvents.map((group) => (
                <div key={group.label} className="space-y-4">
                  {/* Date Group Heading */}
                  <div className="sticky top-16 z-10 bg-[var(--color-bg-primary)]/90 backdrop-blur-sm py-1.5 flex items-center gap-2">
                    <span className="font-serif-heading font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                  </div>

                  {/* Events in Group */}
                  <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-[var(--color-border-subtle)] ml-3 sm:ml-4">
                    {group.items.map((event) => {
                      const style = getEventStyle(event.type);
                      const IconComponent = style.icon;

                      return (
                        <div
                          key={event.id}
                          className="relative group rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:p-5 shadow-sm hover:border-[var(--color-border)] hover:shadow-md transition-all"
                        >
                          {/* Node Icon on Timeline Line */}
                          <div
                            className={`absolute -left-[35px] sm:-left-[43px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 ${style.bgClass} flex items-center justify-center shadow-sm bg-[var(--color-surface)]`}
                            aria-hidden="true"
                          >
                            <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${style.textClass}`} />
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* 2:3 Cover Thumbnail if present (self-contained per independence rule) */}
                              {event.bookCoverUrl ? (
                                <div className="w-12 h-18 sm:w-14 sm:h-21 rounded-md overflow-hidden bg-[var(--color-bg-secondary)] flex-shrink-0 shadow-sm border border-[var(--color-border-subtle)] aspect-[2/3]">
                                  <img
                                    src={event.bookCoverUrl}
                                    alt={`Cover for ${event.bookTitle || 'book'}`}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : event.bookTitle ? (
                                <div className="w-12 h-18 sm:w-14 sm:h-21 rounded-md bg-[var(--color-bg-secondary)] flex items-center justify-center flex-shrink-0 border border-[var(--color-border-subtle)] aspect-[2/3]">
                                  <BookOpen className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                                </div>
                              ) : null}

                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${style.bgClass} ${style.textClass}`}
                                  >
                                    {style.badgeLabel}
                                  </span>
                                  <span
                                    className="text-xs text-[var(--color-text-tertiary)]"
                                    title={formatFullTimestamp(event.timestamp)}
                                  >
                                    {formatRelativeTime(event.timestamp)}
                                  </span>
                                </div>

                                <p className="font-semibold text-sm sm:text-base text-[var(--color-text-primary)]">
                                  {event.bookId ? (
                                    <Link
                                      href={`/books/${event.bookId}`}
                                      className="hover:text-[var(--color-accent)] transition hover:underline"
                                    >
                                      {event.summary}
                                    </Link>
                                  ) : (
                                    event.summary
                                  )}
                                </p>

                                {event.detail && (
                                  <p className="text-xs text-[var(--color-text-secondary)] italic pt-0.5">
                                    {event.detail}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* View Book Link */}
                            {event.bookId && (
                              <Link
                                href={`/books/${event.bookId}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition self-start sm:self-center"
                              >
                                <span>View Book</span>
                                <span>&rarr;</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
