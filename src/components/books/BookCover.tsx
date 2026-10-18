'use client';

import React, { useState } from 'react';

export interface BookCoverProps {
  title: string;
  author: string;
  coverUrl?: string | null;
  className?: string;
  interactive?: boolean;
  priority?: boolean;
}

// Generates a deterministic warm editorial palette based on book title string
function getCoverPalette(title: string): { bg: string; border: string; accent: string } {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const palettes = [
    {
      bg: 'bg-gradient-to-br from-[#f6f1ea] to-[#e8decb] dark:from-[#2a241f] dark:to-[#1c1814]',
      border: 'border-[#c8b9a3] dark:border-[#483c31]',
      accent: 'text-[var(--color-accent)]',
    },
    {
      bg: 'bg-gradient-to-br from-[#f2ede6] to-[#dfd5c5] dark:from-[#2d221c] dark:to-[#1e1510]',
      border: 'border-[#c5b59f] dark:border-[#523d2f]',
      accent: 'text-[#8b4f20] dark:text-[#d4964a]',
    },
    {
      bg: 'bg-gradient-to-br from-[#edf2ee] to-[#d6dfd7] dark:from-[#1b2520] dark:to-[#121915]',
      border: 'border-[#b5c5b7] dark:border-[#35483a]',
      accent: 'text-[var(--color-success)]',
    },
    {
      bg: 'bg-gradient-to-br from-[#f8ece5] to-[#ebd4c5] dark:from-[#2e201d] dark:to-[#1c1210]',
      border: 'border-[#d8b8a3] dark:border-[#53372f]',
      accent: 'text-[var(--color-accent)]',
    },
    {
      bg: 'bg-gradient-to-br from-[#efeef5] to-[#d9d7e7] dark:from-[#22212d] dark:to-[#15141c]',
      border: 'border-[#b9b7d3] dark:border-[#3f3c54]',
      accent: 'text-[#635985] dark:text-[#a594d1]',
    },
  ];
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

export function BookCover({
  title,
  author,
  coverUrl,
  className = '',
  interactive = true,
  priority = false,
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);
  const palette = getCoverPalette(title);
  const isSafeCoverUrl = Boolean(coverUrl && /^https?:\/\//i.test(coverUrl));
  const showImage = isSafeCoverUrl && !imageError;

  return (
    <div
      className={`relative aspect-[2/3] w-full overflow-hidden rounded-[var(--radius-sm)] ${
        interactive ? 'book-cover-interactive' : 'shadow-[var(--shadow-book)]'
      } ${className}`}
      style={{
        boxShadow: 'var(--shadow-book)',
      }}
    >
      {showImage ? (
        <>
          {/* Real Book Cover Image */}
          <img
            src={coverUrl!}
            alt={`Cover of ${title} by ${author}`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
          {/* Subtle realistic spine edge shadow */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/25 via-black/10 to-transparent"
            aria-hidden="true"
          />
          {/* Subtle book sheen highlight */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 dark:via-white/0 dark:to-white/5"
            aria-hidden="true"
          />
        </>
      ) : (
        /* Typographic Book Cover Placeholder (Core #1, Design Guidance) */
        <div
          role="img"
          aria-label={`Cover of ${title} by ${author}`}
          className={`relative flex h-full w-full flex-col justify-between p-3 select-none ${palette.bg} border ${palette.border}`}
        >
          {/* Subtle spine ridge on the left */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/20 via-black/10 to-transparent"
            aria-hidden="true"
          />

          {/* Decorative double border frame */}
          <div
            className={`pointer-events-none absolute inset-1.5 rounded-[2px] border border-dashed ${palette.border} opacity-70`}
            aria-hidden="true"
          />

          {/* Top header ornamentation */}
          <div className="relative z-10 flex flex-col items-center pt-1 text-center">
            <span
              className={`text-[9px] font-semibold tracking-widest uppercase opacity-75 ${palette.accent}`}
              aria-hidden="true"
            >
              Bookshelf Edition
            </span>
            <div
              className="mt-1 h-px w-8 bg-current opacity-40"
              aria-hidden="true"
            />
          </div>

          {/* Center Book Title (Lora / font-heading) */}
          <div className="relative z-10 my-auto flex flex-col items-center px-1 text-center">
            <p className="font-heading text-xs font-bold leading-snug tracking-tight text-[var(--color-text-primary)] sm:text-sm line-clamp-4">
              {title}
            </p>
          </div>

          {/* Bottom Author (Inter / font-sans) */}
          <div className="relative z-10 flex flex-col items-center pb-1 text-center">
            <div
              className="mb-1 h-px w-6 bg-current opacity-30"
              aria-hidden="true"
            />
            <p className="font-sans text-[11px] font-medium text-[var(--color-text-secondary)] line-clamp-2">
              {author}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
