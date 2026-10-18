'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Flame,
  Star,
  Compass,
  Trophy,
  Zap,
  TrendingUp,
  Heart,
  Quote,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useBookshelf } from '@/context/BookshelfContext';
import { buildYearInReviewSnapshot } from '@/lib/stats/stats-engine';
import { AccessibleChartFrame } from '@/components/stats/AccessibleChartFrame';
import type { BookItem, MonthlyReadingBucket } from '@/types/bookshelf';

export default function YearInReviewPage() {
  const { books, sessions } = useBookshelf();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(2026);

  // Available completed years
  const availableYears = useMemo(() => {
    const years = new Set<number>([2026, 2025]);
    for (const b of books) {
      if (b.isRead && b.dateFinished) {
        const y = new Date(b.dateFinished).getUTCFullYear();
        if (!isNaN(y)) years.add(y);
      }
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  // Year-in-review snapshot
  const snapshot = useMemo(() => {
    return buildYearInReviewSnapshot(books, sessions, selectedYear);
  }, [books, sessions, selectedYear]);

  // Literary persona tag based on top genre
  const literaryPersona = useMemo(() => {
    const topGenre = snapshot.topGenres[0]?.genre.toLowerCase() || '';
    if (topGenre.includes('sci-fi') || topGenre.includes('space') || topGenre.includes('speculative')) {
      return { title: 'The Cosmic Explorer', quote: 'Traveling beyond lightspeed through pages of vast futures.' };
    }
    if (topGenre.includes('tech') || topGenre.includes('software') || topGenre.includes('programming')) {
      return { title: 'The Systems Craftsman', quote: 'Deconstructing complexity and building elegant mental models.' };
    }
    if (topGenre.includes('psychology') || topGenre.includes('thinking') || topGenre.includes('philosophy')) {
      return { title: 'The Deep Contemplator', quote: 'Seeking truths about human nature and the architecture of the mind.' };
    }
    if (topGenre.includes('history') || topGenre.includes('biography') || topGenre.includes('memoir')) {
      return { title: 'The Time Chronicler', quote: 'Walking in the shoes of giants and reflecting on lived histories.' };
    }
    if (topGenre.includes('classic') || topGenre.includes('literature')) {
      return { title: 'The Timeless Bibliophile', quote: 'Finding modern resonance in enduring human prose.' };
    }
    return { title: 'The Inquisitive Reader', quote: 'A curious mind traversing across diverse perspectives.' };
  }, [snapshot.topGenres]);

  // Max books in monthly breakdown for SVG scale
  const maxMonthlyBooks = useMemo(() => {
    return Math.max(1, ...snapshot.monthlyBreakdown.map((m) => m.booksFinished));
  }, [snapshot.monthlyBreakdown]);

  return (
    <AppShell>
      <div className="space-y-12 pb-20">
        {/* Storytelling Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-bg-secondary)] via-[var(--color-surface)] to-[var(--color-accent-subtle)]/40 p-6 sm:p-10 lg:p-12 border border-[var(--color-border-subtle)] shadow-sm">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[var(--color-accent)] text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Design Challenge #1 — Narrative Year-in-Review</span>
            </div>

            <h1 className="font-serif-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-text-primary)] leading-tight">
              {selectedYear === 'all'
                ? 'Your Entire Reading Odyssey'
                : selectedYear === 2026
                ? 'Your 2026 Reading Journey So Far'
                : `Your ${selectedYear} Year in Books`}
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
              Every page turned is a thought explored. Here is the chronicle of the worlds you visited, the authors who shaped you, and the cadence of your reading life.
            </p>

            {/* Year Selector Tabs */}
            <div
              role="tablist"
              aria-label="Select Review Year"
              className="flex flex-wrap items-center gap-2 pt-2"
            >
              {availableYears.map((yr) => {
                const isActive = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                      isActive
                        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {yr === 2026 ? '2026 So Far' : yr}
                  </button>
                );
              })}
              <button
                role="tab"
                aria-selected={selectedYear === 'all'}
                onClick={() => setSelectedYear('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  selectedYear === 'all'
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </section>

        {/* Light Reader Mode: Graceful, encouraging experience for < 5 books */}
        {snapshot.isLightReaderMode && (
          <section
            aria-labelledby="light-reader-heading"
            className="p-8 rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-subtle)]/30 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/15 text-[var(--color-accent)] flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6" />
            </div>
            <h2
              id="light-reader-heading"
              className="font-serif-heading text-2xl font-bold text-[var(--color-text-primary)]"
            >
              Every Chapter Counts
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto leading-relaxed">
              Reading isn’t a marathon or a race against numbers — it’s about the ideas that stayed with you. You completed{' '}
              <strong className="text-[var(--color-text-primary)] font-mono">
                {snapshot.totalBooksFinished} {snapshot.totalBooksFinished === 1 ? 'book' : 'books'}
              </strong>{' '}
              ({snapshot.totalPagesRead.toLocaleString()} pages) in {selectedYear === 'all' ? 'total' : selectedYear}.
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition shadow-sm"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Inspiring Titles in Discovery Hub</span>
              </Link>
            </div>
          </section>
        )}

        {/* Chapter 1: The Big Picture */}
        <section aria-labelledby="chapter-1-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            <span>Chapter 01</span>
            <span>&bull;</span>
            <span>The Big Picture</span>
          </div>
          <h2
            id="chapter-1-heading"
            className="font-serif-heading text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
          >
            Your Reading Footprint
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm space-y-1">
              <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Books Completed</span>
              </span>
              <p className="text-3xl sm:text-4xl font-bold font-mono text-[var(--color-text-primary)]">
                {snapshot.totalBooksFinished}
              </p>
              {snapshot.yoyBooksDeltaPercent !== null && (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-success)] bg-[var(--color-success)]/10 px-2 py-0.5 rounded-full mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    {snapshot.yoyBooksDeltaPercent >= 0 ? `+${snapshot.yoyBooksDeltaPercent}%` : `${snapshot.yoyBooksDeltaPercent}%`} vs prev year
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm space-y-1">
              <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Pages Turned</span>
              </span>
              <p className="text-3xl sm:text-4xl font-bold font-mono text-[var(--color-accent)]">
                {snapshot.totalPagesRead.toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Avg {snapshot.averageBookLengthPages}p per volume
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm space-y-1">
              <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Longest Reading Streak</span>
              </span>
              <p className="text-3xl sm:text-4xl font-bold font-mono text-[var(--color-text-primary)]">
                {snapshot.readingStreakDays}{' '}
                <span className="text-sm font-sans font-normal text-[var(--color-text-tertiary)]">
                  days
                </span>
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Consecutive daily reading habit
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm space-y-1">
              <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[var(--color-rating)]" />
                <span>Average Rating</span>
              </span>
              <p className="text-3xl sm:text-4xl font-bold font-mono text-[var(--color-rating)]">
                {snapshot.averageRating ? `${snapshot.averageRating} ★` : '—'}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Across rated books
              </p>
            </div>
          </div>
        </section>

        {/* Chapter 2: Your Literary DNA */}
        <section aria-labelledby="chapter-2-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            <span>Chapter 02</span>
            <span>&bull;</span>
            <span>Literary Persona & Genres</span>
          </div>
          <h2
            id="chapter-2-heading"
            className="font-serif-heading text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
          >
            Your Literary DNA
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Literary Archetype Card */}
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--color-accent)]/30 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-accent-subtle)]/30 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                  Reader Archetype
                </span>
                <h3 className="font-serif-heading text-2xl font-bold text-[var(--color-text-primary)] mt-1">
                  {literaryPersona.title}
                </h3>
                <blockquote className="mt-3 text-xs sm:text-sm text-[var(--color-text-secondary)] italic border-l-2 border-[var(--color-accent)] pl-3">
                  &ldquo;{literaryPersona.quote}&rdquo;
                </blockquote>
              </div>

              <div className="pt-6">
                <span className="text-xs text-[var(--color-text-tertiary)]">Top Preference:</span>
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                  {snapshot.topGenres[0]?.genre || 'Diverse Literature'} ({snapshot.topGenres[0]?.percentage || 100}%)
                </p>
              </div>
            </div>

            {/* Top Genres Breakdown */}
            <div className="md:col-span-2 p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-4">
              <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                Top Genres Read
              </h3>

              {snapshot.topGenres.length === 0 ? (
                <p className="text-xs text-[var(--color-text-tertiary)] italic">
                  No genre metadata available for the selected period.
                </p>
              ) : (
                <div className="space-y-3">
                  {snapshot.topGenres.slice(0, 5).map((g, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {g.genre}
                        </span>
                        <span className="font-mono text-[var(--color-text-tertiary)]">
                          {g.bookCount} {g.bookCount === 1 ? 'book' : 'books'} ({g.percentage}%) &bull; {g.totalPages.toLocaleString()}p
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-bg-secondary)] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--color-accent)] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, g.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Chapter 3: Bookish Superlatives & Hall of Fame */}
        <section aria-labelledby="chapter-3-heading" className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            <span>Chapter 03</span>
            <span>&bull;</span>
            <span>Milestones & Standouts</span>
          </div>
          <h2
            id="chapter-3-heading"
            className="font-serif-heading text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
          >
            Bookish Superlatives
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Longest Book */}
            {snapshot.longestBook && (
              <SuperlativeCard
                badge="Longest Book Conquered"
                icon={Trophy}
                book={snapshot.longestBook}
                stat={`${snapshot.longestBook.pageCount} Pages`}
              />
            )}

            {/* Shortest Gem */}
            {snapshot.shortestBook && (
              <SuperlativeCard
                badge="Shortest Concise Gem"
                icon={Zap}
                book={snapshot.shortestBook}
                stat={`${snapshot.shortestBook.pageCount} Pages`}
              />
            )}

            {/* Favorite Top Rated */}
            {snapshot.highestRatedBooks[0] && (
              <SuperlativeCard
                badge="Top Rated Masterpiece"
                icon={Award}
                book={snapshot.highestRatedBooks[0]}
                stat={`${snapshot.highestRatedBooks[0].rating}/5 Stars`}
              />
            )}
          </div>

          {/* 5-Star Hall of Fame */}
          {snapshot.highestRatedBooks.length > 0 && (
            <div className="mt-6 p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-heading text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Star className="w-5 h-5 text-[var(--color-rating)] fill-current" />
                    <span>Hall of Fame &mdash; Your Highest Rated Books</span>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    The stories, essays, and ideas that earned your highest praise.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {snapshot.highestRatedBooks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    className="group block p-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] transition-all bg-[var(--color-bg-primary)]/50"
                  >
                    <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-[var(--color-bg-secondary)] shadow-sm mb-2">
                      {book.coverUrl ? (
                        <img
                          src={book.coverUrl}
                          alt={`Cover of ${book.title}`}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col justify-between p-2 text-center bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
                          <span className="text-[9px] text-[var(--color-text-tertiary)]">Book</span>
                          <span className="font-serif-heading font-semibold text-[10px] text-[var(--color-text-primary)] line-clamp-2">
                            {book.title}
                          </span>
                          <span className="text-[9px] text-[var(--color-text-secondary)] line-clamp-1">
                            {book.author}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[var(--color-rating)] text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                        {book.rating}★
                      </div>
                    </div>
                    <p className="font-semibold text-xs text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-accent)]">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
                      {book.author}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Chapter 4: Seasonal Rhythm & Critic Insights */}
        <section aria-labelledby="chapter-4-heading" className="space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            <span>Chapter 04</span>
            <span>&bull;</span>
            <span>Cadence & Critic Insights</span>
          </div>
          <h2
            id="chapter-4-heading"
            className="font-serif-heading text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]"
          >
            Seasonal Reading Rhythm
          </h2>

          {/* Critic Insights Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {snapshot.mostProductiveMonth && (
              <div className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Most Productive Month</span>
                </span>
                <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1 font-serif-heading">
                  {snapshot.mostProductiveMonth.monthFull}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">
                  {snapshot.mostProductiveMonth.booksFinished} books &bull; {snapshot.mostProductiveMonth.pagesRead.toLocaleString()} pages
                </p>
              </div>
            )}

            {snapshot.mostGenerousMonth && (
              <div className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[var(--color-rating)]" />
                  <span>Most Generous Month</span>
                </span>
                <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1 font-serif-heading">
                  {snapshot.mostGenerousMonth.monthFull}
                </p>
                <p className="text-xs text-[var(--color-rating)] mt-0.5 font-mono">
                  {snapshot.mostGenerousMonth.averageRating}★ average rating
                </p>
              </div>
            )}

            {snapshot.harshestMonth && (
              <div className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Harshest Critic Month</span>
                </span>
                <p className="text-xl font-bold text-[var(--color-text-primary)] mt-1 font-serif-heading">
                  {snapshot.harshestMonth.monthFull}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">
                  {snapshot.harshestMonth.averageRating}★ average rating
                </p>
              </div>
            )}
          </div>

          {/* Monthly Reading Cadence SVG Chart Wrapped in AccessibleChartFrame */}
          <AccessibleChartFrame
            title="Monthly Reading Cadence"
            titleLevel="h3"
            subtitle="Books finished per month across the selected period"
            ariaLabel={`Bar chart showing monthly reading cadence for ${selectedYear}`}
            screenReaderSummary={`In ${selectedYear}, you finished a total of ${snapshot.totalBooksFinished} books. The most active month was ${snapshot.mostProductiveMonth?.monthFull ?? 'N/A'}.`}
            tableData={{
              caption: `Monthly books finished and pages read breakdown for ${selectedYear}`,
              headers: ['Month', 'Books Finished', 'Pages Read', 'Average Rating'],
              rows: snapshot.monthlyBreakdown.map((m: MonthlyReadingBucket) => [
                m.monthFull,
                m.booksFinished,
                m.pagesRead.toLocaleString(),
                m.averageRating ? `${m.averageRating} ★` : '—',
              ]),
              footers: [
                'Total',
                snapshot.totalBooksFinished,
                snapshot.totalPagesRead.toLocaleString(),
                snapshot.averageRating ? `${snapshot.averageRating} ★` : '—',
              ],
            }}
          >
            <div className="w-full pt-4 pb-2">
              <svg
                viewBox="0 0 600 200"
                className="w-full h-48 sm:h-56"
                aria-hidden="true"
              >
                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 170 - ratio * 140;
                  return (
                    <g key={idx}>
                      <line
                        x1="40"
                        y1={y}
                        x2="590"
                        y2={y}
                        stroke="var(--color-border-subtle)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x="32"
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="var(--color-text-tertiary)"
                        fontFamily="monospace"
                      >
                        {Math.round(ratio * maxMonthlyBooks)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars */}
                {snapshot.monthlyBreakdown.map((bucket, idx) => {
                  const barWidth = 32;
                  const x = 50 + idx * 45;
                  const height = (bucket.booksFinished / maxMonthlyBooks) * 140;
                  const y = 170 - height;
                  const isTopMonth =
                    snapshot.mostProductiveMonth?.monthShort === bucket.monthShort;

                  return (
                    <g key={bucket.monthShort} className="group cursor-pointer">
                      <title>{`${bucket.monthFull}: ${bucket.booksFinished} books finished, ${bucket.pagesRead} pages`}</title>
                      {/* Bar Rectangle */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(2, height)}
                        rx="4"
                        fill={isTopMonth ? 'var(--color-accent)' : 'var(--color-accent-subtle)'}
                        stroke={isTopMonth ? 'var(--color-accent-hover)' : 'var(--color-border)'}
                        className="transition-all hover:opacity-80"
                      />
                      {/* Bar Value on Top if > 0 */}
                      {bucket.booksFinished > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={Math.max(16, y - 6)}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill="var(--color-text-primary)"
                          fontFamily="monospace"
                        >
                          {bucket.booksFinished}
                        </text>
                      )}
                      {/* Month Label */}
                      <text
                        x={x + barWidth / 2}
                        y="188"
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--color-text-secondary)"
                        fontWeight={isTopMonth ? 'bold' : 'normal'}
                      >
                        {bucket.monthShort}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </AccessibleChartFrame>
        </section>
      </div>
    </AppShell>
  );
}

interface SuperlativeCardProps {
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  book: BookItem;
  stat: string;
}

function SuperlativeCard({ badge, icon: Icon, book, stat }: SuperlativeCardProps) {
  return (
    <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex gap-4 items-center shadow-sm hover:border-[var(--color-accent)] transition-all">
      {/* 2:3 Cover thumbnail (self-contained per independence rule) */}
      <div className="w-16 h-24 rounded-md overflow-hidden bg-[var(--color-bg-secondary)] flex-shrink-0 shadow border border-[var(--color-border-subtle)] aspect-[2/3]">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-between p-1.5 text-center bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
            <span className="text-[8px] text-[var(--color-text-tertiary)]">Book</span>
            <span className="font-serif-heading font-semibold text-[9px] text-[var(--color-text-primary)] line-clamp-2">
              {book.title}
            </span>
            <span className="text-[8px] text-[var(--color-text-secondary)] line-clamp-1">
              {book.author}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1 min-w-0 flex-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          <Icon className="w-3 h-3" />
          <span>{badge}</span>
        </span>
        <h4 className="font-serif-heading font-semibold text-sm text-[var(--color-text-primary)] line-clamp-1">
          <Link href={`/books/${book.id}`} className="hover:underline">
            {book.title}
          </Link>
        </h4>
        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
          {book.author}
        </p>
        <span className="inline-block text-xs font-mono font-bold text-[var(--color-accent)] pt-1">
          {stat}
        </span>
      </div>
    </div>
  );
}
