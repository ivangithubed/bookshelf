import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Lora } from 'next/font/google';
import { BookshelfProvider } from '@/context/BookshelfContext';
import '@/styles/globals.css';

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bookshelf — Personal Reading Tracker',
  description:
    'A warm, literary, accessible reading tracker with offline-first storage, sensory shelving, and rich 2026 reading analytics.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1512' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const antiFoucScript = `
(function() {
  try {
    var raw = localStorage.getItem('bookshelf_a11y_prefs_v1');
    var p = raw ? JSON.parse(raw) : null;
    var root = document.documentElement;
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = p && p.theme ? (p.theme === 'system' ? (prefersDark ? 'dark' : 'light') : p.theme) : (prefersDark ? 'dark' : 'light');
    root.setAttribute('data-theme', theme);
    if (p && p.contrast) {
      root.setAttribute('data-contrast', p.contrast);
    }
    if (p && p.readingFontSize) {
      root.setAttribute('data-reading-size', p.readingFontSize);
    }
    if (p && p.readingLineHeight) {
      root.setAttribute('data-reading-leading', p.readingLineHeight);
    }
    if (p && typeof p.dyslexiaFont !== 'undefined') {
      root.setAttribute('data-dyslexia-font', String(p.dyslexiaFont));
    }
    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var motion = p && p.reducedMotion ? (p.reducedMotion === 'system' ? prefersReduced : p.reducedMotion === 'on') : prefersReduced;
    root.setAttribute('data-reduced-motion', String(motion));
  } catch (e) {
    // Fail silently in restricted sandbox
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lora.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: antiFoucScript }}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-sans antialiased selection:bg-[var(--color-accent-subtle)] selection:text-[var(--color-accent)]">
        <BookshelfProvider>
          {children}
        </BookshelfProvider>
      </body>
    </html>
  );
}
