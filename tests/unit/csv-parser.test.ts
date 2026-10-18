import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  cleanGoodreadsIsbn,
  executeGoodreadsImport,
  extractCustomShelves,
  formatGoodreadsAuthor,
  mapGoodreadsExclusiveShelf,
  normalizeBookIdentityKey,
  parseGoodreadsCsv,
  parseGoodreadsDate,
  sanitizeHtmlText,
  tokenizeCsv,
} from '@/lib/csv/goodreads-parser';
import { buildCuratedSeedData } from '@/lib/seed/seed-data';
import type { BookshelfSnapshot } from '@/lib/db/indexed-db';
import type { BookItem, Shelf } from '@/types/bookshelf';

describe('Goodreads CSV Parser & Migration Pro', () => {
  describe('cleanGoodreadsIsbn', () => {
    it('strips standard Goodreads ="0743273567" wrapping', () => {
      expect(cleanGoodreadsIsbn('="0743273567"')).toBe('0743273567');
      expect(cleanGoodreadsIsbn('="9780743273565"')).toBe('9780743273565');
    });

    it('handles extra leading whitespace and multiple quotes e.g. row 21', () => {
      expect(cleanGoodreadsIsbn(' =""9780385521314"""')).toBe('9780385521314');
      expect(cleanGoodreadsIsbn('  ="9780593135204"  ')).toBe('9780593135204');
    });

    it('preserves ISBN-10 with check-digit X', () => {
      expect(cleanGoodreadsIsbn('="031624662X"')).toBe('031624662X');
      expect(cleanGoodreadsIsbn('031624662x')).toBe('031624662x');
    });

    it('returns null for empty, whitespace, or invalid raw values', () => {
      expect(cleanGoodreadsIsbn('')).toBeNull();
      expect(cleanGoodreadsIsbn(undefined)).toBeNull();
      expect(cleanGoodreadsIsbn(null)).toBeNull();
      expect(cleanGoodreadsIsbn('=""')).toBeNull();
      expect(cleanGoodreadsIsbn('   ')).toBeNull();
    });
  });

  describe('sanitizeHtmlText', () => {
    it('strips HTML tags such as <i> and <p>', () => {
      expect(sanitizeHtmlText('<i>Still</i> relevant after 50 years.')).toBe(
        'Still relevant after 50 years.'
      );
      expect(sanitizeHtmlText('<p>Hello</p>World')).toBe('Hello\nWorld');
    });

    it('decodes HTML entities into human-readable characters', () => {
      expect(sanitizeHtmlText('Tom &amp; Jerry')).toBe('Tom & Jerry');
      expect(sanitizeHtmlText('&quot;Deep Work&quot; &#39;rules&#39;')).toBe(
        '"Deep Work" \'rules\''
      );
      expect(sanitizeHtmlText('5 &lt; 10 &gt; 2 &nbsp;')).toBe('5 < 10 > 2');
    });

    it('handles null and undefined gracefully', () => {
      expect(sanitizeHtmlText(null)).toBe('');
      expect(sanitizeHtmlText(undefined)).toBe('');
      expect(sanitizeHtmlText('   ')).toBe('');
    });
  });

  describe('formatGoodreadsAuthor', () => {
    it('combines primary author with additional authors', () => {
      const combined = formatGoodreadsAuthor('David Thomas', '', 'Andrew Hunt');
      expect(combined).toBe('David Thomas, Andrew Hunt');
    });

    it('falls back to author l-f format when primary author is missing', () => {
      const parsed = formatGoodreadsAuthor('', 'Fitzgerald, F. Scott', '');
      expect(parsed).toBe('F. Scott Fitzgerald');
    });

    it('does not duplicate author if already present in primary', () => {
      const res = formatGoodreadsAuthor('David Thomas, Andrew Hunt', '', 'Andrew Hunt');
      expect(res).toBe('David Thomas, Andrew Hunt');
    });
  });

  describe('parseGoodreadsDate', () => {
    it('parses YYYY/MM/DD to ISO format at midday UTC', () => {
      expect(parseGoodreadsDate('2025/09/14')).toBe('2025-09-14T12:00:00.000Z');
    });

    it('parses YYYY-MM-DD to ISO format', () => {
      expect(parseGoodreadsDate('2026-04-20')).toBe('2026-04-20T12:00:00.000Z');
    });

    it('returns null for empty date strings', () => {
      expect(parseGoodreadsDate('')).toBeNull();
      expect(parseGoodreadsDate(null)).toBeNull();
      expect(parseGoodreadsDate(undefined)).toBeNull();
    });
  });

  describe('mapGoodreadsExclusiveShelf', () => {
    it('maps Goodreads exclusive shelves to system shelf slugs', () => {
      expect(mapGoodreadsExclusiveShelf('read')).toBe('read');
      expect(mapGoodreadsExclusiveShelf('currently-reading')).toBe('currently-reading');
      expect(mapGoodreadsExclusiveShelf('to-read')).toBe('want-to-read');
      expect(mapGoodreadsExclusiveShelf('unknown')).toBe('want-to-read');
    });
  });

  describe('extractCustomShelves', () => {
    it('extracts non-system custom shelves and formats them', () => {
      expect(extractCustomShelves('favorites, read')).toEqual(['Favorites']);
      expect(extractCustomShelves('favorites')).toEqual(['Favorites']);
      expect(extractCustomShelves('sci-fi-club, to-read')).toEqual(['Sci Fi Club']);
      expect(extractCustomShelves('read')).toEqual([]);
    });
  });

  describe('tokenizeCsv (RFC-4180)', () => {
    it('handles commas inside double quotes', () => {
      const text = '1,"Thinking, Fast and Slow",Daniel Kahneman\n2,Dune,Frank Herbert';
      const rows = tokenizeCsv(text);
      expect(rows).toHaveLength(2);
      expect(rows[0]![1]).toBe('Thinking, Fast and Slow');
    });

    it('handles escaped double quotes', () => {
      const text = '1,"He said ""Hello"" to everyone",Author';
      const rows = tokenizeCsv(text);
      expect(rows[0]![1]).toBe('He said "Hello" to everyone');
    });

    it('handles multiline strings inside double quotes', () => {
      const text = '1,"Line one\nLine two",Author';
      const rows = tokenizeCsv(text);
      expect(rows).toHaveLength(1);
      expect(rows[0]![1]).toBe('Line one\nLine two');
    });
  });

  describe('Parsing Real sample-books.csv File', () => {
    const csvPath = path.resolve(process.cwd(), 'src/data/sample-books.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');

    it('parses all 45 curated rows successfully without crashing', () => {
      const result = parseGoodreadsCsv(csvText);
      expect(result.validRows).toBe(45);
      expect(result.totalRows).toBe(45);
      expect(result.items).toHaveLength(45);
      expect(result.warnings).toHaveLength(0);
      expect(result.customShelvesDetected).toContain('Favorites');
    });

    it('correctly handles David Thomas & Andrew Hunt co-authors on row 38', () => {
      const result = parseGoodreadsCsv(csvText);
      const pragmatic = result.items.find((i) => i.row.title === 'The Pragmatic Programmer');
      expect(pragmatic).toBeDefined();
      expect(pragmatic?.row.author).toBe('David Thomas, Andrew Hunt');
      expect(pragmatic?.row.isbn13).toBe('9780135957059');
      expect(pragmatic?.row.rating).toBe(5);
    });

    it('treats My Rating of 0 as null (unrated)', () => {
      const result = parseGoodreadsCsv(csvText);
      const sayNothing = result.items.find((i) => i.row.title.includes('Say Nothing'));
      expect(sayNothing).toBeDefined();
      expect(sayNothing?.row.rating).toBeNull();

      const dispossessed = result.items.find((i) => i.row.title === 'The Dispossessed');
      expect(dispossessed?.row.rating).toBeNull();
    });

    it('sanitizes HTML review in The Mythical Man-Month (<i>Still</i>)', () => {
      const result = parseGoodreadsCsv(csvText);
      const mmm = result.items.find((i) => i.row.title === 'The Mythical Man-Month');
      expect(mmm).toBeDefined();
      expect(mmm?.row.review).toContain('Still relevant after 50 years.');
      expect(mmm?.row.review).not.toContain('<i>');
    });

    it('correctly parses books with missing ISBNs e.g. Eloquent JavaScript', () => {
      const result = parseGoodreadsCsv(csvText);
      const ejs = result.items.find((i) => i.row.title === 'Eloquent JavaScript');
      expect(ejs).toBeDefined();
      expect(ejs?.row.isbn10).toBeNull();
      expect(ejs?.row.isbn13).toBeNull();
      expect(ejs?.row.NeedsEnrichment).toBe(true);
    });

    it('detects duplicates when existing library books are supplied', () => {
      const seed = buildCuratedSeedData();
      const result = parseGoodreadsCsv(csvText, seed.books);
      expect(result.duplicateCount).toBe(45);
      expect(result.items.every((i) => i.isDuplicate)).toBe(true);
    });

    it('computes normalizeBookIdentityKey consistently', () => {
      expect(normalizeBookIdentityKey('The Great Gatsby', 'F. Scott Fitzgerald')).toBe(
        'thegreatgatsby|fscottfitzgerald'
      );
    });
  });

  describe('executeGoodreadsImport', () => {
    const csvPath = path.resolve(process.cwd(), 'src/data/sample-books.csv');
    const csvText = fs.readFileSync(csvPath, 'utf-8');

    it('imports new books into an empty snapshot', () => {
      const emptySnapshot: BookshelfSnapshot = {
        shelves: [
          {
            id: 'currently-reading',
            slug: 'currently-reading',
            name: 'Currently Reading',
            isDefault: true,
            position: 0,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'want-to-read',
            slug: 'want-to-read',
            name: 'Want to Read',
            isDefault: true,
            position: 1,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'read',
            slug: 'read',
            name: 'Read',
            isDefault: true,
            position: 2,
            createdAt: '2025-01-01T00:00:00.000Z',
          },
        ],
        books: [],
        sessions: [],
        events: [],
        goals: [],
      };

      const parseResult = parseGoodreadsCsv(csvText, []);
      const { snapshot, summary } = executeGoodreadsImport(emptySnapshot, parseResult.items);

      expect(summary.addedCount).toBe(45);
      expect(summary.replacedCount).toBe(0);
      expect(summary.skippedCount).toBe(0);
      expect(snapshot.books).toHaveLength(45);
      // Favorites shelf should have been created
      expect(snapshot.shelves.some((s: Shelf) => s.slug === 'favorites')).toBe(true);
      // Books on Favorites shelf with exclusiveShelf = 'read' should have isRead = true
      const gatsby = snapshot.books.find((b: BookItem) => b.title === 'The Great Gatsby');
      expect(gatsby?.shelfId).toBe('favorites');
      expect(gatsby?.isRead).toBe(true);
    });

    it('respects "skip" strategy for duplicate books', () => {
      const seed = buildCuratedSeedData();
      const parseResult = parseGoodreadsCsv(csvText, seed.books, 'skip');
      const { snapshot, summary } = executeGoodreadsImport(seed, parseResult.items);

      expect(summary.skippedCount).toBe(45);
      expect(summary.addedCount).toBe(0);
      expect(summary.replacedCount).toBe(0);
      expect(snapshot.books).toHaveLength(seed.books.length);
    });

    it('respects "replace" strategy for duplicate books', () => {
      const seed = buildCuratedSeedData();
      const parseResult = parseGoodreadsCsv(csvText, seed.books, 'replace');
      const { snapshot, summary } = executeGoodreadsImport(seed, parseResult.items);

      expect(summary.replacedCount).toBe(45);
      expect(summary.addedCount).toBe(0);
      expect(snapshot.books).toHaveLength(seed.books.length);
    });
  });
});
