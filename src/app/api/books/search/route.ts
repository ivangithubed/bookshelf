import {
  ALL_CURATED_CANDIDATES,
  normalizeOpenLibraryDoc,
} from '@/lib/open-library/client';
import type { OpenLibrarySearchResponse } from '@/types/bookshelf';

interface CacheEntry {
  data: OpenLibrarySearchResponse;
  timestamp: number;
}

const CACHE = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 mins

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim().slice(0, 500);

  if (!query) {
    return Response.json({
      query: '',
      totalFound: 0,
      items: [],
      cached: false,
    } satisfies OpenLibrarySearchResponse);
  }

  const cacheKey = query.toLowerCase();
  const cachedEntry = CACHE.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    return Response.json({
      ...cachedEntry.data,
      cached: true,
    } satisfies OpenLibrarySearchResponse);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const olUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    const res = await fetch(olUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BookshelfReadingTracker/1.0 (https://bookshelf.app)',
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const rawData = (await res.json()) as {
        docs?: Record<string, unknown>[];
        numFound?: number;
      };
      const docs = Array.isArray(rawData.docs) ? rawData.docs : [];
      const items = docs.slice(0, 20).map(normalizeOpenLibraryDoc);

      const searchResponse: OpenLibrarySearchResponse = {
        query,
        totalFound: rawData.numFound ?? items.length,
        items,
        cached: false,
      };

      if (CACHE.size >= MAX_CACHE_SIZE) {
        const oldestKey = CACHE.keys().next().value;
        if (oldestKey) CACHE.delete(oldestKey);
      }
      CACHE.set(cacheKey, { data: searchResponse, timestamp: Date.now() });

      return Response.json(searchResponse);
    }
  } catch {
    // Network failure or 5s timeout: proceed to curated fallback
  } finally {
    clearTimeout(timeoutId);
  }

  // Graceful local curated fallback
  const qLower = query.toLowerCase();
  const matched = ALL_CURATED_CANDIDATES.filter(
    (c) =>
      c.title.toLowerCase().includes(qLower) ||
      c.author.toLowerCase().includes(qLower) ||
      c.genres.some((g) => g.toLowerCase().includes(qLower)) ||
      (c.isbn13 && c.isbn13.includes(qLower)) ||
      (c.isbn10 && c.isbn10.includes(qLower))
  );

  return Response.json({
    query,
    totalFound: matched.length,
    items: matched,
    cached: false,
  } satisfies OpenLibrarySearchResponse);
}
