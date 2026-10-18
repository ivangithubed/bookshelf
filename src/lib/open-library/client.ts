import type {
  BookItem,
  OpenLibraryBookCandidate,
  OpenLibrarySearchResponse,
} from '@/types/bookshelf';

/**
 * Normalizes a raw doc from Open Library search.json into a typed OpenLibraryBookCandidate.
 */
export function normalizeOpenLibraryDoc(
  doc: Record<string, unknown>
): OpenLibraryBookCandidate {
  const workKey = String(doc.key ?? '');
  const title = String(doc.title ?? 'Untitled Book');

  let authors: string[] = [];
  if (Array.isArray(doc.author_name)) {
    authors = doc.author_name.map((a) => String(a).trim()).filter(Boolean);
  } else if (typeof doc.author_name === 'string') {
    authors = [doc.author_name.trim()];
  }
  const author = authors[0] ?? 'Unknown Author';

  const firstPublishYear = doc.first_publish_year
    ? String(doc.first_publish_year)
    : null;

  let pageCount: number | null = null;
  if (typeof doc.number_of_pages_median === 'number' && doc.number_of_pages_median > 0) {
    pageCount = doc.number_of_pages_median;
  } else if (typeof doc.number_of_pages === 'number' && doc.number_of_pages > 0) {
    pageCount = doc.number_of_pages;
  }

  let isbn13: string | null = null;
  let isbn10: string | null = null;
  if (Array.isArray(doc.isbn)) {
    for (const rawIsbn of doc.isbn) {
      const clean = String(rawIsbn).replace(/[^0-9Xx]/g, '');
      if (clean.length === 13 && !isbn13) {
        isbn13 = clean;
      } else if (clean.length === 10 && !isbn10) {
        isbn10 = clean;
      }
      if (isbn13 && isbn10) break;
    }
  }

  let coverUrl: string | null = null;
  if (typeof doc.cover_i === 'number' && doc.cover_i > 0) {
    coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  } else if (isbn13) {
    coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`;
  } else if (isbn10) {
    coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn10}-L.jpg`;
  }

  let publisher: string | null = null;
  if (Array.isArray(doc.publisher) && doc.publisher.length > 0) {
    publisher = String(doc.publisher[0]);
  } else if (typeof doc.publisher === 'string') {
    publisher = doc.publisher;
  }

  let genres: string[] = [];
  if (Array.isArray(doc.subject)) {
    genres = doc.subject
      .map((s) => String(s).trim())
      .filter((s) => s.length > 2 && s.length < 30)
      .slice(0, 4);
  }

  let description: string | null = null;
  if (typeof doc.first_sentence === 'string') {
    description = doc.first_sentence;
  } else if (Array.isArray(doc.first_sentence) && doc.first_sentence.length > 0) {
    description = String(doc.first_sentence[0]);
  }

  return {
    workKey,
    title,
    author,
    authors,
    firstPublishYear,
    pageCount,
    isbn13,
    isbn10,
    coverUrl,
    publisher,
    genres,
    description,
  };
}

export interface CuratedDiscoveryCollection {
  id: string;
  name: string;
  description: string;
  iconName: string;
  books: OpenLibraryBookCandidate[];
}

export const CURATED_DISCOVERY_COLLECTIONS: CuratedDiscoveryCollection[] = [
  {
    id: 'staff-picks',
    name: 'Trending & Staff Picks',
    description: 'Acclaimed page-turners across fiction, memoir, and science.',
    iconName: 'Sparkles',
    books: [
      {
        workKey: '/works/OL21634591W',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        authors: ['Andy Weir'],
        firstPublishYear: '2021',
        pageCount: 476,
        isbn13: '9780593135204',
        isbn10: '0593135202',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
        publisher: 'Ballantine Books',
        genres: ['Sci-Fi', 'Space Exploration', 'Adventure'],
        description:
          'A lone astronaut must save the Earth from an extinction-level catastrophe.',
      },
      {
        workKey: '/works/OL17926838W',
        title: 'Educated',
        author: 'Tara Westover',
        authors: ['Tara Westover'],
        firstPublishYear: '2018',
        pageCount: 334,
        isbn13: '9780399590504',
        isbn10: '0399590501',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg',
        publisher: 'Random House',
        genres: ['Memoir', 'Biography', 'Non-Fiction'],
        description:
          'An unforgettable memoir about a young girl who leaves her survivalist family and earns a PhD from Cambridge.',
      },
      {
        workKey: '/works/OL17364998W',
        title: 'A Gentleman in Moscow',
        author: 'Amor Towles',
        authors: ['Amor Towles'],
        firstPublishYear: '2016',
        pageCount: 462,
        isbn13: '9780143110439',
        isbn10: '0143110438',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780143110439-L.jpg',
        publisher: 'Penguin Books',
        genres: ['Historical Fiction', 'Literature', 'Russia'],
        description:
          'In 1922, Count Alexander Rostov is sentenced to spend the rest of his life inside the Hotel Metropol.',
      },
      {
        workKey: '/works/OL20863696W',
        title: 'Piranesi',
        author: 'Susanna Clarke',
        authors: ['Susanna Clarke'],
        firstPublishYear: '2020',
        pageCount: 272,
        isbn13: '9781635575941',
        isbn10: '1635575940',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9781635575941-L.jpg',
        publisher: 'Bloomsbury Publishing',
        genres: ['Fantasy', 'Mystery', 'Literary Fiction'],
        description:
          'Piranesi lives in the House. Perhaps he always has. In his notebooks he records the wonders of an endless labyrinth.',
      },
    ],
  },
  {
    id: 'sci-fi-classics',
    name: 'Sci-Fi & Modern Speculative',
    description: 'Mind-expanding worldbuilding, futuristic philosophy, and deep-space journeys.',
    iconName: 'Rocket',
    books: [
      {
        workKey: '/works/OL893415W',
        title: 'Dune',
        author: 'Frank Herbert',
        authors: ['Frank Herbert'],
        firstPublishYear: '1965',
        pageCount: 688,
        isbn13: '9780441013593',
        isbn10: '0441013597',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg',
        publisher: 'Ace Books',
        genres: ['Sci-Fi', 'Space Opera', 'Philosophy'],
        description:
          'Set on the desert planet Arrakis, Dune tells the story of Paul Atreides and the battle for the universe’s most valuable resource.',
      },
      {
        workKey: '/works/OL34598W',
        title: 'The Left Hand of Darkness',
        author: 'Ursula K. Le Guin',
        authors: ['Ursula K. Le Guin'],
        firstPublishYear: '1969',
        pageCount: 304,
        isbn13: '9780441478125',
        isbn10: '0441478123',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg',
        publisher: 'Ace Books',
        genres: ['Sci-Fi', 'Classic', 'Sociology'],
        description:
          'A groundbreaking exploration of gender, politics, and humanity on the winter planet of Gethen.',
      },
      {
        workKey: '/works/OL329618W',
        title: 'Neuromancer',
        author: 'William Gibson',
        authors: ['William Gibson'],
        firstPublishYear: '1984',
        pageCount: 271,
        isbn13: '9780441569595',
        isbn10: '0441569595',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg',
        publisher: 'Ace Books',
        genres: ['Cyberpunk', 'Sci-Fi', 'Dystopia'],
        description:
          'The definitive cyberpunk novel that introduced cyberspace and the Matrix to world literature.',
      },
      {
        workKey: '/works/OL17360249W',
        title: 'The Fifth Season',
        author: 'N.K. Jemisin',
        authors: ['N.K. Jemisin'],
        firstPublishYear: '2015',
        pageCount: 468,
        isbn13: '9780316229296',
        isbn10: '0316229296',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780316229296-L.jpg',
        publisher: 'Orbit',
        genres: ['Fantasy', 'Apocalypse', 'Hugo Award Winner'],
        description:
          'On a continent subject to catastrophic climate crises, three women harness tectonic energy to survive.',
      },
    ],
  },
  {
    id: 'deep-thinking',
    name: 'Non-Fiction & Deep Thinking',
    description: 'Human psychology, evolutionary history, and mental models for clearer thought.',
    iconName: 'Brain',
    books: [
      {
        workKey: '/works/OL17079955W',
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        authors: ['Yuval Noah Harari'],
        firstPublishYear: '2011',
        pageCount: 443,
        isbn13: '9780062316097',
        isbn10: '0062316095',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg',
        publisher: 'Harper',
        genres: ['History', 'Anthropology', 'Non-Fiction'],
        description:
          'How an insignificant ape became the ruler of planet Earth through the power of collective fiction.',
      },
      {
        workKey: '/works/OL15854324W',
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        authors: ['Daniel Kahneman'],
        firstPublishYear: '2011',
        pageCount: 499,
        isbn13: '9780374533557',
        isbn10: '0374533555',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg',
        publisher: 'Farrar, Straus and Giroux',
        genres: ['Psychology', 'Behavioral Economics', 'Cognitive Science'],
        description:
          'Nobel laureate Daniel Kahneman explains the two systems that drive the way we think and decide.',
      },
      {
        workKey: '/works/OL17930368W',
        title: 'Atomic Habits',
        author: 'James Clear',
        authors: ['James Clear'],
        firstPublishYear: '2018',
        pageCount: 320,
        isbn13: '9780735211292',
        isbn10: '0735211299',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
        publisher: 'Avery',
        genres: ['Self-Improvement', 'Productivity', 'Psychology'],
        description:
          'An easy and proven way to build good habits and break bad ones through tiny incremental changes.',
      },
      {
        workKey: '/works/OL8479872W',
        title: 'The Immortal Life of Henrietta Lacks',
        author: 'Rebecca Skloot',
        authors: ['Rebecca Skloot'],
        firstPublishYear: '2010',
        pageCount: 381,
        isbn13: '9781400052189',
        isbn10: '1400052181',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9781400052189-L.jpg',
        publisher: 'Crown',
        genres: ['Science', 'Biography', 'Medicine'],
        description:
          'The story of HeLa cells, biomedical ethics, and the family behind one of medicine’s greatest breakthroughs.',
      },
    ],
  },
  {
    id: 'tech-engineering',
    name: 'Software Engineering & Architecture',
    description: 'Foundational books on system design, clean abstraction, and engineering craftsmanship.',
    iconName: 'Code',
    books: [
      {
        workKey: '/works/OL17845608W',
        title: 'Designing Data-Intensive Applications',
        author: 'Martin Kleppmann',
        authors: ['Martin Kleppmann'],
        firstPublishYear: '2017',
        pageCount: 616,
        isbn13: '9781449373320',
        isbn10: '1449373321',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg',
        publisher: "O'Reilly Media",
        genres: ['Distributed Systems', 'Databases', 'Software Engineering'],
        description:
          'The definitive guide to the storage engines, consensus protocols, and replication architectures behind modern data systems.',
      },
      {
        workKey: '/works/OL1953268W',
        title: 'The Pragmatic Programmer',
        author: 'David Thomas, Andrew Hunt',
        authors: ['David Thomas', 'Andrew Hunt'],
        firstPublishYear: '1999',
        pageCount: 352,
        isbn13: '9780135957059',
        isbn10: '0135957052',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg',
        publisher: 'Addison-Wesley Professional',
        genres: ['Software Craftsmanship', 'Programming', 'Best Practices'],
        description:
          'Timeless advice on career, code quality, testing, tracer bullets, and orthogonal modular design.',
      },
      {
        workKey: '/works/OL20042456W',
        title: 'A Philosophy of Software Design',
        author: 'John Ousterhout',
        authors: ['John Ousterhout'],
        firstPublishYear: '2018',
        pageCount: 190,
        isbn13: '9781732102200',
        isbn10: null,
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9781732102200-L.jpg',
        publisher: 'Yaknyam Press',
        genres: ['Software Architecture', 'Complexity', 'Design Principles'],
        description:
          'A concise and rigorous philosophy on combating complexity and designing deep, expressive modules.',
      },
      {
        workKey: '/works/OL18417W',
        title: 'Refactoring: Improving the Design of Existing Code',
        author: 'Martin Fowler',
        authors: ['Martin Fowler'],
        firstPublishYear: '1999',
        pageCount: 448,
        isbn13: '9780134757599',
        isbn10: '0134757599',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780134757599-L.jpg',
        publisher: 'Addison-Wesley Professional',
        genres: ['Refactoring', 'Clean Code', 'Testing'],
        description:
          'The classic handbook on improving code structure safely using step-by-step transformations and tests.',
      },
    ],
  },
  {
    id: 'short-impactful',
    name: 'Short & Impactful Reads',
    description: 'High-density insights and brilliant novels that can be finished in a weekend.',
    iconName: 'Zap',
    books: [
      {
        workKey: '/works/OL18182W',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        authors: ['F. Scott Fitzgerald'],
        firstPublishYear: '1925',
        pageCount: 180,
        isbn13: '9780743273565',
        isbn10: '0743273567',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
        publisher: 'Scribner',
        genres: ['Classic', 'American Literature', 'Fiction'],
        description:
          'F. Scott Fitzgerald’s lyrical portrait of obsession, wealth, and illusion in the Roaring Twenties.',
      },
      {
        workKey: '/works/OL20863891W',
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        authors: ['Morgan Housel'],
        firstPublishYear: '2020',
        pageCount: 256,
        isbn13: '9780857197689',
        isbn10: null,
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg',
        publisher: 'Harriman House',
        genres: ['Finance', 'Behavioral Psychology', 'Personal Growth'],
        description:
          'Timeless lessons on wealth, greed, and happiness doing well with money is about behavior, not math.',
      },
      {
        workKey: '/works/OL16805096W',
        title: 'Deep Work',
        author: 'Cal Newport',
        authors: ['Cal Newport'],
        firstPublishYear: '2016',
        pageCount: 296,
        isbn13: '9781455586691',
        isbn10: '1455586692',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
        publisher: 'Grand Central Publishing',
        genres: ['Productivity', 'Focus', 'Career'],
        description:
          'Rules for focused success in a distracted world master hard things and produce elite results.',
      },
      {
        workKey: '/works/OL2724598W',
        title: 'The Road',
        author: 'Cormac McCarthy',
        authors: ['Cormac McCarthy'],
        firstPublishYear: '2006',
        pageCount: 287,
        isbn13: '9780307387899',
        isbn10: '0307387895',
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780307387899-L.jpg',
        publisher: 'Vintage International',
        genres: ['Post-Apocalyptic', 'Pulitzer Prize', 'Fiction'],
        description:
          'A father and his young son walk alone through burned America, sustaining each other with profound love.',
      },
    ],
  },
];

export const ALL_CURATED_CANDIDATES: OpenLibraryBookCandidate[] = Array.from(
  new Map(
    CURATED_DISCOVERY_COLLECTIONS.flatMap((c) => c.books).map((b) => [
      (b.isbn13 ?? b.title).toLowerCase(),
      b,
    ])
  ).values()
);

/**
 * Builds personalized reading recommendation lanes based on the user's reading history.
 */
export function buildPersonalizedRecommendations(
  userBooks: BookItem[]
): { reason: string; genre: string; candidates: OpenLibraryBookCandidate[] }[] {
  const readBookIds = new Set(
    userBooks.map((b) => (b.isbn13 ?? b.title).toLowerCase().trim())
  );

  const filterOutExisting = (list: OpenLibraryBookCandidate[]) =>
    list.filter((c) => !readBookIds.has((c.isbn13 ?? c.title).toLowerCase().trim()));

  const recommendations: {
    reason: string;
    genre: string;
    candidates: OpenLibraryBookCandidate[];
  }[] = [];

  // 1. Tech & Systems
  const hasTech = userBooks.some(
    (b) =>
      b.genres.some((g) => g.toLowerCase().includes('tech') || g.toLowerCase().includes('programming')) ||
      b.title.includes('Software') ||
      b.title.includes('Programmer')
  );
  if (hasTech) {
    const techCollection = CURATED_DISCOVERY_COLLECTIONS.find(
      (c) => c.id === 'tech-engineering'
    );
    if (techCollection) {
      const candidates = filterOutExisting(techCollection.books);
      if (candidates.length > 0) {
        recommendations.push({
          reason: 'Because you have Software Engineering & Architecture books in your library',
          genre: 'Tech & Architecture',
          candidates,
        });
      }
    }
  }

  // 2. Sci-Fi & Speculative
  const hasSciFi = userBooks.some((b) =>
    b.genres.some((g) => g.toLowerCase().includes('sci-fi') || g.toLowerCase().includes('fantasy'))
  );
  if (hasSciFi) {
    const sciFiCollection = CURATED_DISCOVERY_COLLECTIONS.find(
      (c) => c.id === 'sci-fi-classics'
    );
    if (sciFiCollection) {
      const candidates = filterOutExisting(sciFiCollection.books);
      if (candidates.length > 0) {
        recommendations.push({
          reason: 'Because you enjoy Sci-Fi & Speculative Fiction',
          genre: 'Sci-Fi & Fantasy',
          candidates,
        });
      }
    }
  }

  // 3. Deep Thinking / Psychology
  const hasDeepThinking = userBooks.some((b) =>
    b.genres.some(
      (g) =>
        g.toLowerCase().includes('psychology') ||
        g.toLowerCase().includes('history') ||
        g.toLowerCase().includes('productivity')
    )
  );
  if (hasDeepThinking) {
    const thinkCollection = CURATED_DISCOVERY_COLLECTIONS.find(
      (c) => c.id === 'deep-thinking'
    );
    if (thinkCollection) {
      const candidates = filterOutExisting(thinkCollection.books);
      if (candidates.length > 0) {
        recommendations.push({
          reason: 'Because you read books on Behavioral Science & History',
          genre: 'Non-Fiction & Thinking',
          candidates,
        });
      }
    }
  }

  // Fallback: If no matches, suggest Staff Picks
  if (recommendations.length === 0) {
    const staffPicks = CURATED_DISCOVERY_COLLECTIONS[0]!;
    recommendations.push({
      reason: 'Curated Staff Picks to jumpstart your reading journey',
      genre: 'Trending Picks',
      candidates: filterOutExisting(staffPicks.books),
    });
  }

  return recommendations;
}

/**
 * Searches Open Library books via the internal proxy route with offline curated fallback.
 */
export async function searchOpenLibraryBooks(
  query: string
): Promise<OpenLibrarySearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      query,
      totalFound: 0,
      items: [],
      cached: false,
    };
  }

  try {
    const res = await fetch(`/api/books/search?q=${encodeURIComponent(trimmed)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = (await res.json()) as OpenLibrarySearchResponse;
      return data;
    }
  } catch {
    // Network failure / offline: fall back to curated search
  }

  // Local fallback search from curated pool
  const qLower = trimmed.toLowerCase();
  const matched = ALL_CURATED_CANDIDATES.filter(
    (c) =>
      c.title.toLowerCase().includes(qLower) ||
      c.author.toLowerCase().includes(qLower) ||
      c.genres.some((g) => g.toLowerCase().includes(qLower)) ||
      (c.isbn13 && c.isbn13.includes(qLower)) ||
      (c.isbn10 && c.isbn10.includes(qLower))
  );

  return {
    query: trimmed,
    totalFound: matched.length,
    items: matched,
    cached: true,
  };
}

/**
 * Enriches a book from Open Library via internal proxy route.
 */
export async function enrichBookFromOpenLibrary(params: {
  isbn?: string | null;
  title: string;
  author: string;
}): Promise<Partial<BookItem> | null> {
  const searchParams = new URLSearchParams();
  if (params.isbn) searchParams.set('isbn', params.isbn);
  if (params.title) searchParams.set('title', params.title);
  if (params.author) searchParams.set('author', params.author);

  try {
    const res = await fetch(`/api/books/enrich?${searchParams.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = (await res.json()) as Partial<BookItem> | null;
      return data;
    }
  } catch {
    // Network failure
  }

  // Offline local fallback
  const candidate = ALL_CURATED_CANDIDATES.find((c) => {
    if (params.isbn && (c.isbn13 === params.isbn || c.isbn10 === params.isbn)) {
      return true;
    }
    return (
      c.title.toLowerCase() === params.title.toLowerCase() ||
      (c.title.toLowerCase().includes(params.title.toLowerCase()) &&
        c.author.toLowerCase().includes(params.author.toLowerCase()))
    );
  });

  if (candidate) {
    return {
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

  return null;
}
