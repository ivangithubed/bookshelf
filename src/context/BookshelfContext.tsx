'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AccessibilityPreferences,
  ActivityEvent,
  BookItem,
  OpenLibraryBookCandidate,
  ReadingGoal,
  ReadingSessionLog,
  Shelf,
} from '@/types/bookshelf';
import {
  applyA11yPreferencesToDocument,
  clearAllBookshelfData,
  loadA11yPreferencesSync,
  loadOrSeedBookshelf,
  persistSnapshot,
  resetToCuratedDemoLibrary,
  saveA11yPreferencesSync,
  type BookshelfSnapshot,
} from '@/lib/db/indexed-db';

export interface BookshelfContextType {
  // State
  isLoading: boolean;
  shelves: Shelf[];
  books: BookItem[];
  sessions: ReadingSessionLog[];
  events: ActivityEvent[];
  goals: ReadingGoal[];
  a11yPrefs: AccessibilityPreferences;
  liveAnnouncement: string;
  isSearchModalOpen: boolean;
  isShortcutsModalOpen: boolean;

  // Computed
  allKnownGenres: string[];
  currentYearGoal: ReadingGoal | null;
  booksReadIn2026Count: number;

  // Actions
  addBookToLibrary: (
    candidate: OpenLibraryBookCandidate | Partial<BookItem>,
    shelfId?: string
  ) => Promise<{ added: boolean; book: BookItem; duplicate?: boolean }>;
  moveBookToShelf: (bookId: string, targetShelfId: string) => Promise<void>;
  updateReadingProgress: (
    bookId: string,
    value: number,
    mode: 'page' | 'percent',
    note?: string
  ) => Promise<{ reached100Percent: boolean }>;
  markBookFinished: (
    bookId: string,
    rating?: number | null,
    notes?: string
  ) => Promise<void>;
  updateBookDetails: (
    bookId: string,
    patch: Partial<
      Pick<
        BookItem,
        | 'rating'
        | 'notes'
        | 'genres'
        | 'description'
        | 'coverUrl'
        | 'pageCount'
        | 'publisher'
        | 'publishedDate'
      >
    >
  ) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  bulkMoveBooks: (bookIds: string[], targetShelfId: string) => Promise<void>;
  bulkAddGenre: (bookIds: string[], genre: string) => Promise<void>;
  bulkDeleteBooks: (bookIds: string[]) => Promise<void>;
  createShelf: (name: string) => Promise<Shelf | null>;
  renameShelf: (shelfId: string, newName: string) => Promise<void>;
  deleteShelf: (shelfId: string) => Promise<void>;
  reorderShelf: (shelfId: string, direction: 'up' | 'down') => Promise<void>;
  setReadingGoal: (year: number, targetBooks: number) => Promise<void>;
  replaceSnapshot: (
    newSnapshot: BookshelfSnapshot,
    announcement?: string
  ) => Promise<void>;
  updateA11yPrefs: (patch: Partial<AccessibilityPreferences>) => void;
  resetDemoLibrary: () => Promise<void>;
  clearAllData: () => Promise<void>;
  announce: (message: string) => void;
  setSearchModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
}

const BookshelfContext = createContext<BookshelfContextType | null>(null);

export function BookshelfProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [sessions, setSessions] = useState<ReadingSessionLog[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [goals, setGoals] = useState<ReadingGoal[]>([]);
  const [a11yPrefs, setA11yPrefs] = useState<AccessibilityPreferences>(loadA11yPreferencesSync);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [isSearchModalOpen, setSearchModalOpen] = useState(false);
  const [isShortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  const announce = useCallback((message: string) => {
    // Clear first to ensure screen readers re-announce identical messages
    setLiveAnnouncement('');
    setTimeout(() => {
      setLiveAnnouncement(message);
    }, 50);
  }, []);

  // Initial data loading from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const initialPrefs = loadA11yPreferencesSync();
    setA11yPrefs(initialPrefs);
    applyA11yPreferencesToDocument(initialPrefs);

    loadOrSeedBookshelf()
      .then((snapshot) => {
        if (!isMounted) return;
        setShelves(snapshot.shelves);
        setBooks(snapshot.books);
        setSessions(snapshot.sessions);
        setEvents(snapshot.events);
        setGoals(snapshot.goals);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load library snapshot from IndexedDB:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Media queries listener for system theme and reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleSystemChange = () => {
      if (a11yPrefs.theme === 'system' || a11yPrefs.reducedMotion === 'system') {
        applyA11yPreferencesToDocument(a11yPrefs);
      }
    };

    darkQuery.addEventListener('change', handleSystemChange);
    motionQuery.addEventListener('change', handleSystemChange);

    return () => {
      darkQuery.removeEventListener('change', handleSystemChange);
      motionQuery.removeEventListener('change', handleSystemChange);
    };
  }, [a11yPrefs]);

  // Global keyboard shortcuts: '/' or 'Cmd/Ctrl + K' for search, '?' for shortcuts modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Computed: unique sorted genres
  const allKnownGenres = useMemo(() => {
    const genreSet = new Set<string>();
    for (const book of books) {
      if (Array.isArray(book.genres)) {
        for (const g of book.genres) {
          if (g && g.trim()) {
            genreSet.add(g.trim());
          }
        }
      }
    }
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [books]);

  // Computed: 2026 goal
  const currentYearGoal = useMemo(() => {
    return goals.find((g) => g.year === 2026) ?? null;
  }, [goals]);

  // Computed: count of books read in 2026
  const booksReadIn2026Count = useMemo(() => {
    return books.filter(
      (b) => b.isRead && (b.dateFinished ? b.dateFinished.startsWith('2026') : false)
    ).length;
  }, [books]);

  // Helper to persist state
  const syncSnapshot = useCallback(
    async (
      nextShelves: Shelf[],
      nextBooks: BookItem[],
      nextSessions: ReadingSessionLog[],
      nextEvents: ActivityEvent[],
      nextGoals: ReadingGoal[]
    ) => {
      const snapshot: BookshelfSnapshot = {
        shelves: nextShelves,
        books: nextBooks,
        sessions: nextSessions,
        events: nextEvents,
        goals: nextGoals,
      };
      await persistSnapshot(snapshot);
    },
    []
  );

  const addBookToLibrary = useCallback(
    async (
      candidate: OpenLibraryBookCandidate | Partial<BookItem>,
      targetShelfId?: string
    ): Promise<{ added: boolean; book: BookItem; duplicate?: boolean }> => {
      const assignedShelfId = targetShelfId || 'want-to-read';
      const shelf = shelves.find((s) => s.id === assignedShelfId);
      const shelfName = shelf?.name || assignedShelfId;

      // Duplicate check by isbn13, isbn10, or exact title + author
      const existing = books.find((b) => {
        if (candidate.isbn13 && b.isbn13 && candidate.isbn13 === b.isbn13) return true;
        if (candidate.isbn10 && b.isbn10 && candidate.isbn10 === b.isbn10) return true;
        if (
          candidate.title &&
          b.title.trim().toLowerCase() === candidate.title.trim().toLowerCase() &&
          candidate.author &&
          b.author.trim().toLowerCase() === candidate.author.trim().toLowerCase()
        ) {
          return true;
        }
        return false;
      });

      if (existing) {
        announce(`"${existing.title}" is already in your library on shelf "${shelfName}"`);
        return { added: false, book: existing, duplicate: true };
      }

      const isReadShelf = assignedShelfId === 'read';
      const isCurrentlyReading = assignedShelfId === 'currently-reading';
      const now = new Date().toISOString();

      const newId =
        (candidate as Partial<BookItem>).id ||
        (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `book-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

      let authorName = candidate.author || 'Unknown Author';
      if ('authors' in candidate && Array.isArray((candidate as OpenLibraryBookCandidate).authors)) {
        const authorsArr = (candidate as OpenLibraryBookCandidate).authors;
        if (authorsArr.length > 0) authorName = authorsArr.join(', ');
      }

      const publishedYear =
        'firstPublishYear' in candidate && candidate.firstPublishYear
          ? String(candidate.firstPublishYear)
          : ('publishedDate' in candidate && candidate.publishedDate
              ? candidate.publishedDate
              : null);

      const pageCount = candidate.pageCount || null;

      const newBook: BookItem = {
        id: newId,
        title: candidate.title?.trim() || 'Untitled Book',
        author: authorName.trim(),
        isbn13: candidate.isbn13 || null,
        isbn10: candidate.isbn10 || null,
        coverUrl: candidate.coverUrl || null,
        pageCount,
        publishedDate: publishedYear,
        genres: candidate.genres || [],
        description: candidate.description || null,
        publisher: candidate.publisher || null,
        shelfId: assignedShelfId,
        isRead: isReadShelf,
        readCount: isReadShelf ? 1 : 0,
        currentPage: isReadShelf ? pageCount : 0,
        progressPercent: isReadShelf ? 100 : 0,
        lastProgressUpdatedAt: null,
        rating: (candidate as Partial<BookItem>).rating ?? null,
        notes: (candidate as Partial<BookItem>).notes ?? '',
        dateAdded: now,
        dateStarted: isCurrentlyReading ? now : null,
        dateFinished: isReadShelf ? now : null,
      };

      const newEvent: ActivityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'book_added',
        bookId: newBook.id,
        bookTitle: newBook.title,
        bookAuthor: newBook.author,
        bookCoverUrl: newBook.coverUrl,
        summary: `Added "${newBook.title}" to ${shelfName}`,
        timestamp: now,
      };

      const updatedBooks = [newBook, ...books];
      const updatedEvents = [newEvent, ...events];

      setBooks(updatedBooks);
      setEvents(updatedEvents);

      await syncSnapshot(shelves, updatedBooks, sessions, updatedEvents, goals);
      announce(`Added "${newBook.title}" by ${newBook.author} to ${shelfName}`);

      return { added: true, book: newBook };
    },
    [shelves, books, events, sessions, goals, announce, syncSnapshot]
  );

  const moveBookToShelf = useCallback(
    async (bookId: string, targetShelfId: string) => {
      const bookIndex = books.findIndex((b) => b.id === bookId);
      if (bookIndex === -1) return;

      const oldBook = books[bookIndex];
      if (oldBook.shelfId === targetShelfId) return;

      const targetShelf = shelves.find((s) => s.id === targetShelfId);
      const shelfName = targetShelf?.name || targetShelfId;
      const now = new Date().toISOString();

      let nextIsRead = oldBook.isRead;
      let nextProgressPercent = oldBook.progressPercent;
      let nextCurrentPage = oldBook.currentPage;
      let nextDateFinished = oldBook.dateFinished;
      let nextDateStarted = oldBook.dateStarted;
      let nextReadCount = oldBook.readCount;

      if (targetShelfId === 'read') {
        nextIsRead = true;
        nextProgressPercent = 100;
        nextCurrentPage = oldBook.pageCount;
        nextDateFinished = oldBook.dateFinished ?? now;
        nextReadCount = Math.max(1, oldBook.readCount + 1);
      } else if (targetShelfId === 'currently-reading') {
        nextIsRead = false;
        nextDateStarted = oldBook.dateStarted ?? now;
      } else if (targetShelfId === 'want-to-read') {
        nextIsRead = false;
        nextProgressPercent = 0;
        nextCurrentPage = 0;
      }
      // If moving to a custom shelf, preserve existing isRead, dateFinished, and progress per ADR-002

      const updatedBook: BookItem = {
        ...oldBook,
        shelfId: targetShelfId,
        isRead: nextIsRead,
        progressPercent: nextProgressPercent,
        currentPage: nextCurrentPage,
        dateFinished: nextDateFinished,
        dateStarted: nextDateStarted,
        readCount: nextReadCount,
      };

      const updatedBooks = [...books];
      updatedBooks[bookIndex] = updatedBook;

      const newEvent: ActivityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'shelf_moved',
        bookId: updatedBook.id,
        bookTitle: updatedBook.title,
        bookAuthor: updatedBook.author,
        bookCoverUrl: updatedBook.coverUrl,
        summary: `Moved "${updatedBook.title}" to ${shelfName}`,
        timestamp: now,
      };

      const updatedEvents = [newEvent, ...events];

      setBooks(updatedBooks);
      setEvents(updatedEvents);

      await syncSnapshot(shelves, updatedBooks, sessions, updatedEvents, goals);
      announce(`Moved "${updatedBook.title}" to ${shelfName}`);
    },
    [books, shelves, events, sessions, goals, announce, syncSnapshot]
  );

  const updateReadingProgress = useCallback(
    async (
      bookId: string,
      value: number,
      mode: 'page' | 'percent',
      note?: string
    ): Promise<{ reached100Percent: boolean }> => {
      const bookIndex = books.findIndex((b) => b.id === bookId);
      if (bookIndex === -1) return { reached100Percent: false };

      const book = books[bookIndex];
      const now = new Date().toISOString();
      const localDate = now.split('T')[0];

      let newPage: number | null = null;
      let newPercent = 0;

      if (mode === 'page') {
        const targetPage = Math.max(0, Math.round(value));
        newPage = book.pageCount ? Math.min(targetPage, book.pageCount) : targetPage;
        newPercent = book.pageCount
          ? Math.min(100, Math.round((newPage / book.pageCount) * 100))
          : Math.min(100, Math.max(0, Math.round(value)));
      } else {
        newPercent = Math.max(0, Math.min(100, Math.round(value)));
        newPage = book.pageCount ? Math.round((newPercent / 100) * book.pageCount) : null;
      }

      const previousPage = book.currentPage ?? 0;
      const pagesDelta = newPage !== null ? Math.max(0, newPage - previousPage) : 0;
      const reached100Percent = newPercent >= 100;

      const newSession: ReadingSessionLog = {
        id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        bookId: book.id,
        bookTitle: book.title,
        date: localDate,
        timestamp: now,
        previousPage: book.currentPage,
        newPage,
        pagesDelta,
        previousPercent: book.progressPercent,
        newPercent,
        note: note?.trim() || undefined,
      };

      const updatedBook: BookItem = {
        ...book,
        currentPage: newPage,
        progressPercent: newPercent,
        lastProgressUpdatedAt: now,
        ...(reached100Percent && !book.isRead
          ? {
              isRead: true,
              shelfId: 'read',
              dateFinished: book.dateFinished ?? now,
              readCount: Math.max(1, book.readCount + 1),
            }
          : {}),
      };

      const newEvent: ActivityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: reached100Percent ? 'book_finished' : 'progress_updated',
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCoverUrl: book.coverUrl,
        summary: reached100Percent
          ? `Finished "${book.title}"`
          : `Updated progress on "${book.title}" to ${newPercent}%`,
        detail: note || (newPage ? `Page ${newPage} of ${book.pageCount ?? '?'}` : `${newPercent}%`),
        timestamp: now,
      };

      const updatedBooks = [...books];
      updatedBooks[bookIndex] = updatedBook;
      const updatedSessions = [newSession, ...sessions];
      const updatedEvents = [newEvent, ...events];

      setBooks(updatedBooks);
      setSessions(updatedSessions);
      setEvents(updatedEvents);

      await syncSnapshot(shelves, updatedBooks, updatedSessions, updatedEvents, goals);

      if (reached100Percent) {
        announce(`Congratulations! You completed "${book.title}"!`);
      } else {
        announce(`Reading progress updated to ${newPercent}% on "${book.title}"`);
      }

      return { reached100Percent };
    },
    [books, sessions, events, shelves, goals, announce, syncSnapshot]
  );

  const markBookFinished = useCallback(
    async (bookId: string, rating?: number | null, notes?: string) => {
      const bookIndex = books.findIndex((b) => b.id === bookId);
      if (bookIndex === -1) return;

      const book = books[bookIndex];
      const now = new Date().toISOString();

      const updatedBook: BookItem = {
        ...book,
        shelfId: 'read',
        isRead: true,
        progressPercent: 100,
        currentPage: book.pageCount,
        dateFinished: book.dateFinished ?? now,
        readCount: Math.max(1, book.readCount + 1),
        rating: rating !== undefined ? rating : book.rating,
        notes: notes !== undefined ? notes : book.notes,
        lastProgressUpdatedAt: now,
      };

      const newEvent: ActivityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'book_finished',
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCoverUrl: book.coverUrl,
        summary: `Finished "${book.title}"`,
        detail:
          rating !== undefined && rating !== null
            ? `Rated ${rating}/5 stars`
            : undefined,
        timestamp: now,
      };

      const updatedBooks = [...books];
      updatedBooks[bookIndex] = updatedBook;
      const updatedEvents = [newEvent, ...events];

      setBooks(updatedBooks);
      setEvents(updatedEvents);

      await syncSnapshot(shelves, updatedBooks, sessions, updatedEvents, goals);
      announce(`Marked "${book.title}" as finished on Read shelf!`);
    },
    [books, events, shelves, sessions, goals, announce, syncSnapshot]
  );

  const updateBookDetails = useCallback(
    async (
      bookId: string,
      patch: Partial<
        Pick<
          BookItem,
          | 'rating'
          | 'notes'
          | 'genres'
          | 'description'
          | 'coverUrl'
          | 'pageCount'
          | 'publisher'
          | 'publishedDate'
        >
      >
    ) => {
      const bookIndex = books.findIndex((b) => b.id === bookId);
      if (bookIndex === -1) return;

      const book = books[bookIndex];
      const now = new Date().toISOString();
      const updatedBook: BookItem = { ...book, ...patch };

      const updatedBooks = [...books];
      updatedBooks[bookIndex] = updatedBook;

      let updatedEvents = events;
      if (patch.rating !== undefined && patch.rating !== book.rating) {
        const ratingEvent: ActivityEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'rating_updated',
          bookId: book.id,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookCoverUrl: book.coverUrl,
          summary:
            patch.rating === null
              ? `Cleared rating for "${book.title}"`
              : `Rated "${book.title}" ${patch.rating}/5 stars`,
          timestamp: now,
        };
        updatedEvents = [ratingEvent, ...events];
        setEvents(updatedEvents);
      }

      setBooks(updatedBooks);
      await syncSnapshot(shelves, updatedBooks, sessions, updatedEvents, goals);
      announce(`Updated details for "${book.title}"`);
    },
    [books, events, shelves, sessions, goals, announce, syncSnapshot]
  );

  const deleteBook = useCallback(
    async (bookId: string) => {
      const book = books.find((b) => b.id === bookId);
      if (!book) return;

      const updatedBooks = books.filter((b) => b.id !== bookId);
      setBooks(updatedBooks);

      await syncSnapshot(shelves, updatedBooks, sessions, events, goals);
      announce(`Deleted "${book.title}" from library`);
    },
    [books, shelves, sessions, events, goals, announce, syncSnapshot]
  );

  const bulkMoveBooks = useCallback(
    async (bookIds: string[], targetShelfId: string) => {
      if (bookIds.length === 0) return;
      const targetShelf = shelves.find((s) => s.id === targetShelfId);
      const shelfName = targetShelf?.name || targetShelfId;
      const now = new Date().toISOString();
      const idSet = new Set(bookIds);

      const updatedBooks = books.map((book) => {
        if (!idSet.has(book.id)) return book;

        let nextIsRead = book.isRead;
        let nextProgressPercent = book.progressPercent;
        let nextCurrentPage = book.currentPage;
        let nextDateFinished = book.dateFinished;
        let nextDateStarted = book.dateStarted;

        if (targetShelfId === 'read') {
          nextIsRead = true;
          nextProgressPercent = 100;
          nextCurrentPage = book.pageCount;
          nextDateFinished = book.dateFinished ?? now;
        } else if (targetShelfId === 'currently-reading') {
          nextIsRead = false;
          nextDateStarted = book.dateStarted ?? now;
        } else if (targetShelfId === 'want-to-read') {
          nextIsRead = false;
          nextProgressPercent = 0;
          nextCurrentPage = 0;
        }

        return {
          ...book,
          shelfId: targetShelfId,
          isRead: nextIsRead,
          progressPercent: nextProgressPercent,
          currentPage: nextCurrentPage,
          dateFinished: nextDateFinished,
          dateStarted: nextDateStarted,
        };
      });

      const moveEvent: ActivityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'shelf_moved',
        summary: `Moved ${bookIds.length} books to ${shelfName}`,
        timestamp: now,
      };

      const updatedEvents = [moveEvent, ...events];

      setBooks(updatedBooks);
      setEvents(updatedEvents);

      await syncSnapshot(shelves, updatedBooks, sessions, updatedEvents, goals);
      announce(`Moved ${bookIds.length} books to ${shelfName}`);
    },
    [books, shelves, events, sessions, goals, announce, syncSnapshot]
  );

  const bulkAddGenre = useCallback(
    async (bookIds: string[], genre: string) => {
      const cleanGenre = genre.trim();
      if (!cleanGenre || bookIds.length === 0) return;

      const idSet = new Set(bookIds);
      const updatedBooks = books.map((book) => {
        if (!idSet.has(book.id)) return book;
        if (book.genres.includes(cleanGenre)) return book;
        return {
          ...book,
          genres: [...book.genres, cleanGenre],
        };
      });

      setBooks(updatedBooks);
      await syncSnapshot(shelves, updatedBooks, sessions, events, goals);
      announce(`Added genre "${cleanGenre}" to ${bookIds.length} books`);
    },
    [books, shelves, sessions, events, goals, announce, syncSnapshot]
  );

  const bulkDeleteBooks = useCallback(
    async (bookIds: string[]) => {
      if (bookIds.length === 0) return;
      const idSet = new Set(bookIds);
      const updatedBooks = books.filter((b) => !idSet.has(b.id));

      setBooks(updatedBooks);
      await syncSnapshot(shelves, updatedBooks, sessions, events, goals);
      announce(`Deleted ${bookIds.length} books from library`);
    },
    [books, shelves, sessions, events, goals, announce, syncSnapshot]
  );

  const createShelf = useCallback(
    async (name: string): Promise<Shelf | null> => {
      const trimmed = name.trim();
      if (!trimmed) return null;

      const baseSlug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = baseSlug || `shelf-${Date.now()}`;

      if (shelves.some((s) => s.slug === slug || s.name.toLowerCase() === trimmed.toLowerCase())) {
        announce(`Shelf "${trimmed}" already exists`);
        return null;
      }

      const newShelf: Shelf = {
        id: slug,
        slug,
        name: trimmed,
        isDefault: false,
        position: shelves.length,
        createdAt: new Date().toISOString(),
      };

      const updatedShelves = [...shelves, newShelf];
      setShelves(updatedShelves);

      await syncSnapshot(updatedShelves, books, sessions, events, goals);
      announce(`Created shelf "${trimmed}"`);

      return newShelf;
    },
    [shelves, books, sessions, events, goals, announce, syncSnapshot]
  );

  const renameShelf = useCallback(
    async (shelfId: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      const shelfIndex = shelves.findIndex((s) => s.id === shelfId);
      if (shelfIndex === -1) return;

      const oldShelf = shelves[shelfIndex];
      const updatedShelf: Shelf = { ...oldShelf, name: trimmed };
      const updatedShelves = [...shelves];
      updatedShelves[shelfIndex] = updatedShelf;

      setShelves(updatedShelves);
      await syncSnapshot(updatedShelves, books, sessions, events, goals);
      announce(`Renamed shelf to "${trimmed}"`);
    },
    [shelves, books, sessions, events, goals, announce, syncSnapshot]
  );

  const deleteShelf = useCallback(
    async (shelfId: string) => {
      const targetShelf = shelves.find((s) => s.id === shelfId);
      if (!targetShelf || targetShelf.isDefault) {
        announce('Cannot delete system default shelf');
        return;
      }

      const updatedShelves = shelves
        .filter((s) => s.id !== shelfId)
        .map((s, idx) => ({ ...s, position: idx }));

      // Books on deleted custom shelf move to 'read' if isRead else 'want-to-read' per ADR-002
      const updatedBooks = books.map((b) => {
        if (b.shelfId !== shelfId) return b;
        return {
          ...b,
          shelfId: b.isRead ? 'read' : 'want-to-read',
        };
      });

      setShelves(updatedShelves);
      setBooks(updatedBooks);

      await syncSnapshot(updatedShelves, updatedBooks, sessions, events, goals);
      announce(`Shelf "${targetShelf.name}" deleted. Books moved to fallback shelves.`);
    },
    [shelves, books, sessions, events, goals, announce, syncSnapshot]
  );

  const reorderShelf = useCallback(
    async (shelfId: string, direction: 'up' | 'down') => {
      const index = shelves.findIndex((s) => s.id === shelfId);
      if (index === -1) return;
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === shelves.length - 1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const updatedShelves = [...shelves];
      const temp = updatedShelves[index];
      updatedShelves[index] = updatedShelves[targetIndex];
      updatedShelves[targetIndex] = temp;

      // Re-assign positions
      const reindexed = updatedShelves.map((s, idx) => ({ ...s, position: idx }));

      setShelves(reindexed);
      await syncSnapshot(reindexed, books, sessions, events, goals);
      announce(`Moved shelf "${temp.name}" ${direction}`);
    },
    [shelves, books, sessions, events, goals, announce, syncSnapshot]
  );

  const setReadingGoal = useCallback(
    async (year: number, targetBooks: number) => {
      const now = new Date().toISOString();
      const existingIndex = goals.findIndex((g) => g.year === year);

      let updatedGoals: ReadingGoal[];
      if (existingIndex >= 0) {
        updatedGoals = [...goals];
        updatedGoals[existingIndex] = {
          year,
          targetBooks: Math.max(1, targetBooks),
          updatedAt: now,
        };
      } else {
        updatedGoals = [
          ...goals,
          {
            year,
            targetBooks: Math.max(1, targetBooks),
            updatedAt: now,
          },
        ];
      }

      const goalEvent: ActivityEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'goal_updated',
        summary: `Set reading goal for ${year} to ${targetBooks} books`,
        timestamp: now,
      };

      const updatedEvents = [goalEvent, ...events];

      setGoals(updatedGoals);
      setEvents(updatedEvents);

      await syncSnapshot(shelves, books, sessions, updatedEvents, updatedGoals);
      announce(`Updated ${year} reading goal to ${targetBooks} books`);
    },
    [goals, events, shelves, books, sessions, announce, syncSnapshot]
  );

  const replaceSnapshot = useCallback(
    async (newSnapshot: BookshelfSnapshot, announcementText?: string) => {
      setShelves(newSnapshot.shelves);
      setBooks(newSnapshot.books);
      setSessions(newSnapshot.sessions);
      setEvents(newSnapshot.events);
      setGoals(newSnapshot.goals);

      await persistSnapshot(newSnapshot);
      if (announcementText) {
        announce(announcementText);
      }
    },
    [announce]
  );

  const updateA11yPrefs = useCallback(
    (patch: Partial<AccessibilityPreferences>) => {
      setA11yPrefs((prev) => {
        const next: AccessibilityPreferences = { ...prev, ...patch };
        saveA11yPreferencesSync(next);
        return next;
      });
      announce('Accessibility preferences updated');
    },
    [announce]
  );

  const resetDemoLibrary = useCallback(async () => {
    setIsLoading(true);
    const seeded = await resetToCuratedDemoLibrary();
    setShelves(seeded.shelves);
    setBooks(seeded.books);
    setSessions(seeded.sessions);
    setEvents(seeded.events);
    setGoals(seeded.goals);
    setIsLoading(false);
    announce('Library reset to curated 45-book demo collection');
  }, [announce]);

  const clearAllData = useCallback(async () => {
    setIsLoading(true);
    const empty = await clearAllBookshelfData();
    setShelves(empty.shelves);
    setBooks(empty.books);
    setSessions(empty.sessions);
    setEvents(empty.events);
    setGoals(empty.goals);
    setIsLoading(false);
    announce('All library data cleared');
  }, [announce]);

  const contextValue = useMemo<BookshelfContextType>(
    () => ({
      isLoading,
      shelves,
      books,
      sessions,
      events,
      goals,
      a11yPrefs,
      liveAnnouncement,
      isSearchModalOpen,
      isShortcutsModalOpen,
      allKnownGenres,
      currentYearGoal,
      booksReadIn2026Count,
      addBookToLibrary,
      moveBookToShelf,
      updateReadingProgress,
      markBookFinished,
      updateBookDetails,
      deleteBook,
      bulkMoveBooks,
      bulkAddGenre,
      bulkDeleteBooks,
      createShelf,
      renameShelf,
      deleteShelf,
      reorderShelf,
      setReadingGoal,
      replaceSnapshot,
      updateA11yPrefs,
      resetDemoLibrary,
      clearAllData,
      announce,
      setSearchModalOpen,
      setShortcutsModalOpen,
    }),
    [
      isLoading,
      shelves,
      books,
      sessions,
      events,
      goals,
      a11yPrefs,
      liveAnnouncement,
      isSearchModalOpen,
      isShortcutsModalOpen,
      allKnownGenres,
      currentYearGoal,
      booksReadIn2026Count,
      addBookToLibrary,
      moveBookToShelf,
      updateReadingProgress,
      markBookFinished,
      updateBookDetails,
      deleteBook,
      bulkMoveBooks,
      bulkAddGenre,
      bulkDeleteBooks,
      createShelf,
      renameShelf,
      deleteShelf,
      reorderShelf,
      setReadingGoal,
      replaceSnapshot,
      updateA11yPrefs,
      resetDemoLibrary,
      clearAllData,
      announce,
    ]
  );

  return (
    <BookshelfContext.Provider value={contextValue}>
      {children}
      {/* Screen-reader live region for dynamic announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>
    </BookshelfContext.Provider>
  );
}

export function useBookshelf(): BookshelfContextType {
  const ctx = useContext(BookshelfContext);
  if (!ctx) {
    throw new Error('useBookshelf must be used within a BookshelfProvider');
  }
  return ctx;
}
