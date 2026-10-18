'use client';

import React, { useId, useState } from 'react';
import { Star, XCircle } from 'lucide-react';

export interface StarRatingInputProps {
  rating: number | null;
  onChange?: (rating: number | null) => void;
  label?: string;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSummary?: boolean;
  className?: string;
}

export function StarRatingInput({
  rating,
  onChange,
  label = 'Book rating',
  readOnly = false,
  size = 'md',
  showSummary = true,
  className = '',
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const groupId = useId();

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const starSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleKeyDown = (e: React.KeyboardEvent, starValue: number) => {
    if (readOnly || !onChange) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(5, (rating ?? 0) + 1);
      onChange(next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = Math.max(1, (rating ?? 2) - 1);
      onChange(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (rating === starValue) {
        onChange(null); // Toggle off if clicked/selected again
      } else {
        onChange(starValue);
      }
    }
  };

  const handleClick = (starValue: number) => {
    if (readOnly || !onChange) return;
    if (rating === starValue) {
      onChange(null);
    } else {
      onChange(starValue);
    }
  };

  const summaryText =
    rating !== null && rating > 0
      ? `${rating} out of 5 stars`
      : 'Unrated';

  if (readOnly) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 ${className}`}
        aria-label={`${label}: ${summaryText}`}
      >
        <div className="flex items-center" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`${starSizes[size]} ${
                rating !== null && star <= rating
                  ? 'fill-[var(--color-rating)] text-[var(--color-rating)]'
                  : 'text-[var(--color-border)] dark:text-[var(--color-border-subtle)]'
              }`}
            />
          ))}
        </div>
        {showSummary && (
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {rating !== null ? `${rating}.0` : '—'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <div
        id={groupId}
        role="radiogroup"
        aria-label={label}
        className="flex items-center -ml-1.5"
        onMouseLeave={() => setHoverRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = activeRating !== null && star <= activeRating;
          const isChecked = rating === star;

          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={isChecked}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
              tabIndex={rating === star || (rating === null && star === 1) ? 0 : -1}
              onClick={() => handleClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              onFocus={() => setHoverRating(star)}
              onBlur={() => setHoverRating(null)}
              onKeyDown={(e) => handleKeyDown(e, star)}
              className="group flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md p-1 transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'fill-[var(--color-rating)] text-[var(--color-rating)] scale-110'
                    : 'text-[var(--color-border)] hover:text-[var(--color-rating)]/70'
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {showSummary && (
        <span
          className="text-xs font-medium text-[var(--color-text-secondary)]"
          aria-live="polite"
        >
          {summaryText}
        </span>
      )}

      {rating !== null && !readOnly && onChange && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex min-h-[36px] items-center gap-1 rounded px-2 py-1 text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Clear rating"
          title="Clear rating"
        >
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
