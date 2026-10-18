import type {
  ActivityEvent,
  BookItem,
  ConflictResolutionStrategy,
  CsvParseResult,
  ImportExecutionSummary,
  ImportPreviewItem,
  ParsedGoodreadsRow,
  Shelf,
  SystemShelfSlug,
} from '@/types/bookshelf';
import type { BookshelfSnapshot } from '@/lib/db/indexed-db';

const SYSTEM_SHELF_NAMES = new Set(['read', 'currently-reading', 'to-read', 'want-to-read']);

/**
 * Strips Goodreads `="0743273567"` wrapping, quotes, equals signs, and whitespace.
 * Returns null if the resulting string is empty or invalid.
 */
export function cleanGoodreadsIsbn(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/[="']/g, '').trim();
  if (!stripped) return null;
  const digitsOnly = stripped.replace(/[^0-9Xx]/g, '');
  if (digitsOnly.length >= 9 && digitsOnly.length <= 13) {
    return digitsOnly;
  }
  return stripped.length > 0 ? stripped : null;
}

/**
 * Strips HTML tags like `<i>Still</i>` or `<br/>` and decodes HTML entities.
 */
export function sanitizeHtmlText(raw: string | undefined | null): string {
  if (!raw) return '';
  let text = raw;
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 16)));
  return text.trim();
}

/**
 * Normalizes book title and author into a deduplication key.
 */
export function normalizeBookIdentityKey(title: string, author: string): string {
  const normTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const primaryAuthor = (author || '').split(',')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  return `${normTitle}|${primaryAuthor}`;
}

/**
 * Formats author string by combining primary author and additional authors.
 */
export function formatGoodreadsAuthor(
  authorRaw: string,
  authorLfRaw: string,
  additionalAuthorsRaw: string
): string {
  let primary = authorRaw.trim();
  if (!primary && authorLfRaw) {
    const parts = authorLfRaw.split(',').map((p) => p.trim());
    if (parts.length === 2 && parts[1] && parts[0]) {
      primary = `${parts[1]} ${parts[0]}`;
    } else {
      primary = authorLfRaw.trim();
    }
  }
  const additional = additionalAuthorsRaw.trim();
  if (additional && !primary.toLowerCase().includes(additional.toLowerCase())) {
    return `${primary}, ${additional}`;
  }
  return primary;
}

/**
 * Parses dates in YYYY/MM/DD, YYYY-MM-DD, or ISO formats to standardized ISO string.
 */
export function parseGoodreadsDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match && match[1] && match[2] && match[3]) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return null;
}

/**
 * Maps Goodreads exclusive shelf to SystemShelfSlug.
 */
export function mapGoodreadsExclusiveShelf(raw: string | undefined | null): SystemShelfSlug {
  const norm = (raw ?? '').trim().toLowerCase();
  if (norm === 'read') return 'read';
  if (norm === 'currently-reading') return 'currently-reading';
  if (norm === 'to-read') return 'want-to-read';
  return 'want-to-read';
}

/**
 * Extracts custom shelf names from Goodreads bookshelves column.
 */
export function extractCustomShelves(rawBookshelves: string | undefined | null): string[] {
  if (!rawBookshelves) return [];
  const parts = rawBookshelves.split(',').map((p) => p.trim()).filter(Boolean);
  const customShelves: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (!SYSTEM_SHELF_NAMES.has(lower)) {
      const titleCased = part
        .split(/[\s-_]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      if (!customShelves.includes(titleCased)) {
        customShelves.push(titleCased);
      }
    }
  }
  return customShelves;
}

/**
 * RFC-4180 compliant CSV tokenizer handling escaped quotes and multiline cells.
 */
export function tokenizeCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && csvText[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < len && csvText[i + 1] === '\n') {
          i++;
        }
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0]?.trim().length));
}

/**
 * Finds an existing book matching by ISBN-13, ISBN-10, or normalized title + primary author.
 */
export function findDuplicateBook(
  row: ParsedGoodreadsRow,
  existingBooks: BookItem[]
): { existingBook?: BookItem; matchedBy?: 'isbn13' | 'isbn10' | 'title_author' } {
  if (row.isbn13) {
    const match = existingBooks.find((b) => b.isbn13 && b.isbn13 === row.isbn13);
    if (match) return { existingBook: match, matchedBy: 'isbn13' };
  }
  if (row.isbn10) {
    const match = existingBooks.find((b) => b.isbn10 && b.isbn10 === row.isbn10);
    if (match) return { existingBook: match, matchedBy: 'isbn10' };
  }
  const rowKey = normalizeBookIdentityKey(row.title, row.author);
  const match = existingBooks.find(
    (b) => normalizeBookIdentityKey(b.title, b.author) === rowKey
  );
  if (match) {
    return { existingBook: match, matchedBy: 'title_author' };
  }
  return {};
}

/**
 * Parses Goodreads CSV export text into preview items with duplicate detection and stats.
 */
export function parseGoodreadsCsv(
  csvText: string,
  existingBooks: BookItem[] = [],
  defaultResolution: ConflictResolutionStrategy = 'skip'
): CsvParseResult {
  const startTime = performance.now();
  const rows = tokenizeCsv(csvText);
  const warnings: string[] = [];

  if (rows.length === 0) {
    return {
      items: [],
      totalRows: 0,
      validRows: 0,
      duplicateCount: 0,
      customShelvesDetected: [],
      warnings: ['CSV file is empty'],
      parseDurationMs: performance.now() - startTime,
    };
  }

  const headerRow = rows[0]!;
  const colMap = new Map<string, number>();
  headerRow.forEach((col, idx) => {
    colMap.set(col.trim().toLowerCase(), idx);
  });

  const getCol = (r: string[], name: string): string => {
    const idx = colMap.get(name.toLowerCase());
    return idx !== undefined && idx < r.length ? (r[idx] ?? '').trim() : '';
  };

  const items: ImportPreviewItem[] = [];
  const customShelvesSet = new Set<string>();
  let duplicateCount = 0;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
    const r = rows[rowIndex];
    if (!r || r.length === 0) continue;

    const title = sanitizeHtmlText(getCol(r, 'title'));
    if (!title) {
      warnings.push(`Row ${rowIndex}: Skipped due to missing title`);
      continue;
    }

    const rawAuthor = getCol(r, 'author');
    const rawAuthorLf = getCol(r, 'author l-f');
    const rawAdditionalAuthors = getCol(r, 'additional authors');
    const author = formatGoodreadsAuthor(rawAuthor, rawAuthorLf, rawAdditionalAuthors);

    const isbn10 = cleanGoodreadsIsbn(getCol(r, 'isbn'));
    const isbn13 = cleanGoodreadsIsbn(getCol(r, 'isbn13'));

    const ratingRaw = parseFloat(getCol(r, 'my rating'));
    const rating = isNaN(ratingRaw) || ratingRaw <= 0 ? null : Math.min(5, Math.max(1, Math.round(ratingRaw)));

    const avgRatingRaw = parseFloat(getCol(r, 'average rating'));
    const averageRating = isNaN(avgRatingRaw) ? null : avgRatingRaw;

    const pageCountRaw = parseInt(getCol(r, 'number of pages'), 10);
    const pageCount = isNaN(pageCountRaw) || pageCountRaw <= 0 ? null : pageCountRaw;

    const yearPublished = getCol(r, 'year published') || null;
    const originalPublicationYear = getCol(r, 'original publication year') || null;

    const dateRead = parseGoodreadsDate(getCol(r, 'date read'));
    const dateAdded = parseGoodreadsDate(getCol(r, 'date added')) ?? new Date().toISOString();

    const bookshelvesRaw = getCol(r, 'bookshelves');
    const customShelfNames = extractCustomShelves(bookshelvesRaw);
    customShelfNames.forEach((s) => customShelvesSet.add(s));

    const exclusiveShelf = mapGoodreadsExclusiveShelf(getCol(r, 'exclusive shelf'));

    const review = sanitizeHtmlText(getCol(r, 'my review'));
    const privateNotes = sanitizeHtmlText(getCol(r, 'private notes'));

    const readCountRaw = parseInt(getCol(r, 'read count'), 10);
    const readCount = isNaN(readCountRaw) || readCountRaw < 0 ? (exclusiveShelf === 'read' ? 1 : 0) : readCountRaw;

    const NeedsEnrichment = !isbn13 || pageCount === null;

    const parsedRow: ParsedGoodreadsRow = {
      rowIndex,
      bookId: getCol(r, 'book id') || `gr-${rowIndex}`,
      title,
      author: author || 'Unknown Author',
      isbn10,
      isbn13,
      rating,
      averageRating,
      publisher: getCol(r, 'publisher') || null,
      binding: getCol(r, 'binding') || null,
      pageCount,
      yearPublished,
      originalPublicationYear,
      dateRead,
      dateAdded,
      bookshelves: bookshelvesRaw ? bookshelvesRaw.split(',').map((s) => s.trim()).filter(Boolean) : [],
      exclusiveShelf,
      customShelfNames,
      review,
      privateNotes,
      readCount,
      NeedsEnrichment,
    };

    const duplicate = findDuplicateBook(parsedRow, existingBooks);
    const isDuplicate = Boolean(duplicate.existingBook);
    if (isDuplicate) duplicateCount++;

    items.push({
      row: parsedRow,
      isDuplicate,
      existingBookId: duplicate.existingBook?.id,
      matchedBy: duplicate.matchedBy,
      resolution: isDuplicate ? defaultResolution : 'replace',
    });
  }

  return {
    items,
    totalRows: rows.length - 1,
    validRows: items.length,
    duplicateCount,
    customShelvesDetected: Array.from(customShelvesSet).sort(),
    warnings,
    parseDurationMs: performance.now() - startTime,
  };
}

/**
 * Executes import of preview items into BookshelfSnapshot adhering to resolution strategies.
 */
export function executeGoodreadsImport(
  snapshot: BookshelfSnapshot,
  previewItems: ImportPreviewItem[]
): { snapshot: BookshelfSnapshot; summary: ImportExecutionSummary } {
  const shelves: Shelf[] = snapshot.shelves.map((s: Shelf) => ({ ...s }));
  const books: BookItem[] = snapshot.books.map((b: BookItem) => ({ ...b }));
  const events: ActivityEvent[] = snapshot.events.map((e: ActivityEvent) => ({ ...e }));
  const customShelvesCreated: string[] = [];
  const booksNeedingEnrichment: string[] = [];

  let addedCount = 0;
  let replacedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < previewItems.length; i++) {
    const item = previewItems[i]!;
    const row = item.row;

    if (item.isDuplicate && item.resolution === 'skip') {
      skippedCount++;
      continue;
    }

    // Determine target shelf: custom shelves like 'Favorites' are preserved or created
    let targetShelfId: string = row.exclusiveShelf;
    if (row.customShelfNames.length > 0) {
      const primaryCustomName = row.customShelfNames[0]!;
      const slug = primaryCustomName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existingShelf = shelves.find(
        (s: Shelf) => s.slug === slug || s.name.toLowerCase() === primaryCustomName.toLowerCase()
      );
      if (!existingShelf) {
        const newShelf: Shelf = {
          id: slug,
          slug,
          name: primaryCustomName,
          isDefault: false,
          position: shelves.length,
          createdAt: new Date().toISOString(),
        };
        shelves.push(newShelf);
        if (!customShelvesCreated.includes(primaryCustomName)) {
          customShelvesCreated.push(primaryCustomName);
        }
        targetShelfId = slug;
      } else {
        targetShelfId = existingShelf.id;
      }
    }

    const isRead = row.exclusiveShelf === 'read' || Boolean(row.dateRead);
    const progressPercent = row.exclusiveShelf === 'read' ? 100 : (row.exclusiveShelf === 'currently-reading' ? 10 : 0);
    const currentPage = row.pageCount !== null && row.exclusiveShelf === 'read' ? row.pageCount : null;
    const readCount = row.readCount || (isRead ? 1 : 0);
    const notes = [row.review, row.privateNotes].filter(Boolean).join('\n\n');
    const coverUrl = row.isbn13 ? `https://covers.openlibrary.org/b/isbn/${row.isbn13}-L.jpg` : null;

    if (item.isDuplicate && item.resolution === 'replace' && item.existingBookId) {
      const bookIdx = books.findIndex((b: BookItem) => b.id === item.existingBookId);
      if (bookIdx >= 0) {
        const existing = books[bookIdx]!;
        books[bookIdx] = {
          ...existing,
          title: row.title || existing.title,
          author: row.author || existing.author,
          isbn10: row.isbn10 ?? existing.isbn10,
          isbn13: row.isbn13 ?? existing.isbn13,
          coverUrl: existing.coverUrl ?? coverUrl,
          pageCount: row.pageCount ?? existing.pageCount,
          publishedDate: row.originalPublicationYear || row.yearPublished || existing.publishedDate,
          publisher: row.publisher ?? existing.publisher,
          shelfId: targetShelfId,
          isRead: isRead || existing.isRead,
          readCount: Math.max(readCount, existing.readCount),
          currentPage: isRead ? (row.pageCount ?? existing.pageCount) : existing.currentPage,
          progressPercent: isRead ? 100 : existing.progressPercent,
          rating: row.rating ?? existing.rating,
          notes: notes || existing.notes,
          dateAdded: row.dateAdded || existing.dateAdded,
          dateFinished: row.dateRead ?? existing.dateFinished,
        };
        replacedCount++;
        if (row.NeedsEnrichment) {
          booksNeedingEnrichment.push(books[bookIdx].id);
        }
        continue;
      }
    }

    // New book addition (new or keep_both)
    const newBookId = `book-import-${Date.now()}-${i + 1}`;
    const newBook: BookItem = {
      id: newBookId,
      title: row.title,
      author: row.author,
      isbn10: row.isbn10,
      isbn13: row.isbn13,
      coverUrl,
      pageCount: row.pageCount,
      publishedDate: row.originalPublicationYear || row.yearPublished || null,
      genres: [],
      description: null,
      publisher: row.publisher,
      shelfId: targetShelfId,
      isRead,
      readCount,
      currentPage,
      progressPercent,
      lastProgressUpdatedAt: row.dateRead || row.dateAdded,
      rating: row.rating,
      notes,
      dateAdded: row.dateAdded,
      dateStarted: row.exclusiveShelf === 'currently-reading' ? row.dateAdded : null,
      dateFinished: row.dateRead,
    };
    books.push(newBook);
    addedCount++;
    if (row.NeedsEnrichment) {
      booksNeedingEnrichment.push(newBookId);
    }
  }

  if (addedCount > 0 || replacedCount > 0) {
    events.unshift({
      id: `event-import-${Date.now()}`,
      type: 'csv_imported',
      summary: `Imported ${addedCount} books from Goodreads (${replacedCount} updated, ${skippedCount} skipped)`,
      detail: customShelvesCreated.length > 0 ? `Created shelves: ${customShelvesCreated.join(', ')}` : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  const summary: ImportExecutionSummary = {
    addedCount,
    replacedCount,
    skippedCount,
    customShelvesCreated,
    booksNeedingEnrichment,
    timestamp: new Date().toISOString(),
  };

  return {
    snapshot: {
      ...snapshot,
      shelves,
      books,
      events,
    },
    summary,
  };
}
