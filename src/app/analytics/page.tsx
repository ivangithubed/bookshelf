'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Flame,
  Clock,
  Star,
  BookOpen,
  TrendingUp,
  X,
  Award,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useBookshelf } from '@/context/BookshelfContext';
import { buildComprehensiveAnalyticsReport } from '@/lib/stats/stats-engine';
import { AccessibleChartFrame } from '@/components/stats/AccessibleChartFrame';
import type { BookItem } from '@/types/bookshelf';

// Distinct warm literary palette for chart slices
const GENRE_PALETTE = [
  '#a8612b', // Accent terracotta
  '#c8922b', // Amber gold
  '#2f6b40', // Forest emerald
  '#4a7b9d', // Slate river
  '#8b5a83', // Plum wine
  '#b8523b', // Crimson clay
  '#596e79', // Deep basalt
  '#8c7051', // Umber bronze
  '#417d72', // Aegean teal
  '#786b59', // Khaki sand
];

export default function AnalyticsPage() {
  const { books, sessions } = useBookshelf();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(2026);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);

  // Generate complete analytics report
  const report = useMemo(() => {
    return buildComprehensiveAnalyticsReport(books, sessions, selectedYear);
  }, [books, sessions, selectedYear]);

  // Books filtered by selected year and active genre filter
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (!b.isRead) return false;
      if (selectedYear !== 'all') {
        if (!b.dateFinished) return false;
        const y = new Date(b.dateFinished).getUTCFullYear();
        if (y !== selectedYear) return false;
      }
      if (selectedGenreFilter) {
        if (!b.genres.includes(selectedGenreFilter)) return false;
      }
      return true;
    });
  }, [books, selectedYear, selectedGenreFilter]);

  const maxPaceBooks = useMemo(() => {
    return Math.max(1, ...report.yearSnapshot.monthlyBreakdown.map((m) => m.booksFinished));
  }, [report.yearSnapshot.monthlyBreakdown]);

  // SVG Donut slices calculation
  const donutSlices = useMemo(() => {
    const totalCount = report.genreDistribution.reduce((acc, g) => acc + g.bookCount, 0);
    if (totalCount === 0) return [];

    let currentAngle = 0;
    return report.genreDistribution.slice(0, 8).map((item, idx) => {
      const sliceAngle = (item.bookCount / totalCount) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      // Coordinates for SVG arc path (radius 75..110)
      const rInner = 65;
      const rOuter = 105;
      const cx = 130;
      const cy = 130;

      const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
      const x1 = cx + rOuter * Math.cos(toRad(startAngle));
      const y1 = cy + rOuter * Math.sin(toRad(startAngle));
      const x2 = cx + rOuter * Math.cos(toRad(endAngle));
      const y2 = cy + rOuter * Math.sin(toRad(endAngle));

      const x3 = cx + rInner * Math.cos(toRad(endAngle));
      const y3 = cy + rInner * Math.sin(toRad(endAngle));
      const x4 = cx + rInner * Math.cos(toRad(startAngle));
      const y4 = cy + rInner * Math.sin(toRad(startAngle));

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const d = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      return {
        genre: item.genre,
        count: item.bookCount,
        percentage: item.percentage,
        color: GENRE_PALETTE[idx % GENRE_PALETTE.length]!,
        d,
      };
    });
  }, [report.genreDistribution]);

  // Calendar heatmap weeks layout (7 days per column)
  const heatmapWeeks = useMemo(() => {
    const weeks: Array<typeof report.calendarHeatmap> = [];
    let currentWeek: typeof report.calendarHeatmap = [];

    report.calendarHeatmap.forEach((cell, idx) => {
      currentWeek.push(cell);
      if (currentWeek.length === 7 || idx === report.calendarHeatmap.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }, [report]);

  const getHeatmapColor = (intensity: 0 | 1 | 2 | 3 | 4) => {
    switch (intensity) {
      case 1:
        return 'fill-orange-200 dark:fill-orange-950';
      case 2:
        return 'fill-orange-400 dark:fill-orange-800';
      case 3:
        return 'fill-orange-600 dark:fill-orange-600';
      case 4:
        return 'fill-orange-800 dark:fill-orange-400';
      default:
        return 'fill-[var(--color-bg-secondary)]';
    }
  };

  return (
    <AppShell>
      <div className="space-y-10 pb-20">
        {/* Header & Year Switcher */}
        <section className="border-b border-[var(--color-border-subtle)] pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)] mb-1">
                <BarChart3 className="w-4 h-4" />
                <span>Differentiator #5 — Reading Statistics Dashboard</span>
              </div>
              <h1 className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)]">
                Reading Analytics & Insights
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-2xl">
                Comprehensive data intelligence on your pace, genres, author diversity, ratings, and daily reading habits with 100% accessible table equivalents.
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                Year:
              </span>
              <div
                role="tablist"
                aria-label="Filter Analytics by Year"
                className="inline-flex rounded-xl p-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]"
              >
                {report.availableYears.map((yr) => (
                  <button
                    key={yr}
                    role="tab"
                    aria-selected={selectedYear === yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedYear === yr
                        ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
                <button
                  role="tab"
                  aria-selected={selectedYear === 'all'}
                  onClick={() => setSelectedYear('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedYear === 'all'
                      ? 'bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Top Summary Banner */}
        <section aria-labelledby="analytics-summary-heading">
          <h2 id="analytics-summary-heading" className="sr-only">
            Key Reading Statistics
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
              <span className="text-xs text-[var(--color-text-tertiary)]">Total Completed</span>
              <p className="text-3xl font-bold font-mono text-[var(--color-text-primary)] mt-1">
                {report.yearSnapshot.totalBooksFinished}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                {selectedYear === 'all' ? 'All recorded books' : `Books finished in ${selectedYear}`}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
              <span className="text-xs text-[var(--color-text-tertiary)]">Total Pages</span>
              <p className="text-3xl font-bold font-mono text-[var(--color-accent)] mt-1">
                {report.yearSnapshot.totalPagesRead.toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                Avg {report.yearSnapshot.averageBookLengthPages}p per title
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
              <span className="text-xs text-[var(--color-text-tertiary)]">Average Rating</span>
              <p className="text-3xl font-bold font-mono text-[var(--color-rating)] mt-1">
                {report.yearSnapshot.averageRating ? `${report.yearSnapshot.averageRating} ★` : '—'}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                Across {books.filter((b) => b.isRead && b.rating).length} rated titles
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-sm">
              <span className="text-xs text-[var(--color-text-tertiary)]">Author Diversity</span>
              <p className="text-3xl font-bold font-mono text-[var(--color-success)] mt-1">
                {Math.round(report.authorDiversity.diversityRatio * 100)}%
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                {report.authorDiversity.uniqueAuthorsCount} unique voices
              </p>
            </div>
          </div>
        </section>

        {/* 7 Required Visualizations Grid */}
        <section aria-labelledby="visualizations-grid-heading" className="space-y-8">
          <h2 id="visualizations-grid-heading" className="sr-only">
            Detailed Charts and Visualizations
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Reading Pace Chart (Monthly books and pages read) */}
            <AccessibleChartFrame
              title="1. Reading Pace & Monthly Volumes"
              titleLevel="h3"
              subtitle="Dual analysis of books completed (bars) and pages read (trend)"
              ariaLabel="Monthly reading pace bar chart showing books finished and pages read"
              screenReaderSummary="Reading pace chart broken down by 12 months, depicting monthly book completions and pages read."
              tableData={{
                caption: `Reading pace breakdown for ${selectedYear}`,
                headers: ['Month', 'Books Finished', 'Pages Read', 'Average Rating'],
                rows: report.yearSnapshot.monthlyBreakdown.map((m) => [
                  m.monthFull,
                  m.booksFinished,
                  m.pagesRead.toLocaleString(),
                  m.averageRating ? `${m.averageRating} ★` : '—',
                ]),
                footers: [
                  'Total',
                  report.yearSnapshot.totalBooksFinished,
                  report.yearSnapshot.totalPagesRead.toLocaleString(),
                  report.yearSnapshot.averageRating ? `${report.yearSnapshot.averageRating} ★` : '—',
                ],
              }}
            >
              <div className="w-full pt-3">
                <svg viewBox="0 0 540 180" className="w-full h-44 sm:h-52" aria-hidden="true">
                  {/* Grid */}
                  {[0, 0.5, 1].map((r, i) => {
                    const y = 145 - r * 115;
                    return (
                      <line
                        key={i}
                        x1="35"
                        y1={y}
                        x2="530"
                        y2={y}
                        stroke="var(--color-border-subtle)"
                        strokeDasharray="4 4"
                      />
                    );
                  })}

                  {/* Bars & Labels */}
                  {report.yearSnapshot.monthlyBreakdown.map((bucket, idx) => {
                    const barWidth = 24;
                    const x = 45 + idx * 40;
                    const barHeight = (bucket.booksFinished / maxPaceBooks) * 115;
                    const y = 145 - barHeight;

                    return (
                      <g key={bucket.monthShort} className="group cursor-pointer">
                        <title>{`${bucket.monthFull}: ${bucket.booksFinished} books, ${bucket.pagesRead} pages`}</title>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={Math.max(2, barHeight)}
                          rx="3"
                          fill="var(--color-accent)"
                          className="hover:opacity-80 transition-opacity"
                        />
                        {bucket.booksFinished > 0 && (
                          <text
                            x={x + barWidth / 2}
                            y={Math.max(14, y - 4)}
                            textAnchor="middle"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="var(--color-text-primary)"
                          >
                            {bucket.booksFinished}
                          </text>
                        )}
                        <text
                          x={x + barWidth / 2}
                          y="162"
                          textAnchor="middle"
                          fontSize="10"
                          fill="var(--color-text-secondary)"
                        >
                          {bucket.monthShort}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </AccessibleChartFrame>

            {/* 2. Genre Distribution Donut Chart (Interactive) */}
            <AccessibleChartFrame
              title="2. Genre Distribution"
              titleLevel="h3"
              subtitle="Click any slice or label to filter the books catalog below"
              badge={selectedGenreFilter ? `Filter: ${selectedGenreFilter}` : undefined}
              ariaLabel="Donut chart showing proportional distribution of genres"
              screenReaderSummary="Interactive genre distribution donut chart displaying percentage share of library genres."
              actions={
                selectedGenreFilter && (
                  <button
                    type="button"
                    onClick={() => setSelectedGenreFilter(null)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Filter</span>
                  </button>
                )
              }
              tableData={{
                caption: 'Genre breakdown showing book count and percentage',
                headers: ['Genre', 'Book Count', 'Percentage', 'Pages', 'Avg Rating'],
                rows: report.genreDistribution.map((g) => [
                  g.genre,
                  g.bookCount,
                  `${g.percentage}%`,
                  g.totalPages.toLocaleString(),
                  g.averageRating ? `${g.averageRating} ★` : '—',
                ]),
              }}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
                {/* SVG Donut */}
                <div className="relative w-52 h-52 flex-shrink-0">
                  <svg viewBox="0 0 260 260" className="w-full h-full" aria-hidden="true">
                    {donutSlices.map((slice, idx) => {
                      const isSelected = selectedGenreFilter === slice.genre;
                      return (
                        <path
                          key={idx}
                          d={slice.d}
                          fill={slice.color}
                          stroke="var(--color-surface)"
                          strokeWidth={isSelected ? '3' : '1.5'}
                          className="cursor-pointer transition-transform hover:opacity-85 focus:outline-none"
                          tabIndex={0}
                          onClick={() =>
                            setSelectedGenreFilter(
                              selectedGenreFilter === slice.genre ? null : slice.genre
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedGenreFilter(
                                selectedGenreFilter === slice.genre ? null : slice.genre
                              );
                            }
                          }}
                        >
                          <title>{`${slice.genre}: ${slice.count} books (${slice.percentage}%)`}</title>
                        </path>
                      );
                    })}
                  </svg>
                  {/* Center Stat */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      Genres
                    </span>
                    <span className="font-mono font-bold text-xl text-[var(--color-text-primary)]">
                      {report.genreDistribution.length}
                    </span>
                  </div>
                </div>

                {/* Clickable Legend */}
                <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs scrollbar-thin">
                  {report.genreDistribution.slice(0, 8).map((item, idx) => {
                    const isSelected = selectedGenreFilter === item.genre;
                    const color = GENRE_PALETTE[idx % GENRE_PALETTE.length];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setSelectedGenreFilter(
                            selectedGenreFilter === item.genre ? null : item.genre
                          )
                        }
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-all text-left ${
                          isSelected
                            ? 'bg-[var(--color-accent-subtle)] border-[var(--color-accent)] font-semibold'
                            : 'border-transparent hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="truncate text-[var(--color-text-primary)]">
                            {item.genre}
                          </span>
                        </div>
                        <span className="font-mono text-[var(--color-text-tertiary)] ml-2">
                          {item.bookCount} ({item.percentage}%)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </AccessibleChartFrame>

            {/* 3. Page Count Distribution Histogram */}
            <AccessibleChartFrame
              title="3. Page Count Histogram"
              titleLevel="h3"
              subtitle="Distribution across volume length tiers (<200p to 500p+)"
              ariaLabel="Bar chart of book distribution across length buckets"
              screenReaderSummary="Page length distribution showing book counts across categories under 200 pages, 200 to 349 pages, 350 to 499 pages, and 500 plus pages."
              tableData={{
                caption: 'Page count distribution breakdown',
                headers: ['Length Tier', 'Book Count', 'Share'],
                rows: report.pageCountHistogram.map((tier) => [
                  tier.label,
                  tier.count,
                  `${tier.percentage}%`,
                ]),
              }}
            >
              <div className="space-y-3 pt-2">
                {report.pageCountHistogram.map((tier, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {tier.label}
                      </span>
                      <span className="font-mono text-[var(--color-text-tertiary)]">
                        {tier.count} {tier.count === 1 ? 'book' : 'books'} ({tier.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--color-bg-secondary)] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[var(--color-accent)] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, tier.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </AccessibleChartFrame>

            {/* 4. Rating Patterns & Critic Insights */}
            <AccessibleChartFrame
              title="4. Rating Patterns & Critic Insights"
              titleLevel="h3"
              subtitle="Star rating distribution from 5 stars to 1 star"
              ariaLabel="Horizontal bar chart of 1 to 5 star rating distribution"
              screenReaderSummary="Star rating patterns from 5 stars to 1 star, with overall average rating and critic month indicators."
              tableData={{
                caption: 'Rating distribution from 5 to 1 star',
                headers: ['Stars', 'Book Count', 'Share'],
                rows: report.ratingDistribution.map((r) => [
                  `${r.stars} Stars`,
                  r.count,
                  `${r.percentage}%`,
                ]),
              }}
            >
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  {report.ratingDistribution.map((r) => (
                    <div key={r.stars} className="flex items-center gap-3 text-xs">
                      <span className="w-16 font-mono text-[var(--color-rating)] flex items-center gap-1 font-bold">
                        <span>{r.stars}</span>
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </span>
                      <div className="flex-1 bg-[var(--color-bg-secondary)] h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[var(--color-rating)] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(2, r.percentage))}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-mono text-[var(--color-text-tertiary)]">
                        {r.count} ({r.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>

                {/* Sub-cards: Most generous vs harshest month */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border-subtle)] text-xs">
                  <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      Most Generous Month
                    </span>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {report.yearSnapshot.mostGenerousMonth?.monthFull || 'N/A'}
                    </span>
                    <span className="text-[11px] text-[var(--color-rating)] block font-mono">
                      {report.yearSnapshot.mostGenerousMonth?.averageRating
                        ? `${report.yearSnapshot.mostGenerousMonth.averageRating}★ average`
                        : '—'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      Harshest Critic Month
                    </span>
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">
                      {report.yearSnapshot.harshestMonth?.monthFull || 'N/A'}
                    </span>
                    <span className="text-[11px] text-[var(--color-accent)] block font-mono">
                      {report.yearSnapshot.harshestMonth?.averageRating
                        ? `${report.yearSnapshot.harshestMonth.averageRating}★ average`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </AccessibleChartFrame>
          </div>

          {/* 5. Author Diversity Analysis */}
          <AccessibleChartFrame
            title="5. Author Diversity & Leaderboard"
            titleLevel="h3"
            subtitle="Evaluating author variety, repeat-read patterns, and top creators"
            ariaLabel="Leaderboard of most read authors and diversity metrics"
            screenReaderSummary="Author diversity analysis showing unique author counts and top 5 most read authors."
            tableData={{
              caption: 'Top authors leaderboard',
              headers: ['Author', 'Books in Library', 'Read Count', 'Average Rating'],
              rows: report.authorDiversity.topAuthors.map((a) => [
                a.author,
                a.bookCount,
                a.readCount,
                a.averageRating ? `${a.averageRating} ★` : '—',
              ]),
            }}
          >
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Unique Authors</span>
                  <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                    {report.authorDiversity.uniqueAuthorsCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Total Books Considered</span>
                  <p className="text-2xl font-bold font-mono text-[var(--color-accent)]">
                    {report.authorDiversity.totalBooksCount}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
                  <span className="text-xs text-[var(--color-text-tertiary)]">Diversity Ratio</span>
                  <p className="text-2xl font-bold font-mono text-[var(--color-success)]">
                    {Math.round(report.authorDiversity.diversityRatio * 100)}%
                  </p>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] font-semibold border-b border-[var(--color-border-subtle)]">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">
                        Author
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Books
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Times Read
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right">
                        Avg Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-subtle)]">
                    {report.authorDiversity.topAuthors.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-bg-primary)]/50">
                        <td className="px-4 py-2.5 font-medium text-[var(--color-text-primary)]">
                          {item.author}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-primary)]">
                          {item.bookCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[var(--color-text-secondary)]">
                          {item.readCount}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-[var(--color-rating)]">
                          {item.averageRating ? `${item.averageRating}★` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AccessibleChartFrame>

          {/* 6. Daily Reading Calendar Heatmap (GitHub-style 52 weeks) */}
          <AccessibleChartFrame
            title="6. Daily Reading Activity Heatmap"
            titleLevel="h3"
            subtitle="GitHub-style 52-week calendar grid of daily reading sessions and pages turned"
            ariaLabel="Calendar heatmap grid showing daily reading activity"
            screenReaderSummary={`Daily reading calendar heatmap displaying ${report.calendarHeatmap.length} days of reading history.`}
            tableData={{
              caption: 'Daily reading activity summary',
              headers: ['Metric', 'Value'],
              rows: [
                ['Total Tracked Days', report.calendarHeatmap.length],
                [
                  'Active Reading Days',
                  report.calendarHeatmap.filter((c) => c.pagesRead > 0).length,
                ],
                [
                  'Peak Daily Pages',
                  Math.max(0, ...report.calendarHeatmap.map((c) => c.pagesRead)),
                ],
              ],
            }}
          >
            <div className="space-y-3 pt-2">
              <div className="overflow-x-auto pb-2">
                <svg
                  viewBox={`0 0 ${heatmapWeeks.length * 14 + 20} 115`}
                  className="h-28 min-w-[700px] w-full"
                  aria-hidden="true"
                >
                  {heatmapWeeks.map((week, wIdx) => {
                    const x = wIdx * 14;
                    return (
                      <g key={wIdx}>
                        {week.map((cell, dIdx) => {
                          const y = dIdx * 14;
                          return (
                            <rect
                              key={cell.date}
                              x={x}
                              y={y}
                              width="10"
                              height="10"
                              rx="2"
                              className={`${getHeatmapColor(
                                cell.intensity
                              )} hover:stroke-[var(--color-accent)] hover:stroke-1 cursor-pointer transition-colors`}
                            >
                              <title>{`${cell.date}: ${cell.pagesRead} pages read (${cell.sessionsCount} sessions)`}</title>
                            </rect>
                          );
                        })}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Heatmap Legend */}
              <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border-subtle)]">
                <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono">
                  {report.calendarHeatmap.filter((c) => c.pagesRead > 0).length} active reading days
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]" />
                  <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-950" />
                  <div className="w-3 h-3 rounded-sm bg-orange-400 dark:bg-orange-800" />
                  <div className="w-3 h-3 rounded-sm bg-orange-600 dark:bg-orange-600" />
                  <div className="w-3 h-3 rounded-sm bg-orange-800 dark:bg-orange-400" />
                  <span>More</span>
                </div>
              </div>
            </div>
          </AccessibleChartFrame>

          {/* 7. Time-to-Finish & Comparative YoY Analysis */}
          <AccessibleChartFrame
            title="7. Time-to-Finish & Comparative YoY Analysis"
            titleLevel="h3"
            subtitle="Velocity benchmarks and year-over-year progression metrics"
            ariaLabel="Comparative analysis of reading pace and time to finish books"
            screenReaderSummary="Reading velocity statistics including average days to finish a book, fastest book finished, and year over year comparisons."
            tableData={{
              caption: 'Time to finish metrics and YoY delta',
              headers: ['Velocity Metric', 'Result'],
              rows: [
                [
                  'Average Days to Finish',
                  report.timeToFinish.averageDaysToFinish
                    ? `${report.timeToFinish.averageDaysToFinish} days`
                    : 'N/A',
                ],
                [
                  'Fastest Book Conquered',
                  report.timeToFinish.fastestBook
                    ? `${report.timeToFinish.fastestBook.book.title} (${report.timeToFinish.fastestBook.days} days)`
                    : 'N/A',
                ],
                [
                  'Slowest Book Conquered',
                  report.timeToFinish.slowestBook
                    ? `${report.timeToFinish.slowestBook.book.title} (${report.timeToFinish.slowestBook.days} days)`
                    : 'N/A',
                ],
                [
                  'YoY Book Volume Delta',
                  report.yearSnapshot.yoyBooksDeltaPercent !== null
                    ? `${report.yearSnapshot.yoyBooksDeltaPercent}%`
                    : 'N/A',
                ],
              ],
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  <span>Avg Days to Finish</span>
                </span>
                <p className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-1">
                  {report.timeToFinish.averageDaysToFinish
                    ? `${report.timeToFinish.averageDaysToFinish}d`
                    : '—'}
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  Start to completion velocity
                </p>
              </div>

              {report.timeToFinish.fastestBook && (
                <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                  <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>Fastest Conquered</span>
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1 line-clamp-1">
                    {report.timeToFinish.fastestBook.book.title}
                  </p>
                  <p className="text-xs font-mono font-bold text-[var(--color-success)] mt-0.5">
                    {report.timeToFinish.fastestBook.days} {report.timeToFinish.fastestBook.days === 1 ? 'day' : 'days'}
                  </p>
                </div>
              )}

              {report.timeToFinish.slowestBook && (
                <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                  <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                    <span>Longest Journey</span>
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1 line-clamp-1">
                    {report.timeToFinish.slowestBook.book.title}
                  </p>
                  <p className="text-xs font-mono font-bold text-[var(--color-accent)] mt-0.5">
                    {report.timeToFinish.slowestBook.days} days
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
                <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--color-success)]" />
                  <span>YoY Volume Delta</span>
                </span>
                <p className="text-2xl font-bold font-mono text-[var(--color-success)] mt-1">
                  {report.yearSnapshot.yoyBooksDeltaPercent !== null
                    ? `${report.yearSnapshot.yoyBooksDeltaPercent >= 0 ? '+' : ''}${report.yearSnapshot.yoyBooksDeltaPercent}%`
                    : 'Baseline'}
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                  vs previous annual cycle
                </p>
              </div>
            </div>
          </AccessibleChartFrame>
        </section>

        {/* Filtered Books Catalog Deep-Dive (Controlled by Chart Interactions) */}
        <section
          aria-labelledby="filtered-catalog-heading"
          className="border-t border-[var(--color-border-subtle)] pt-8 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2
                id="filtered-catalog-heading"
                className="font-serif-heading text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2"
              >
                <span>Matching Books</span>
                <span className="text-xs font-normal text-[var(--color-text-tertiary)] font-mono">
                  ({filteredBooks.length} titles)
                </span>
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {selectedGenreFilter
                  ? `Showing completed books tagged with "${selectedGenreFilter}" in ${selectedYear}`
                  : `Showing all completed books for ${selectedYear}`}
              </p>
            </div>

            {selectedGenreFilter && (
              <button
                type="button"
                onClick={() => setSelectedGenreFilter(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset to All Genres</span>
              </button>
            )}
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
              <BookOpen className="w-8 h-8 mx-auto text-[var(--color-text-tertiary)] mb-2" />
              <p className="text-xs text-[var(--color-text-secondary)]">
                No completed books match the selected filter combination.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredBooks.map((book: BookItem) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="group block p-2.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-accent)] transition-all shadow-sm"
                >
                  {/* 2:3 Cover thumbnail (self-contained per independence rule) */}
                  <div className="relative aspect-[2/3] w-full rounded-md overflow-hidden bg-[var(--color-bg-secondary)] mb-2 shadow-sm">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={`Cover of ${book.title}`}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col justify-between p-2 text-center bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
                        <span className="text-[8px] text-[var(--color-text-tertiary)]">Book</span>
                        <span className="font-serif-heading font-semibold text-[9px] text-[var(--color-text-primary)] line-clamp-2">
                          {book.title}
                        </span>
                        <span className="text-[8px] text-[var(--color-text-secondary)] line-clamp-1">
                          {book.author}
                        </span>
                      </div>
                    )}
                    {book.rating && (
                      <div className="absolute top-1 right-1 bg-black/75 text-[var(--color-rating)] text-[9px] font-mono font-bold px-1 py-0.5 rounded">
                        {book.rating}★
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-accent)]">
                    {book.title}
                  </h4>
                  <p className="text-[10px] text-[var(--color-text-secondary)] line-clamp-1">
                    {book.author}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
