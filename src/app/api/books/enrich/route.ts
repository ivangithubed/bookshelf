import {
  ALL_CURATED_CANDIDATES,
  normalizeOpenLibraryDoc,
} from '@/lib/open-library/client';
import type { BookItem } from '@/types/bookshelf';

interface CacheEntry {
  data: Partial<BookItem> | null;
  timestamp: number;
}

const CACHE = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const rawIsbn = searchParams.get('isbn');
  const isbn = rawIsbn ? rawIsbn.replace(/[^0-9Xx]/g, '') : null;
  const title = (searchParams.get('title') ?? '').trim();
  const author = (searchParams.get('author') ?? '').trim();

  if (!isbn && !title) {
    return Response.json(null, { status: 400 });
  }

  const cacheKey = (isbn || `${title}|${author}`).toLowerCase();
  const cachedEntry = CACHE.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    return Response.json(cachedEntry.data);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    let result: Partial<BookItem> | null = null;

    if (isbn) {
      // 1. Try ISBN direct lookup
      const isbnUrl = `https://openlibrary.org/isbn/${encodeURIComponent(isbn)}.json`;
      const res = await fetch(isbnUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BookshelfReadingTracker/1.0 (https://bookshelf.app)',
        },
      });

      if (res.ok) {
        const doc = (await res.json()) as Record<string, unknown>;
        const pageCount =
          typeof doc.number_of_pages === 'number' && doc.number_of_pages > 0
            ? doc.number_of_pages
            : null;

        let publisher: string | null = null;
        if (Array.isArray(doc.publishers) && doc.publishers.length > 0) {
          publisher = String(doc.publishers[0]);
        }

        let publishedDate: string | null = null;
        if (typeof doc.publish_date === 'string') {
          publishedDate = doc.publish_date;
        }

        let description: string | null = null;
        if (typeof doc.description === 'string') {
          description = doc.description;
        } else if (
          typeof doc.description === 'object' &&
          doc.description !== null &&
          'value' in doc.description
        ) {
          description = String((doc.description as { value: unknown }).value);
        }

        const genres: string[] = [];
        if (Array.isArray(doc.subjects)) {
          for (const s of doc.subjects) {
            const clean = String(s).trim();
            if (clean.length > 2 && clean.length < 30) {
              genres.push(clean);
            }
            if (genres.length >= 4) break;
          }
        }

        result = {
          title: typeof doc.title === 'string' ? doc.title : title,
          author: author || 'Unknown Author',
          isbn13: isbn.length === 13 ? isbn : null,
          isbn10: isbn.length === 10 ? isbn : null,
          coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
          pageCount,
          publishedDate,
          publisher,
          genres,
          description,
        };
      }
    }

    if (!result && title) {
      // 2. Fall back to search query
      const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(
        `${title} ${author}`.trim()
      )}&limit=5`;
      const res = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BookshelfReadingTracker/1.0 (https://bookshelf.app)',
        },
      });

      if (res.ok) {
        const raw = (await res.json()) as { docs?: Record<string, unknown>[] };
        if (Array.isArray(raw.docs) && raw.docs.length > 0) {
          const candidate = normalizeOpenLibraryDoc(raw.docs[0]!);
          result = {
            title: candidate.title,
            author: candidate.author,
            isbn10: candidate.isbn10,
            isbn13: candidate.isbn13,
            coverUrl: candidate.coverUrl,
            pageCount: candidate.pageCount,
            publishedDate: candidate.firstPublishYear,
            genres: candidate.genres,
            description: candidate.description,
            publisher: candidate.publisher,
            openLibraryKey: candidate.workKey,
          };
        }
      }
    }

    clearTimeout(timeoutId);

    if (result) {
      if (CACHE.size >= MAX_CACHE_SIZE) {
        const oldestKey = CACHE.keys().next().value;
        if (oldestKey) CACHE.delete(oldestKey);
      }
      CACHE.set(cacheKey, { data: result, timestamp: Date.now() });
      return Response.json(result);
    }
  } catch {
    // Timeout or network error
  } finally {
    clearTimeout(timeoutId);
  }

  // 3. Fall back to local curated candidates
  const localMatch = ALL_CURATED_CANDIDATES.find((c) => {
    if (isbn && (c.isbn13 === isbn || c.isbn10 === isbn)) return true;
    return (
      c.title.toLowerCase() === title.toLowerCase() ||
      (c.title.toLowerCase().includes(title.toLowerCase()) &&
        c.author.toLowerCase().includes(author.toLowerCase()))
    );
  });

  if (localMatch) {
    const fallbackResult: Partial<BookItem> = {
      title: localMatch.title,
      author: localMatch.author,
      isbn10: localMatch.isbn10,
      isbn13: localMatch.isbn13,
      coverUrl: localMatch.coverUrl,
      pageCount: localMatch.pageCount,
      publishedDate: localMatch.firstPublishYear,
      genres: localMatch.genres,
      description: localMatch.description,
      publisher: localMatch.publisher,
      openLibraryKey: localMatch.workKey,
    };
    return Response.json(fallbackResult);
  }

  return Response.json(null);
}
