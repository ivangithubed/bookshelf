import { describe, expect, it } from 'vitest';
import { buildCuratedSeedData } from '@/lib/seed/seed-data';
import {
  buildComprehensiveAnalyticsReport,
  buildYearInReviewSnapshot,
  calculateReadingGoalProgress,
} from '@/lib/stats/stats-engine';
import {
  CURATED_DISCOVERY_COLLECTIONS,
  buildPersonalizedRecommendations,
  normalizeOpenLibraryDoc,
} from '@/lib/open-library/client';
import type { ReadingGoal } from '@/types/bookshelf';

describe('Seed Data & Stats Engine', () => {
  describe('buildCuratedSeedData (Guest Experience & Edge Cases)', () => {
    const seed = buildCuratedSeedData();

    it('creates exactly 45 total curated books', () => {
      expect(seed.books).toHaveLength(45);
    });

    it('matches curated shelf distribution including 5 currently-reading and 5 favorites', () => {
      const cr = seed.books.filter((b) => b.shelfId === 'currently-reading');
      const wtr = seed.books.filter((b) => b.shelfId === 'want-to-read');
      const read = seed.books.filter((b) => b.shelfId === 'read');
      const fav = seed.books.filter((b) => b.shelfId === 'favorites');

      expect(cr).toHaveLength(5);
      expect(fav).toHaveLength(5);
      expect(wtr.length).toBeGreaterThanOrEqual(10);
      expect(read.length).toBeGreaterThanOrEqual(20);

      const totalCompleted = seed.books.filter((b) => b.isRead);
      expect(totalCompleted.length).toBeGreaterThanOrEqual(25);
    });

    it('has exactly 15 books finished in 2026', () => {
      const finished2026 = seed.books.filter(
        (b) => b.isRead && b.dateFinished && b.dateFinished.startsWith('2026-')
      );
      expect(finished2026).toHaveLength(15);

      const finished2025 = seed.books.filter(
        (b) => b.isRead && b.dateFinished && b.dateFinished.startsWith('2025-')
      );
      expect(finished2025.length).toBeGreaterThanOrEqual(10);
    });

    it('preserves all metadata edge cases from sample data specification', () => {
      // 5 books missing cover image
      const missingCovers = seed.books.filter((b) => b.coverUrl === null);
      expect(missingCovers).toHaveLength(5);
      const missingCoverTitles = missingCovers.map((b) => b.title);
      expect(missingCoverTitles.some((t) => t.includes('Piranesi'))).toBe(true);
      expect(missingCoverTitles.some((t) => t.includes('The Dispossessed'))).toBe(true);
      expect(missingCoverTitles.some((t) => t.includes('Four Thousand Weeks'))).toBe(true);
      expect(missingCoverTitles.some((t) => t.includes('Thinking in Bets'))).toBe(true);
      expect(missingCoverTitles.some((t) => t.includes('A Philosophy of Software Design'))).toBe(true);

      // 2 books missing page count
      const missingPages = seed.books.filter((b) => b.pageCount === null);
      expect(missingPages).toHaveLength(2);
      const missingPageTitles = missingPages.map((b) => b.title);
      expect(missingPageTitles.some((t) => t.includes('Eloquent JavaScript'))).toBe(true);
      expect(missingPageTitles.some((t) => t.includes('Say Nothing'))).toBe(true);

      // 1 book with no ISBN at all
      const noIsbn = seed.books.filter((b) => b.isbn10 === null && b.isbn13 === null);
      expect(noIsbn).toHaveLength(1);
      expect(noIsbn[0]?.title).toBe('Eloquent JavaScript');

      // Multi-author book
      const pragmatic = seed.books.find((b) => b.title === 'The Pragmatic Programmer');
      expect(pragmatic?.author).toBe('David Thomas, Andrew Hunt');
    });

    it('populates reading sessions and timeline activity events', () => {
      expect(seed.sessions.length).toBeGreaterThan(30);
      expect(seed.events.length).toBeGreaterThan(45);
      expect(seed.goals).toHaveLength(2);
    });
  });

  describe('calculateReadingGoalProgress (Core #6)', () => {
    const seed = buildCuratedSeedData();
    const goal2026: ReadingGoal = {
      year: 2026,
      targetBooks: 24,
      updatedAt: '2026-01-01T08:00:00.000Z',
    };
    const refDate = new Date('2026-10-18T12:00:00.000Z');

    it('calculates 15 completed books out of 24 for 2026 goal', () => {
      const progress = calculateReadingGoalProgress(seed.books, goal2026, refDate);
      expect(progress).not.toBeNull();
      expect(progress?.completedBooks).toBe(15);
      expect(progress?.targetBooks).toBe(24);
      expect(progress?.percentComplete).toBe(63);
      expect(progress?.isGoalMet).toBe(false);
    });

    it('calculates expected pace and pace status correctly', () => {
      const progress = calculateReadingGoalProgress(seed.books, goal2026, refDate);
      expect(progress?.expectedBooksByToday).toBeGreaterThan(18);
      // On day 291/365, expected is ~19.1 books, so 15 completed means behind
      expect(progress?.paceStatus).toBe('behind');
      expect(progress?.paceMessage).toContain('behind schedule');
    });

    it('returns ahead when ahead of schedule or goal is completed', () => {
      const easyGoal: ReadingGoal = {
        year: 2026,
        targetBooks: 12,
        updatedAt: '2026-01-01T08:00:00.000Z',
      };
      const progress = calculateReadingGoalProgress(seed.books, easyGoal, refDate);
      expect(progress?.isGoalMet).toBe(true);
      expect(progress?.paceStatus).toBe('ahead');
      expect(progress?.paceMessage).toContain('Goal achieved');
    });

    it('returns null when goal is null', () => {
      expect(calculateReadingGoalProgress(seed.books, null, refDate)).toBeNull();
    });
  });

  describe('buildYearInReviewSnapshot (Design Challenge #1)', () => {
    const seed = buildCuratedSeedData();
    const refDate = new Date('2026-10-18T12:00:00.000Z');

    it('builds 2026 year-in-review snapshot with 15 completed books', () => {
      const snap = buildYearInReviewSnapshot(seed.books, seed.sessions, 2026, refDate);
      expect(snap.year).toBe(2026);
      expect(snap.totalBooksFinished).toBe(15);
      expect(snap.totalPagesRead).toBeGreaterThan(4000);
      expect(snap.averageRating).toBeGreaterThanOrEqual(3.5);
      expect(snap.isIncompleteYear).toBe(true);
      expect(snap.isLightReaderMode).toBe(false);
      expect(snap.monthlyBreakdown).toHaveLength(12);
      expect(snap.longestBook).not.toBeNull();
      expect(snap.shortestBook).not.toBeNull();
      expect(snap.topGenres.length).toBeGreaterThan(0);
      expect(snap.highestRatedBooks.length).toBeGreaterThan(0);
      expect(snap.readingStreakDays).toBeGreaterThanOrEqual(1);
    });

    it('builds 2025 year-in-review snapshot with completed books', () => {
      const snap = buildYearInReviewSnapshot(seed.books, seed.sessions, 2025, refDate);
      expect(snap.year).toBe(2025);
      expect(snap.totalBooksFinished).toBeGreaterThanOrEqual(10);
      expect(snap.isIncompleteYear).toBe(false);
    });

    it('builds all-time snapshot with all completed books', () => {
      const completedCount = seed.books.filter((b) => b.isRead).length;
      const snap = buildYearInReviewSnapshot(seed.books, seed.sessions, 'all', refDate);
      expect(snap.totalBooksFinished).toBe(completedCount);
      expect(snap.isLightReaderMode).toBe(false);
    });
  });

  describe('buildComprehensiveAnalyticsReport (Differentiator #5)', () => {
    const seed = buildCuratedSeedData();
    const refDate = new Date('2026-10-18T12:00:00.000Z');

    it('builds full analytics dashboard data structures', () => {
      const report = buildComprehensiveAnalyticsReport(
        seed.books,
        seed.sessions,
        2026,
        refDate
      );

      expect(report.selectedYear).toBe(2026);
      expect(report.availableYears).toContain(2026);
      expect(report.availableYears).toContain(2025);

      // Genre distribution
      expect(report.genreDistribution.length).toBeGreaterThan(0);
      expect(report.genreDistribution[0]?.bookCount).toBeGreaterThan(0);

      // Page Count Histogram
      expect(report.pageCountHistogram).toHaveLength(5);
      const totalInHistogram = report.pageCountHistogram.reduce((sum, h) => sum + h.count, 0);
      expect(totalInHistogram).toBe(15);

      // Rating distribution
      expect(report.ratingDistribution).toHaveLength(5);
      expect(report.ratingDistribution[0]?.stars).toBe(5);

      // Author Diversity
      expect(report.authorDiversity.totalBooksCount).toBe(15);
      expect(report.authorDiversity.uniqueAuthorsCount).toBeGreaterThan(5);
      expect(report.authorDiversity.diversityRatio).toBeGreaterThan(0);
      expect(report.authorDiversity.topAuthors.length).toBeGreaterThan(0);

      // Calendar Heatmap (365 days)
      expect(report.calendarHeatmap).toHaveLength(365);
      expect(report.calendarHeatmap.some((c) => c.pagesRead > 0)).toBe(true);

      // Time to finish
      expect(report.timeToFinish.averageDaysToFinish).not.toBeNull();
      expect(report.timeToFinish.fastestBook).not.toBeNull();
      expect(report.timeToFinish.slowestBook).not.toBeNull();
    });
  });

  describe('Open Library Discovery & Recommendations', () => {
    it('normalizes a raw Open Library search document', () => {
      const rawDoc: Record<string, unknown> = {
        key: '/works/OL12345W',
        title: 'Designing Data-Intensive Applications',
        author_name: ['Martin Kleppmann'],
        first_publish_year: 2017,
        number_of_pages_median: 616,
        isbn: ['1449373321', '9781449373320'],
        cover_i: 8321045,
        publisher: ["O'Reilly Media"],
        subject: ['Databases', 'Distributed Systems'],
      };

      const candidate = normalizeOpenLibraryDoc(rawDoc);
      expect(candidate.workKey).toBe('/works/OL12345W');
      expect(candidate.title).toBe('Designing Data-Intensive Applications');
      expect(candidate.author).toBe('Martin Kleppmann');
      expect(candidate.pageCount).toBe(616);
      expect(candidate.isbn13).toBe('9781449373320');
      expect(candidate.isbn10).toBe('1449373321');
      expect(candidate.coverUrl).toBe('https://covers.openlibrary.org/b/id/8321045-L.jpg');
      expect(candidate.genres).toContain('Databases');
    });

    it('provides 5 curated discovery collections with rich books', () => {
      expect(CURATED_DISCOVERY_COLLECTIONS).toHaveLength(5);
      for (const col of CURATED_DISCOVERY_COLLECTIONS) {
        expect(col.books.length).toBeGreaterThanOrEqual(4);
        for (const book of col.books) {
          expect(book.title).toBeTruthy();
          expect(book.author).toBeTruthy();
        }
      }
    });

    it('generates personalized recommendations based on library content', () => {
      const seed = buildCuratedSeedData();
      const recs = buildPersonalizedRecommendations(seed.books);
      expect(recs.length).toBeGreaterThan(0);
      for (const r of recs) {
        expect(r.reason).toBeTruthy();
        expect(r.genre).toBeTruthy();
        expect(Array.isArray(r.candidates)).toBe(true);
      }
    });
  });
});
