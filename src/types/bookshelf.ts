/**
 * Wave 0 Shared Domain Contracts — Bookshelf (Personal Reading Tracker)
 * Strict TypeScript definitions (Zero explicit `any`).
 */

export type SystemShelfSlug = 'currently-reading' | 'want-to-read' | 'read';

export interface SampleBookRaw {
  title: string;
  author: string;
  isbn13: string | null;
  isbn10: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  publishedDate: string | null;
  genres: string[];
  description: string | null;
  publisher: string | null;
}

export interface Shelf {
  id: string;
  slug: string;
  name: string;
  isDefault: boolean;
  position: number;
  createdAt: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  isbn13: string | null;
  isbn10: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  publishedDate: string | null;
  genres: string[];
  description: string | null;
  publisher: string | null;
  openLibraryKey?: string | null;
  /** ID of the single shelf this book currently belongs to (Core #2) */
  shelfId: string;
  /** Independent completion flag so custom shelves like "Favorites" retain read stats (ADR-002) */
  isRead: boolean;
  readCount: number;
  currentPage: number | null;
  /** Always 0..100; primary progress metric when pageCount is null (Core #5) */
  progressPercent: number;
  lastProgressUpdatedAt: string | null;
  /** 1..5 stars or null if unrated */
  rating: number | null;
  notes: string;
  dateAdded: string;
  dateStarted: string | null;
  dateFinished: string | null;
}

export interface ReadingSessionLog {
  id: string;
  bookId: string;
  bookTitle: string;
  /** YYYY-MM-DD local date key for Daily Calendar Heatmap aggregation */
  date: string;
  timestamp: string;
  previousPage: number | null;
  newPage: number | null;
  pagesDelta: number;
  previousPercent: number;
  newPercent: number;
  note?: string;
}

export type ActivityEventType =
  | 'book_added'
  | 'book_finished'
  | 'progress_updated'
  | 'rating_updated'
  | 'shelf_moved'
  | 'goal_updated'
  | 'csv_imported';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCoverUrl?: string | null;
  summary: string;
  detail?: string;
  timestamp: string;
}

export interface ReadingGoal {
  year: number;
  targetBooks: number;
  updatedAt: string;
}

export type PaceStatus = 'ahead' | 'on_track' | 'behind';

export interface ReadingGoalProgress {
  year: number;
  targetBooks: number;
  completedBooks: number;
  percentComplete: number;
  expectedBooksByToday: number;
  deltaBooks: number;
  paceStatus: PaceStatus;
  paceMessage: string;
  isGoalMet: boolean;
}

export interface AccessibilityPreferences {
  theme: 'light' | 'dark' | 'system';
  contrast: 'standard' | 'high';
  readingFontSize: 'sm' | 'base' | 'lg' | 'xl';
  readingLineHeight: 'normal' | 'relaxed' | 'loose';
  dyslexiaFont: boolean;
  reducedMotion: 'system' | 'on' | 'off';
}

export type SortOption =
  | 'recent'
  | 'title'
  | 'author'
  | 'dateAdded'
  | 'dateFinished'
  | 'rating'
  | 'progress';

export interface LibraryFilterState {
  query: string;
  shelfId: string | 'all';
  genre: string | 'all';
  author: string | 'all';
  minRating: number | null;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

/* Open Library API & Discovery Contracts */
export interface OpenLibraryBookCandidate {
  workKey: string;
  title: string;
  author: string;
  authors: string[];
  firstPublishYear: string | null;
  pageCount: number | null;
  isbn13: string | null;
  isbn10: string | null;
  coverUrl: string | null;
  publisher: string | null;
  genres: string[];
  description: string | null;
}

export interface OpenLibrarySearchResponse {
  query: string;
  totalFound: number;
  items: OpenLibraryBookCandidate[];
  cached: boolean;
  rateLimited?: boolean;
  error?: string;
}

/* Goodreads CSV Import & Migration Pro (#4 & #13) Contracts */
export type ConflictResolutionStrategy = 'skip' | 'replace' | 'keep_both';

export interface ParsedGoodreadsRow {
  rowIndex: number;
  bookId: string;
  title: string;
  author: string;
  isbn10: string | null;
  isbn13: string | null;
  rating: number | null;
  averageRating: number | null;
  publisher: string | null;
  binding: string | null;
  pageCount: number | null;
  yearPublished: string | null;
  originalPublicationYear: string | null;
  dateRead: string | null;
  dateAdded: string;
  bookshelves: string[];
  exclusiveShelf: SystemShelfSlug;
  customShelfNames: string[];
  review: string;
  privateNotes: string;
  readCount: number;
  NeedsEnrichment: boolean;
}

export interface ImportPreviewItem {
  row: ParsedGoodreadsRow;
  isDuplicate: boolean;
  existingBookId?: string;
  matchedBy?: 'isbn13' | 'isbn10' | 'title_author';
  resolution: ConflictResolutionStrategy;
}

export interface CsvParseResult {
  items: ImportPreviewItem[];
  totalRows: number;
  validRows: number;
  duplicateCount: number;
  customShelvesDetected: string[];
  warnings: string[];
  parseDurationMs: number;
}

export interface ImportExecutionSummary {
  addedCount: number;
  replacedCount: number;
  skippedCount: number;
  customShelvesCreated: string[];
  booksNeedingEnrichment: string[];
  timestamp: string;
}

/* Statistics Dashboard (#5) & Year-in-Review Contracts */
export interface MonthlyReadingBucket {
  monthIndex: number; // 0..11
  monthShort: string; // 'Jan'..'Dec'
  monthFull: string;
  booksFinished: number;
  pagesRead: number;
  averageRating: number | null;
}

export interface GenreStatItem {
  genre: string;
  bookCount: number;
  percentage: number;
  totalPages: number;
  averageRating: number | null;
}

export interface PageLengthBucket {
  label: string; // '< 200p', '200-349p', '350-499p', '500p+', 'Unknown'
  minPages: number;
  maxPages: number | null;
  count: number;
  percentage: number;
}

export interface AuthorDiversityMetrics {
  uniqueAuthorsCount: number;
  totalBooksCount: number;
  diversityRatio: number; // 0..1
  topAuthors: Array<{
    author: string;
    bookCount: number;
    readCount: number;
    averageRating: number | null;
  }>;
}

export interface HeatmapDayCell {
  date: string; // YYYY-MM-DD
  pagesRead: number;
  sessionsCount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

export interface TimeToFinishStats {
  averageDaysToFinish: number | null;
  fastestBook: {
    book: BookItem;
    days: number;
  } | null;
  slowestBook: {
    book: BookItem;
    days: number;
  } | null;
}

export interface YearInReviewSnapshot {
  year: number | 'all';
  isIncompleteYear: boolean;
  isLightReaderMode: boolean; // true when < 5 books finished
  totalBooksFinished: number;
  totalPagesRead: number;
  averageRating: number | null;
  topGenres: GenreStatItem[];
  longestBook: BookItem | null;
  shortestBook: BookItem | null;
  highestRatedBooks: BookItem[];
  monthlyBreakdown: MonthlyReadingBucket[];
  mostProductiveMonth: MonthlyReadingBucket | null;
  harshestMonth: MonthlyReadingBucket | null;
  mostGenerousMonth: MonthlyReadingBucket | null;
  readingStreakDays: number;
  previousYearBooksFinished: number;
  yoyBooksDeltaPercent: number | null;
  averageBookLengthPages: number;
  previousYearAverageLengthPages: number;
}

export interface ComprehensiveAnalyticsReport {
  selectedYear: number | 'all';
  availableYears: number[];
  yearSnapshot: YearInReviewSnapshot;
  genreDistribution: GenreStatItem[];
  pageCountHistogram: PageLengthBucket[];
  ratingDistribution: Array<{ stars: number; count: number; percentage: number }>;
  authorDiversity: AuthorDiversityMetrics;
  calendarHeatmap: HeatmapDayCell[];
  timeToFinish: TimeToFinishStats;
}
