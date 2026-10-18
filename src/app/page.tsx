'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Accessibility,
  ArrowRight,
  BookMarked,
  BookOpen,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';

export default function LandingPage() {
  const { books, booksReadIn2026Count, currentYearGoal } = useBookshelf();

  // Pick 5 visually compelling books for the tactile hero stack
  const showcaseBooks = books.slice(0, 5);

  const targetGoal = currentYearGoal?.targetBooks ?? 24;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col">
      {/* Skip to Main Content Link for Keyboard / Screen Reader Users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg p-1"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white shadow-sm transition-transform group-hover:scale-105">
              <BookOpen className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
            </div>
            <span className="font-serif-heading text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Bookshelf
            </span>
          </Link>

          <nav aria-label="Main menu" className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/library"
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition"
            >
              Library
            </Link>
            <Link
              href="/discover"
              className="hidden sm:inline text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition"
            >
              Discover
            </Link>
            <Link
              href="/year-in-review"
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition"
            >
              2026 Review
            </Link>
            <Link
              href="/accessibility"
              className="hidden sm:inline text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition"
            >
              Accessibility
            </Link>
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-xs font-semibold shadow-sm hover:bg-[var(--color-accent-hover)] transition"
            >
              <span>Open Library</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 px-6 border-b border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)]/30 to-[var(--color-bg-primary)]">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Hero Copy */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent-subtle)] border border-[var(--color-border-subtle)] text-[var(--color-accent)] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Offline-First · Zero Cloud Lock-in · WCAG 2.2 AAA</span>
            </div>

            <h1 className="font-serif-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.15]">
              Your sanctuary for reading. Mindful, tactile, and private.
            </h1>

            <p className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto lg:mx-0">
              A personal reading tracker designed like a quiet corner in a beloved independent bookstore.
              Organize shelves, track your 2026 pace with page-level granularity, and relive your literary journey without subscriptions or algorithmic noise.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold shadow-md hover:bg-[var(--color-accent-hover)] transition-all transform hover:-translate-y-0.5"
              >
                <span>Open My Library</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                href="/year-in-review"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm font-semibold shadow-sm hover:bg-[var(--color-bg-tertiary)] transition"
              >
                <Sparkles className="w-4 h-4 text-[var(--color-rating)]" aria-hidden="true" />
                <span>Explore 2026 Year in Review</span>
              </Link>
            </div>

            {/* Live Stats Callout Bar */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <div className="text-2xl font-bold font-serif-heading text-[var(--color-accent)]">
                  {books.length > 0 ? books.length : 45}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">Curated Volumes</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-serif-heading text-[var(--color-text-primary)]">
                  {booksReadIn2026Count} / {targetGoal}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">2026 Goal Pace</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-serif-heading text-[var(--color-success)]">
                  100%
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">Private &amp; Offline</div>
              </div>
            </div>
          </div>

          {/* Right Hero Showcase: Tactile Book Covers */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none flex items-center justify-center">
            <div className="relative w-full h-[420px] flex items-center justify-center">
              {/* Decorative warm aura */}
              <div
                className="absolute w-72 h-72 rounded-full bg-[var(--color-accent)]/10 blur-3xl pointer-events-none"
                aria-hidden="true"
              />

              {/* Showcase Stack */}
              <div className="flex items-center -space-x-12 sm:-space-x-16 perspective-1000">
                {showcaseBooks.map((book, idx) => {
                  const rotation = (idx - 2) * 6;
                  const translateY = Math.abs(idx - 2) * 12;
                  return (
                    <div
                      key={book.id}
                      style={{
                        transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                        zIndex: 10 + (2 - Math.abs(idx - 2)),
                      }}
                      className="book-cover-interactive w-28 sm:w-36 md:w-40 aspect-[2/3] rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl relative shrink-0 transition-transform cursor-pointer"
                    >
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={`Cover of ${book.title} by ${book.author}`}
                          fill
                          sizes="(max-width: 768px) 140px, 180px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full p-3 flex flex-col justify-between bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
                          <span className="font-serif-heading font-bold text-xs text-[var(--color-text-primary)] line-clamp-3">
                            {book.title}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-secondary)]">
                            {book.author}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars Grid */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="font-serif-heading text-3xl font-bold text-[var(--color-text-primary)]">
            Everything your reading life deserves.
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Engineered with deep care for book lovers: rich tactile visuals, zero tracking, and deep data insight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mb-6">
                <BookMarked className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)] mb-3">
                Sensory Shelving &amp; Bulk Organization
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Organize seamlessly into Currently Reading, Want to Read, and Read. Create unlimited custom shelves like &quot;Favorites&quot; or &quot;Sci-Fi Classics&quot; with multi-book batch movements and genre tagging.
              </p>
            </div>
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline pt-2"
            >
              <span>Explore your shelves</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)] mb-3">
                Reading Pace &amp; 2026 Goal Projections
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Track by pages or percentages with realistic progress calculations. See if you are ahead, on track, or behind schedule with daily session logs and GitHub-style reading heatmaps.
              </p>
            </div>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline pt-2"
            >
              <span>View pace metrics</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mb-6">
                <UploadCloud className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)] mb-3">
                Goodreads Migration Pro &amp; Open Library
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Import your entire Goodreads export file in seconds with preview, duplicate resolution, and automatic shelf mapping. Search millions of titles live via Open Library API.
              </p>
            </div>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline pt-2"
            >
              <span>Import your Goodreads CSV</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mb-6">
                <Accessibility className="w-6 h-6" aria-hidden="true" />
              </div>
              <h3 className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)] mb-3">
                Accessibility-First (WCAG AAA) &amp; Privacy
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
                Tailored for every reader: 7:1 high contrast mode, OpenDyslexic font options, custom font sizes, zero tracking scripts, and offline storage directly in your browser&apos;s IndexedDB.
              </p>
            </div>
            <Link
              href="/accessibility"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-accent)] hover:underline pt-2"
            >
              <span>Inspect accessibility controls</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Literary Quote Callout */}
      <section className="py-16 px-6 bg-[var(--color-bg-secondary)] border-y border-[var(--color-border-subtle)] text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <blockquote className="font-serif-heading text-xl sm:text-2xl italic text-[var(--color-text-primary)] leading-relaxed">
            &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo;
          </blockquote>
          <cite className="block text-xs font-semibold tracking-wider uppercase text-[var(--color-text-tertiary)] not-italic">
            — George R.R. Martin, A Dance with Dragons
          </cite>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 px-6 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-[var(--color-accent)]" aria-hidden="true" />
            <span className="font-serif-heading font-semibold text-[var(--color-text-primary)]">
              Bookshelf
            </span>
            <span>· Personal Reading Tracker</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/library" className="hover:text-[var(--color-text-primary)] transition">
              Library
            </Link>
            <Link href="/discover" className="hover:text-[var(--color-text-primary)] transition">
              Discover
            </Link>
            <Link href="/year-in-review" className="hover:text-[var(--color-text-primary)] transition">
              2026 Year in Review
            </Link>
            <Link href="/accessibility" className="hover:text-[var(--color-text-primary)] transition">
              Accessibility Statement
            </Link>
            <Link href="/guest" className="hover:text-[var(--color-text-primary)] transition">
              Guest Sandbox
            </Link>
          </div>

          <p className="text-[11px]">
            Crafted for readers with offline IndexedDB storage.
          </p>
        </div>
      </footer>
    </div>
  );
}
