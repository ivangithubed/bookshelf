import { openDB, type IDBPDatabase } from 'idb';
import type {
  AccessibilityPreferences,
  ActivityEvent,
  BookItem,
  ReadingGoal,
  ReadingSessionLog,
  Shelf,
} from '@/types/bookshelf';
import { buildCuratedSeedData } from '@/lib/seed/seed-data';

const DB_NAME = 'bookshelf_db_v1';
const DB_VERSION = 1;
export const A11Y_STORAGE_KEY = 'bookshelf_a11y_prefs_v1';

export const DEFAULT_A11Y_PREFERENCES: AccessibilityPreferences = {
  theme: 'system',
  contrast: 'standard',
  readingFontSize: 'base',
  readingLineHeight: 'relaxed',
  dyslexiaFont: false,
  reducedMotion: 'system',
};

export interface BookshelfSnapshot {
  shelves: Shelf[];
  books: BookItem[];
  sessions: ReadingSessionLog[];
  events: ActivityEvent[];
  goals: ReadingGoal[];
}

let memoryFallbackStore: BookshelfSnapshot | null = null;
let dbPromise: Promise<IDBPDatabase> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

async function getDbInstance(): Promise<IDBPDatabase | null> {
  if (!isIndexedDbSupported()) {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('shelves')) {
          db.createObjectStore('shelves', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reading_sessions')) {
          db.createObjectStore('reading_sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('activity_events')) {
          db.createObjectStore('activity_events', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('goals')) {
          db.createObjectStore('goals', { keyPath: 'year' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    });
  }
  try {
    return await dbPromise;
  } catch {
    return null;
  }
}

export async function loadOrSeedBookshelf(): Promise<BookshelfSnapshot> {
  const db = await getDbInstance();
  if (!db) {
    if (!memoryFallbackStore) {
      memoryFallbackStore = buildCuratedSeedData();
    }
    return structuredClone(memoryFallbackStore);
  }

  const metaSeeded = await db.get('meta', 'initialized');
  const existingBooks = await db.getAll('books');

  if (!metaSeeded && existingBooks.length === 0) {
    const seeded = buildCuratedSeedData();
    await persistSnapshot(seeded);
    await db.put('meta', { key: 'initialized', value: true, timestamp: new Date().toISOString() });
    return seeded;
  }

  const [shelves, books, sessions, events, goals] = await Promise.all([
    db.getAll('shelves') as Promise<Shelf[]>,
    db.getAll('books') as Promise<BookItem[]>,
    db.getAll('reading_sessions') as Promise<ReadingSessionLog[]>,
    db.getAll('activity_events') as Promise<ActivityEvent[]>,
    db.getAll('goals') as Promise<ReadingGoal[]>,
  ]);

  shelves.sort((a, b) => a.position - b.position);
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    shelves,
    books,
    sessions,
    events,
    goals,
  };
}

export async function persistSnapshot(snapshot: BookshelfSnapshot): Promise<void> {
  memoryFallbackStore = structuredClone(snapshot);
  const db = await getDbInstance();
  if (!db) return;

  const tx = db.transaction(
    ['shelves', 'books', 'reading_sessions', 'activity_events', 'goals'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('shelves').clear(),
    tx.objectStore('books').clear(),
    tx.objectStore('reading_sessions').clear(),
    tx.objectStore('activity_events').clear(),
    tx.objectStore('goals').clear(),
  ]);

  for (const shelf of snapshot.shelves) {
    await tx.objectStore('shelves').put(shelf);
  }
  for (const book of snapshot.books) {
    await tx.objectStore('books').put(book);
  }
  for (const session of snapshot.sessions) {
    await tx.objectStore('reading_sessions').put(session);
  }
  for (const event of snapshot.events) {
    await tx.objectStore('activity_events').put(event);
  }
  for (const goal of snapshot.goals) {
    await tx.objectStore('goals').put(goal);
  }

  await tx.done;
}

export async function resetToCuratedDemoLibrary(): Promise<BookshelfSnapshot> {
  const seeded = buildCuratedSeedData();
  await persistSnapshot(seeded);
  const db = await getDbInstance();
  if (db) {
    await db.put('meta', { key: 'initialized', value: true, timestamp: new Date().toISOString() });
  }
  return seeded;
}

export async function clearAllBookshelfData(): Promise<BookshelfSnapshot> {
  const seeded = buildCuratedSeedData();
  const emptySnapshot: BookshelfSnapshot = {
    shelves: seeded.shelves.filter((s) => s.isDefault),
    books: [],
    sessions: [],
    events: [],
    goals: [],
  };
  await persistSnapshot(emptySnapshot);
  const db = await getDbInstance();
  if (db) {
    await db.put('meta', { key: 'initialized', value: true, timestamp: new Date().toISOString() });
  }
  return emptySnapshot;
}

/**
 * Synchronous Accessibility & Theme Preferences via localStorage (ADR-001)
 */
export function loadA11yPreferencesSync(): AccessibilityPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_A11Y_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_A11Y_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPreferences>;
    return {
      theme: parsed.theme ?? DEFAULT_A11Y_PREFERENCES.theme,
      contrast: parsed.contrast ?? DEFAULT_A11Y_PREFERENCES.contrast,
      readingFontSize: parsed.readingFontSize ?? DEFAULT_A11Y_PREFERENCES.readingFontSize,
      readingLineHeight: parsed.readingLineHeight ?? DEFAULT_A11Y_PREFERENCES.readingLineHeight,
      dyslexiaFont: Boolean(parsed.dyslexiaFont),
      reducedMotion: parsed.reducedMotion ?? DEFAULT_A11Y_PREFERENCES.reducedMotion,
    };
  } catch {
    return DEFAULT_A11Y_PREFERENCES;
  }
}

export function saveA11yPreferencesSync(prefs: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
    applyA11yPreferencesToDocument(prefs);
  } catch {
    // Ignore storage quota errors
  }
}

export function applyA11yPreferencesToDocument(prefs: AccessibilityPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme =
    prefs.theme === 'system' ? (prefersDark ? 'dark' : 'light') : prefs.theme;

  root.setAttribute('data-theme', resolvedTheme);
  root.setAttribute('data-contrast', prefs.contrast);
  root.setAttribute('data-reading-size', prefs.readingFontSize);
  root.setAttribute('data-reading-leading', prefs.readingLineHeight);
  root.setAttribute('data-dyslexia-font', String(prefs.dyslexiaFont));

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resolvedReducedMotion =
    prefs.reducedMotion === 'system' ? prefersReducedMotion : prefs.reducedMotion === 'on';

  root.setAttribute('data-reduced-motion', String(resolvedReducedMotion));
}
