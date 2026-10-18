import rawBooksData from '@/data/sample-books.json';
import type {
  ActivityEvent,
  BookItem,
  ReadingGoal,
  ReadingSessionLog,
  SampleBookRaw,
  Shelf,
} from '@/types/bookshelf';

const rawBooks = rawBooksData as SampleBookRaw[];

export const DEFAULT_SHELVES: Shelf[] = [
  {
    id: 'currently-reading',
    slug: 'currently-reading',
    name: 'Currently Reading',
    isDefault: true,
    position: 0,
    createdAt: '2025-01-01T09:00:00.000Z',
  },
  {
    id: 'want-to-read',
    slug: 'want-to-read',
    name: 'Want to Read',
    isDefault: true,
    position: 1,
    createdAt: '2025-01-01T09:00:00.000Z',
  },
  {
    id: 'read',
    slug: 'read',
    name: 'Read',
    isDefault: true,
    position: 2,
    createdAt: '2025-01-01T09:00:00.000Z',
  },
  {
    id: 'favorites',
    slug: 'favorites',
    name: 'Favorites',
    isDefault: false,
    position: 3,
    createdAt: '2025-01-15T10:00:00.000Z',
  },
];

export const DEFAULT_READING_GOALS: ReadingGoal[] = [
  {
    year: 2026,
    targetBooks: 24,
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    year: 2025,
    targetBooks: 12,
    updatedAt: '2025-01-01T08:00:00.000Z',
  },
];

interface CuratedStateOverride {
  shelfId: 'currently-reading' | 'want-to-read' | 'read' | 'favorites';
  isRead: boolean;
  progressPercent: number;
  rating: number | null;
  notes: string;
  dateAdded: string;
  dateStarted: string | null;
  dateFinished: string | null;
  readCount?: number;
}

/**
 * Exact 5 "Currently Reading" books from preview.jpg:
 * 1. Project Hail Mary — 65%
 * 2. Educated — 30%
 * 3. The Name of the Wind — 82%
 * 4. Deep Work — 15%
 * 5. Circe — 47%
 */
const CURRENTLY_READING_CONFIG: Record<string, { percent: number; started: string; note: string }> = {
  'Project Hail Mary': {
    percent: 65,
    started: '2026-09-28T19:00:00.000Z',
    note: 'Rocky is one of the best characters in modern sci-fi. The orbital mechanics and astrophysics problem-solving are gripping.',
  },
  Educated: {
    percent: 30,
    started: '2026-10-04T20:00:00.000Z',
    note: 'Incredible memoir so far. The contrast between survivalist isolation and self-taught scholarship is deeply moving.',
  },
  'The Name of the Wind': {
    percent: 82,
    started: '2026-09-12T18:30:00.000Z',
    note: 'Kvothe at the University is pure magic. Still waiting for Book 3, so savoring the final chapters.',
  },
  'Deep Work': {
    percent: 15,
    started: '2026-10-11T08:15:00.000Z',
    note: 'Testing the rhythmic time-blocking philosophy for morning coding sessions.',
  },
  Circe: {
    percent: 47,
    started: '2026-10-01T21:00:00.000Z',
    note: 'Luminous prose. Madeline Miller turns ancient myth into an intimate psychological portrait.',
  },
};

/**
 * 5 Favorites books (matches preview.jpg count = 5; all are finished books so they count toward read history)
 */
const FAVORITES_TITLES = new Set([
  'The Great Gatsby',
  'Beloved',
  'A Gentleman in Moscow',
  'Dune',
  'Designing Data-Intensive Applications',
]);

/**
 * 15 Want to Read books (matches preview.jpg count = 15, including key metadata edge-case titles)
 */
const WANT_TO_READ_TITLES = new Set([
  'Say Nothing',
  'Children of Time',
  'The Dispossessed',
  'Ancillary Justice',
  'Four Thousand Weeks',
  'Thinking in Bets',
  'The Obstacle Is the Way',
  'Refactoring',
  'Eloquent JavaScript',
  "Don't Make Me Think",
  'Normal People',
  'Range',
  'Neuromancer',
  'Digital Minimalism',
  'Essentialism',
]);

const CURATED_NOTES_AND_RATINGS: Record<string, { rating: number; notes: string; readCount?: number }> = {
  'The Great Gatsby': {
    rating: 5,
    notes: 'A perfect novel. Every sentence earns its place. Great for re-reading.',
    readCount: 3,
  },
  'To Kill a Mockingbird': {
    rating: 5,
    notes: 'Timeless and devastating. Atticus Finch remains an enduring moral compass.',
  },
  '1984': {
    rating: 4,
    notes: 'More relevant than ever. Newspeak and doublethink feel eerily prescient.',
  },
  'Pride and Prejudice': {
    rating: 4,
    notes: 'Witty and surprisingly modern in its social satire.',
  },
  'The Catcher in the Rye': {
    rating: 3,
    notes: 'I get why people love it for its voice, though it resonated differently on a later read.',
  },
  Beloved: {
    rating: 5,
    notes: 'Haunting. Toni Morrison’s prose is like nothing else in American literature.',
  },
  'The Road': {
    rating: 4,
    notes: 'Bleak but profoundly tender between father and son. Read in two sittings.',
  },
  'A Gentleman in Moscow': {
    rating: 5,
    notes: 'Charming, witty, and deeply humane. One of my absolute favorites.',
  },
  Sapiens: {
    rating: 4,
    notes: 'Changed how I think about shared myths and human cooperation.',
  },
  'The Immortal Life of Henrietta Lacks': {
    rating: 4,
    notes: 'Equal parts cellular biology detective story and deeply human family history.',
  },
  'Thinking Fast and Slow': {
    rating: 4,
    notes: 'Dense but rewarding exploration of System 1 and System 2 cognitive biases.',
  },
  'Born a Crime': {
    rating: 5,
    notes: 'Funny, sharp, and heartbreaking tribute to resilience.',
  },
  'Atomic Habits': {
    rating: 4,
    notes: 'Practical and actionable systems over sheer willpower.',
  },
  'The Body': {
    rating: 4,
    notes: 'Fascinating tour of human anatomy with Bill Bryson’s signature curiosity.',
  },
  Quiet: {
    rating: 4,
    notes: 'A validating, well-researched read for anyone who recharges in solitude.',
  },
  Dune: {
    rating: 5,
    notes: 'Epic ecological and political worldbuilding. Deeply philosophical.',
    readCount: 2,
  },
  'The Left Hand of Darkness': {
    rating: 5,
    notes: 'Ahead of its time in every way. The trek across the Gobrin Ice is unforgettable.',
  },
  'The Fifth Season': {
    rating: 4,
    notes: 'Second-person POV was jarring at first, then revealed itself as a masterstroke.',
  },
  Piranesi: {
    rating: 5,
    notes: 'Dreamlike and mysterious. The House feels like a living character.',
  },
  'The Psychology of Money': {
    rating: 4,
    notes: 'Short chapters that each land a clear insight about behavior and compounding.',
  },
  'The Pragmatic Programmer': {
    rating: 5,
    notes: 'Every software engineer should read this. Orthogonal design and tracer bullets never age.',
  },
  'Clean Code': {
    rating: 3,
    notes: 'Solid naming and function decomposition heuristics, though very Java-centric in parts.',
  },
  'Designing Data-Intensive Applications': {
    rating: 5,
    notes: 'The best technical book I have ever read. Essential for distributed systems.',
  },
  'A Philosophy of Software Design': {
    rating: 4,
    notes: 'Short, opinionated, and brilliant on deep vs. shallow modules.',
  },
  'The Mythical Man-Month': {
    rating: 4,
    notes: 'Still relevant 50 years later. Brooks’s Law and conceptual integrity are timeless.',
  },
};

/**
 * 15 books finished in 2026 (so 2026 Reading Goal = 15 / 24 books, matching preview.jpg!)
 * and 10 books finished in 2025 (for rich YoY comparison).
 */
const FINISHED_DATES_2026 = [
  '2026-01-14T20:00:00.000Z',
  '2026-01-29T21:00:00.000Z',
  '2026-02-12T19:30:00.000Z',
  '2026-02-26T22:00:00.000Z',
  '2026-03-15T18:45:00.000Z',
  '2026-04-04T20:15:00.000Z',
  '2026-04-22T21:10:00.000Z',
  '2026-05-10T17:30:00.000Z',
  '2026-05-28T20:00:00.000Z',
  '2026-06-16T21:40:00.000Z',
  '2026-07-08T19:20:00.000Z',
  '2026-07-27T20:50:00.000Z',
  '2026-08-19T21:00:00.000Z',
  '2026-09-09T19:15:00.000Z',
  '2026-10-02T20:30:00.000Z',
];

const FINISHED_DATES_2025 = [
  '2025-02-11T20:00:00.000Z',
  '2025-03-19T21:00:00.000Z',
  '2025-04-25T19:30:00.000Z',
  '2025-06-02T22:00:00.000Z',
  '2025-07-14T18:45:00.000Z',
  '2025-08-21T20:15:00.000Z',
  '2025-09-18T21:10:00.000Z',
  '2025-10-12T17:30:00.000Z',
  '2025-11-15T20:00:00.000Z',
  '2025-12-08T21:40:00.000Z',
];

function subtractDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export function buildCuratedSeedData(): {
  shelves: Shelf[];
  books: BookItem[];
  sessions: ReadingSessionLog[];
  events: ActivityEvent[];
  goals: ReadingGoal[];
} {
  let finishedIdx = 0;
  const books: BookItem[] = [];
  const sessions: ReadingSessionLog[] = [];
  const events: ActivityEvent[] = [];

  rawBooks.forEach((raw, index) => {
    const id = `book-${index + 1}`;
    const currentlyReading = CURRENTLY_READING_CONFIG[raw.title];
    const isFavorite = FAVORITES_TITLES.has(raw.title);
    const isWantToRead = WANT_TO_READ_TITLES.has(raw.title);

    let state: CuratedStateOverride;

    if (currentlyReading) {
      state = {
        shelfId: 'currently-reading',
        isRead: false,
        progressPercent: currentlyReading.percent,
        rating: null,
        notes: currentlyReading.note,
        dateAdded: subtractDays(currentlyReading.started, 5),
        dateStarted: currentlyReading.started,
        dateFinished: null,
        readCount: 0,
      };
    } else if (isWantToRead) {
      state = {
        shelfId: 'want-to-read',
        isRead: false,
        progressPercent: 0,
        rating: null,
        notes: '',
        dateAdded: `2026-0${((index % 8) + 1)}-10T12:00:00.000Z`,
        dateStarted: null,
        dateFinished: null,
        readCount: 0,
      };
    } else {
      const is2026 = finishedIdx < 15;
      const finishedIso = is2026
        ? FINISHED_DATES_2026[finishedIdx]!
        : FINISHED_DATES_2025[finishedIdx - 15] ?? '2025-11-20T20:00:00.000Z';
      finishedIdx += 1;

      const durationDays = 6 + ((index * 3) % 16);
      const startedIso = subtractDays(finishedIso, durationDays);
      const addedIso = subtractDays(startedIso, 4);
      const meta = CURATED_NOTES_AND_RATINGS[raw.title] ?? {
        rating: 4,
        notes: 'Thought-provoking and well worth the time.',
      };

      state = {
        shelfId: isFavorite ? 'favorites' : 'read',
        isRead: true,
        progressPercent: 100,
        rating: meta.rating,
        notes: meta.notes,
        dateAdded: addedIso,
        dateStarted: startedIso,
        dateFinished: finishedIso,
        readCount: meta.readCount ?? 1,
      };
    }

    const currentPage =
      raw.pageCount !== null
        ? Math.round((raw.pageCount * state.progressPercent) / 100)
        : null;

    const lastProgressUpdatedAt =
      state.shelfId === 'currently-reading'
        ? '2026-10-17T20:30:00.000Z'
        : state.dateFinished;

    const bookItem: BookItem = {
      id,
      title: raw.title,
      author: raw.author,
      isbn13: raw.isbn13,
      isbn10: raw.isbn10,
      coverUrl: raw.coverUrl,
      pageCount: raw.pageCount,
      publishedDate: raw.publishedDate,
      genres: [...raw.genres],
      description: raw.description,
      publisher: raw.publisher,
      openLibraryKey: null,
      shelfId: state.shelfId,
      isRead: state.isRead,
      readCount: state.readCount ?? (state.isRead ? 1 : 0),
      currentPage,
      progressPercent: state.progressPercent,
      lastProgressUpdatedAt,
      rating: state.rating,
      notes: state.notes,
      dateAdded: state.dateAdded,
      dateStarted: state.dateStarted,
      dateFinished: state.dateFinished,
    };

    books.push(bookItem);

    // Generate realistic session logs & timeline events for Currently Reading books
    if (bookItem.shelfId === 'currently-reading') {
      const totalPages = bookItem.pageCount ?? 300;
      const targetPage = bookItem.currentPage ?? Math.round((totalPages * bookItem.progressPercent) / 100);
      const step1 = Math.max(15, Math.round(targetPage * 0.45));
      const step2 = targetPage;
      const date1 = '2026-10-12T19:30:00.000Z';
      const date2 = '2026-10-17T20:30:00.000Z';

      sessions.push(
        {
          id: `session-${id}-1`,
          bookId: id,
          bookTitle: bookItem.title,
          date: date1.slice(0, 10),
          timestamp: date1,
          previousPage: 0,
          newPage: step1,
          pagesDelta: step1,
          previousPercent: 0,
          newPercent: Math.round((step1 / totalPages) * 100),
          note: 'Started reading — strong opening chapters.',
        },
        {
          id: `session-${id}-2`,
          bookId: id,
          bookTitle: bookItem.title,
          date: date2.slice(0, 10),
          timestamp: date2,
          previousPage: step1,
          newPage: step2,
          pagesDelta: Math.max(10, step2 - step1),
          previousPercent: Math.round((step1 / totalPages) * 100),
          newPercent: bookItem.progressPercent,
          note: bookItem.notes,
        }
      );

      events.push({
        id: `event-prog-${id}`,
        type: 'progress_updated',
        bookId: id,
        bookTitle: bookItem.title,
        bookAuthor: bookItem.author,
        bookCoverUrl: bookItem.coverUrl,
        summary: `Updated progress on "${bookItem.title}" to ${bookItem.progressPercent}%`,
        detail: bookItem.pageCount ? `Page ${bookItem.currentPage} of ${bookItem.pageCount}` : `${bookItem.progressPercent}% completed`,
        timestamp: date2,
      });
    }

    // Generate realistic session logs & timeline events for Finished books
    if (bookItem.isRead && bookItem.dateFinished && bookItem.dateStarted) {
      const totalPages = bookItem.pageCount ?? 280;
      const midDate = subtractDays(bookItem.dateFinished, 3);
      const startPages = Math.round(totalPages * 0.35);
      const midPages = Math.round(totalPages * 0.7);

      sessions.push(
        {
          id: `session-${id}-start`,
          bookId: id,
          bookTitle: bookItem.title,
          date: bookItem.dateStarted.slice(0, 10),
          timestamp: bookItem.dateStarted,
          previousPage: 0,
          newPage: startPages,
          pagesDelta: startPages,
          previousPercent: 0,
          newPercent: 35,
        },
        {
          id: `session-${id}-mid`,
          bookId: id,
          bookTitle: bookItem.title,
          date: midDate.slice(0, 10),
          timestamp: midDate,
          previousPage: startPages,
          newPage: midPages,
          pagesDelta: midPages - startPages,
          previousPercent: 35,
          newPercent: 70,
        },
        {
          id: `session-${id}-end`,
          bookId: id,
          bookTitle: bookItem.title,
          date: bookItem.dateFinished.slice(0, 10),
          timestamp: bookItem.dateFinished,
          previousPage: midPages,
          newPage: totalPages,
          pagesDelta: totalPages - midPages,
          previousPercent: 70,
          newPercent: 100,
          note: bookItem.notes,
        }
      );

      events.push({
        id: `event-fin-${id}`,
        type: 'book_finished',
        bookId: id,
        bookTitle: bookItem.title,
        bookAuthor: bookItem.author,
        bookCoverUrl: bookItem.coverUrl,
        summary: `Finished reading "${bookItem.title}"`,
        detail: bookItem.rating ? `Rated ${bookItem.rating} out of 5 stars` : undefined,
        timestamp: bookItem.dateFinished,
      });

      if (bookItem.rating) {
        events.push({
          id: `event-rate-${id}`,
          type: 'rating_updated',
          bookId: id,
          bookTitle: bookItem.title,
          bookAuthor: bookItem.author,
          bookCoverUrl: bookItem.coverUrl,
          summary: `Rated "${bookItem.title}" ${bookItem.rating} ★`,
          detail: bookItem.notes || undefined,
          timestamp: bookItem.dateFinished,
        });
      }
    }

    events.push({
      id: `event-add-${id}`,
      type: 'book_added',
      bookId: id,
      bookTitle: bookItem.title,
      bookAuthor: bookItem.author,
      bookCoverUrl: bookItem.coverUrl,
      summary: `Added "${bookItem.title}" to library`,
      detail: `By ${bookItem.author}`,
      timestamp: bookItem.dateAdded,
    });
  });

  events.push({
    id: 'event-goal-2026',
    type: 'goal_updated',
    summary: 'Set 2026 Annual Reading Goal to 24 books',
    detail: '15 of 24 books completed so far (63%)',
    timestamp: '2026-01-01T08:00:00.000Z',
  });

  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    shelves: DEFAULT_SHELVES.map((s) => ({ ...s })),
    books,
    sessions,
    events,
    goals: DEFAULT_READING_GOALS.map((g) => ({ ...g })),
  };
}
