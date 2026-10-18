import type {
  AuthorDiversityMetrics,
  BookItem,
  ComprehensiveAnalyticsReport,
  GenreStatItem,
  HeatmapDayCell,
  MonthlyReadingBucket,
  PaceStatus,
  PageLengthBucket,
  ReadingGoal,
  ReadingGoalProgress,
  ReadingSessionLog,
  TimeToFinishStats,
  YearInReviewSnapshot,
} from '@/types/bookshelf';

const MONTH_NAMES = [
  { short: 'Jan', full: 'January' },
  { short: 'Feb', full: 'February' },
  { short: 'Mar', full: 'March' },
  { short: 'Apr', full: 'April' },
  { short: 'May', full: 'May' },
  { short: 'Jun', full: 'June' },
  { short: 'Jul', full: 'July' },
  { short: 'Aug', full: 'August' },
  { short: 'Sep', full: 'September' },
  { short: 'Oct', full: 'October' },
  { short: 'Nov', full: 'November' },
  { short: 'Dec', full: 'December' },
];

/**
 * Calculates reading goal progress and pace against a reference date (Core #6).
 * Count books where `book.isRead && book.dateFinished` falls in `goal.year` (per ADR-002).
 */
export function calculateReadingGoalProgress(
  books: BookItem[],
  goal: ReadingGoal | null,
  referenceDate?: Date
): ReadingGoalProgress | null {
  if (!goal || goal.targetBooks <= 0) return null;

  const now =
    referenceDate ??
    (typeof window !== 'undefined'
      ? new Date()
      : new Date('2026-10-18T12:00:00.000Z'));

  const completedBooks = books.filter((b) => {
    if (!b.isRead || !b.dateFinished) return false;
    const finishedYear = new Date(b.dateFinished).getUTCFullYear();
    return finishedYear === goal.year;
  }).length;

  const percentComplete = Math.min(
    100,
    Math.round((completedBooks / goal.targetBooks) * 100)
  );
  const isGoalMet = completedBooks >= goal.targetBooks;

  let expectedBooksByToday = 0;
  const targetYear = goal.year;
  const currentYear = now.getUTCFullYear();

  if (targetYear < currentYear) {
    expectedBooksByToday = goal.targetBooks;
  } else if (targetYear > currentYear) {
    expectedBooksByToday = 0;
  } else {
    const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
    const isLeap =
      (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;
    const diffTime = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.min(
      daysInYear,
      Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1)
    );
    expectedBooksByToday =
      Math.round((goal.targetBooks * (dayOfYear / daysInYear)) * 10) / 10;
  }

  const deltaBooks = Math.round((completedBooks - expectedBooksByToday) * 10) / 10;

  let paceStatus: PaceStatus = 'on_track';
  let paceMessage = 'Right on schedule';

  if (isGoalMet) {
    paceStatus = 'ahead';
    paceMessage = `Goal achieved! ${completedBooks} of ${goal.targetBooks} books completed.`;
  } else if (deltaBooks >= 1) {
    paceStatus = 'ahead';
    paceMessage = `${deltaBooks >= 2 ? `${Math.round(deltaBooks)} books` : '1 book'} ahead of schedule`;
  } else if (deltaBooks <= -1) {
    paceStatus = 'behind';
    const behindCount = Math.abs(deltaBooks);
    paceMessage = `${behindCount >= 2 ? `${Math.round(behindCount)} books` : '1 book'} behind schedule`;
  }

  return {
    year: goal.year,
    targetBooks: goal.targetBooks,
    completedBooks,
    percentComplete,
    expectedBooksByToday,
    deltaBooks,
    paceStatus,
    paceMessage,
    isGoalMet,
  };
}

/**
 * Calculates top genre distribution metrics for a list of books.
 */
function calculateGenreStats(books: BookItem[]): GenreStatItem[] {
  if (books.length === 0) return [];

  const genreMap = new Map<
    string,
    { count: number; totalPages: number; ratings: number[] }
  >();

  for (const book of books) {
    const genres = book.genres.length > 0 ? book.genres : ['Uncategorized'];
    for (const genre of genres) {
      const existing = genreMap.get(genre) ?? { count: 0, totalPages: 0, ratings: [] };
      existing.count += 1;
      existing.totalPages += book.pageCount ?? 0;
      if (book.rating !== null && book.rating > 0) {
        existing.ratings.push(book.rating);
      }
      genreMap.set(genre, existing);
    }
  }

  const items: GenreStatItem[] = [];
  for (const [genre, data] of genreMap.entries()) {
    const averageRating =
      data.ratings.length > 0
        ? Math.round(
            (data.ratings.reduce((acc, r) => acc + r, 0) / data.ratings.length) * 10
          ) / 10
        : null;

    items.push({
      genre,
      bookCount: data.count,
      percentage: Math.round((data.count / books.length) * 100),
      totalPages: data.totalPages,
      averageRating,
    });
  }

  return items.sort((a, b) => b.bookCount - a.bookCount || b.totalPages - a.totalPages);
}

/**
 * Calculates maximum reading streak in days from session logs and finish dates.
 */
function calculateMaxStreakDays(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(dates)).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]!).getTime();
    const curr = new Date(uniqueDates[i]!).getTime();
    const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

/**
 * Builds the Year-in-Review snapshot for either a specific year or 'all' (Design Challenge #1).
 */
export function buildYearInReviewSnapshot(
  books: BookItem[],
  sessions: ReadingSessionLog[],
  year: number | 'all',
  referenceDate?: Date
): YearInReviewSnapshot {
  const now =
    referenceDate ??
    (typeof window !== 'undefined'
      ? new Date()
      : new Date('2026-10-18T12:00:00.000Z'));

  const targetBooks =
    year === 'all'
      ? books.filter((b) => b.isRead)
      : books.filter(
          (b) =>
            b.isRead &&
            b.dateFinished &&
            new Date(b.dateFinished).getUTCFullYear() === year
        );

  const prevYearBooks =
    typeof year === 'number'
      ? books.filter(
          (b) =>
            b.isRead &&
            b.dateFinished &&
            new Date(b.dateFinished).getUTCFullYear() === year - 1
        )
      : [];

  const totalBooksFinished = targetBooks.length;
  const isLightReaderMode = totalBooksFinished < 5;
  const isIncompleteYear =
    typeof year === 'number' &&
    year === now.getUTCFullYear() &&
    (now.getUTCMonth() < 11 || now.getUTCDate() < 31);

  const totalPagesRead = targetBooks.reduce((sum, b) => sum + (b.pageCount ?? 0), 0);

  const ratedBooks = targetBooks.filter((b) => b.rating !== null && b.rating > 0);
  const averageRating =
    ratedBooks.length > 0
      ? Math.round(
          (ratedBooks.reduce((acc, b) => acc + (b.rating ?? 0), 0) / ratedBooks.length) * 10
        ) / 10
      : null;

  const booksWithPages = targetBooks.filter((b) => b.pageCount !== null && b.pageCount > 0);
  const longestBook =
    booksWithPages.length > 0
      ? [...booksWithPages].sort((a, b) => (b.pageCount ?? 0) - (a.pageCount ?? 0))[0]!
      : null;

  const shortestBook =
    booksWithPages.length > 0
      ? [...booksWithPages].sort((a, b) => (a.pageCount ?? 0) - (b.pageCount ?? 0))[0]!
      : null;

  const highestRatedBooks = [...targetBooks]
    .filter((b) => b.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.pageCount ?? 0) - (a.pageCount ?? 0))
    .slice(0, 5);

  const topGenres = calculateGenreStats(targetBooks);

  // Monthly breakdown
  const monthlyBreakdown: MonthlyReadingBucket[] = MONTH_NAMES.map((m, i) => ({
    monthIndex: i,
    monthShort: m.short,
    monthFull: m.full,
    booksFinished: 0,
    pagesRead: 0,
    averageRating: null,
  }));

  for (const b of targetBooks) {
    if (b.dateFinished) {
      const d = new Date(b.dateFinished);
      const m = d.getUTCMonth();
      if (m >= 0 && m < 12) {
        monthlyBreakdown[m]!.booksFinished += 1;
        monthlyBreakdown[m]!.pagesRead += b.pageCount ?? 0;
      }
    }
  }

  for (let m = 0; m < 12; m++) {
    const monthRated = targetBooks.filter((b) => {
      if (!b.dateFinished) return false;
      return new Date(b.dateFinished).getUTCMonth() === m && b.rating !== null && b.rating > 0;
    });
    if (monthRated.length > 0) {
      const sum = monthRated.reduce((acc, b) => acc + (b.rating ?? 0), 0);
      monthlyBreakdown[m]!.averageRating = Math.round((sum / monthRated.length) * 10) / 10;
    }
  }

  // Highlights
  const productiveMonths = [...monthlyBreakdown].filter((m) => m.booksFinished > 0);
  const mostProductiveMonth =
    productiveMonths.length > 0
      ? productiveMonths.sort((a, b) => b.booksFinished - a.booksFinished || b.pagesRead - a.pagesRead)[0]!
      : null;

  const ratedMonths = [...monthlyBreakdown].filter((m) => m.averageRating !== null);
  const harshestMonth =
    ratedMonths.length > 0
      ? [...ratedMonths].sort((a, b) => (a.averageRating ?? 5) - (b.averageRating ?? 5))[0]!
      : null;

  const mostGenerousMonth =
    ratedMonths.length > 0
      ? [...ratedMonths].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))[0]!
      : null;

  // Streak calculation
  const sessionDates = sessions
    .filter((s) => {
      if (year === 'all') return true;
      return s.date.startsWith(`${year}-`);
    })
    .map((s) => s.date);

  const bookDates = targetBooks
    .filter((b) => Boolean(b.dateFinished))
    .map((b) => b.dateFinished!.slice(0, 10));

  const readingStreakDays = calculateMaxStreakDays([...sessionDates, ...bookDates]);

  const previousYearBooksFinished = prevYearBooks.length;
  const yoyBooksDeltaPercent =
    prevYearBooks.length > 0
      ? Math.round(((totalBooksFinished - prevYearBooks.length) / prevYearBooks.length) * 100)
      : null;

  const averageBookLengthPages =
    booksWithPages.length > 0
      ? Math.round(totalPagesRead / booksWithPages.length)
      : 0;

  const prevBooksWithPages = prevYearBooks.filter((b) => b.pageCount !== null && b.pageCount > 0);
  const prevTotalPages = prevBooksWithPages.reduce((sum, b) => sum + (b.pageCount ?? 0), 0);
  const previousYearAverageLengthPages =
    prevBooksWithPages.length > 0
      ? Math.round(prevTotalPages / prevBooksWithPages.length)
      : 0;

  return {
    year,
    isIncompleteYear,
    isLightReaderMode,
    totalBooksFinished,
    totalPagesRead,
    averageRating,
    topGenres,
    longestBook,
    shortestBook,
    highestRatedBooks,
    monthlyBreakdown,
    mostProductiveMonth,
    harshestMonth,
    mostGenerousMonth,
    readingStreakDays,
    previousYearBooksFinished,
    yoyBooksDeltaPercent,
    averageBookLengthPages,
    previousYearAverageLengthPages,
  };
}

/**
 * Builds the comprehensive analytics dashboard report (Differentiator #5).
 */
export function buildComprehensiveAnalyticsReport(
  books: BookItem[],
  sessions: ReadingSessionLog[],
  selectedYear: number | 'all',
  referenceDate?: Date
): ComprehensiveAnalyticsReport {
  const now =
    referenceDate ??
    (typeof window !== 'undefined'
      ? new Date()
      : new Date('2026-10-18T12:00:00.000Z'));

  const yearsSet = new Set<number>();
  for (const b of books) {
    if (b.dateFinished) {
      const y = new Date(b.dateFinished).getUTCFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    }
  }
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);
  if (availableYears.length === 0) {
    availableYears.push(now.getUTCFullYear());
  }

  const yearSnapshot = buildYearInReviewSnapshot(books, sessions, selectedYear, now);

  const targetBooks =
    selectedYear === 'all'
      ? books.filter((b) => b.isRead)
      : books.filter(
          (b) =>
            b.isRead &&
            b.dateFinished &&
            new Date(b.dateFinished).getUTCFullYear() === selectedYear
        );

  const genreDistribution = calculateGenreStats(targetBooks);

  // Page Count Histogram
  const histogramDefs: Array<{
    label: string;
    minPages: number;
    maxPages: number | null;
  }> = [
    { label: '< 200p', minPages: 0, maxPages: 199 },
    { label: '200-349p', minPages: 200, maxPages: 349 },
    { label: '350-499p', minPages: 350, maxPages: 499 },
    { label: '500p+', minPages: 500, maxPages: null },
    { label: 'Unknown', minPages: 0, maxPages: null },
  ];

  const pageCountHistogram: PageLengthBucket[] = histogramDefs.map((def) => {
    let count = 0;
    for (const b of targetBooks) {
      if (def.label === 'Unknown') {
        if (b.pageCount === null || b.pageCount <= 0) count++;
      } else if (b.pageCount !== null && b.pageCount > 0) {
        if (def.maxPages === null) {
          if (b.pageCount >= def.minPages) count++;
        } else {
          if (b.pageCount >= def.minPages && b.pageCount <= def.maxPages) count++;
        }
      }
    }
    const percentage =
      targetBooks.length > 0 ? Math.round((count / targetBooks.length) * 100) : 0;
    return {
      label: def.label,
      minPages: def.minPages,
      maxPages: def.maxPages,
      count,
      percentage,
    };
  });

  // Rating Distribution (Stars 5 down to 1)
  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRated = 0;

  for (const b of targetBooks) {
    if (b.rating !== null && b.rating >= 1 && b.rating <= 5) {
      ratingCounts[b.rating] = (ratingCounts[b.rating] ?? 0) + 1;
      totalRated++;
    }
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = ratingCounts[stars] ?? 0;
    const percentage = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
    return { stars, count, percentage };
  });

  // Author Diversity
  const authorMap = new Map<
    string,
    { bookCount: number; readCount: number; ratings: number[] }
  >();

  for (const b of targetBooks) {
    const author = b.author || 'Unknown';
    const existing = authorMap.get(author) ?? { bookCount: 0, readCount: 0, ratings: [] };
    existing.bookCount += 1;
    existing.readCount += b.readCount || 1;
    if (b.rating !== null && b.rating > 0) {
      existing.ratings.push(b.rating);
    }
    authorMap.set(author, existing);
  }

  const uniqueAuthorsCount = authorMap.size;
  const totalBooksCount = targetBooks.length;
  const diversityRatio =
    totalBooksCount > 0
      ? Math.round((uniqueAuthorsCount / totalBooksCount) * 100) / 100
      : 1;

  const topAuthors = Array.from(authorMap.entries())
    .map(([author, data]) => {
      const averageRating =
        data.ratings.length > 0
          ? Math.round(
              (data.ratings.reduce((acc, r) => acc + r, 0) / data.ratings.length) * 10
            ) / 10
          : null;
      return {
        author,
        bookCount: data.bookCount,
        readCount: data.readCount,
        averageRating,
      };
    })
    .sort((a, b) => b.bookCount - a.bookCount || b.readCount - a.readCount)
    .slice(0, 5);

  const authorDiversity: AuthorDiversityMetrics = {
    uniqueAuthorsCount,
    totalBooksCount,
    diversityRatio,
    topAuthors,
  };

  // Calendar Heatmap (Last 365 days or all days of selected year)
  const heatmapDays: HeatmapDayCell[] = [];
  const sessionDayMap = new Map<string, { pages: number; count: number }>();

  for (const s of sessions) {
    const day = s.date;
    const existing = sessionDayMap.get(day) ?? { pages: 0, count: 0 };
    existing.pages += s.pagesDelta;
    existing.count += 1;
    sessionDayMap.set(day, existing);
  }

  let startDate: Date;
  let endDate: Date;

  if (selectedYear === 'all' || selectedYear === now.getUTCFullYear()) {
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    startDate = new Date(endDate.getTime() - 364 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(Date.UTC(selectedYear, 0, 1));
    endDate = new Date(Date.UTC(selectedYear, 11, 31));
  }

  const cursor = new Date(startDate.getTime());
  while (cursor <= endDate) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const dayData = sessionDayMap.get(isoDate) ?? { pages: 0, count: 0 };
    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (dayData.pages >= 100) intensity = 4;
    else if (dayData.pages >= 50) intensity = 3;
    else if (dayData.pages >= 20) intensity = 2;
    else if (dayData.pages > 0) intensity = 1;

    heatmapDays.push({
      date: isoDate,
      pagesRead: dayData.pages,
      sessionsCount: dayData.count,
      intensity,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Time to Finish
  const finishedWithDurations = targetBooks
    .filter((b) => Boolean(b.dateStarted && b.dateFinished))
    .map((b) => {
      const start = new Date(b.dateStarted!).getTime();
      const end = new Date(b.dateFinished!).getTime();
      const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return { book: b, days };
    });

  let timeToFinish: TimeToFinishStats = {
    averageDaysToFinish: null,
    fastestBook: null,
    slowestBook: null,
  };

  if (finishedWithDurations.length > 0) {
    const totalDays = finishedWithDurations.reduce((sum, item) => sum + item.days, 0);
    const sorted = [...finishedWithDurations].sort((a, b) => a.days - b.days);
    timeToFinish = {
      averageDaysToFinish: Math.round((totalDays / finishedWithDurations.length) * 10) / 10,
      fastestBook: sorted[0] ?? null,
      slowestBook: sorted[sorted.length - 1] ?? null,
    };
  }

  return {
    selectedYear,
    availableYears,
    yearSnapshot,
    genreDistribution,
    pageCountHistogram,
    ratingDistribution,
    authorDiversity,
    calendarHeatmap: heatmapDays,
    timeToFinish,
  };
}
