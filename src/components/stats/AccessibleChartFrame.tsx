'use client';

import React from 'react';

export interface AccessibleChartTableData {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
  footers?: (string | number)[];
}

export interface AccessibleChartFrameProps {
  title: string;
  titleLevel?: 'h2' | 'h3';
  subtitle?: string;
  badge?: string;
  ariaLabel: string;
  screenReaderSummary?: string;
  tableData?: AccessibleChartTableData;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleChartFrame({
  title,
  titleLevel = 'h3',
  subtitle,
  badge,
  ariaLabel,
  screenReaderSummary,
  tableData,
  actions,
  children,
  className = '',
}: AccessibleChartFrameProps) {
  const HeadingTag = titleLevel;

  return (
    <article
      className={`rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-sm transition-all hover:border-[var(--color-border)] ${className}`}
      aria-labelledby={`chart-heading-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <HeadingTag
              id={`chart-heading-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="font-serif-heading font-semibold text-lg sm:text-xl text-[var(--color-text-primary)]"
            >
              {title}
            </HeadingTag>
            {badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Screen Reader Only Summary for Chart Context */}
      {screenReaderSummary && (
        <p className="sr-only">
          {screenReaderSummary}
        </p>
      )}

      {/* Visual Chart Graphic Wrapper with ARIA Graphic Role */}
      <div
        role="img"
        aria-label={ariaLabel}
        className="w-full relative overflow-x-auto focus:outline-none"
        tabIndex={0}
      >
        {children}
      </div>

      {/* 100% Accessible Data Table Fallback via Accordion */}
      {tableData && tableData.rows.length > 0 && (
        <details className="mt-5 border-t border-[var(--color-border-subtle)] pt-3 text-xs group">
          <summary className="cursor-pointer font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded select-none py-1">
            <span className="underline underline-offset-2">View accessible data table</span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="overflow-x-auto mt-3 rounded-lg border border-[var(--color-border-subtle)]">
            <table className="w-full text-left border-collapse text-xs">
              <caption className="sr-only">
                {tableData.caption || `Data table representation of ${title}`}
              </caption>
              <thead>
                <tr className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold">
                  {tableData.headers.map((header, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      className={`px-3 py-2 ${idx > 0 ? 'text-right' : 'text-left'}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-surface)]">
                {tableData.rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-[var(--color-bg-primary)]/50 transition-colors"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-3 py-2 text-[var(--color-text-primary)] ${
                          cIdx > 0 ? 'text-right font-mono' : 'font-medium'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              {tableData.footers && (
                <tfoot>
                  <tr className="bg-[var(--color-bg-secondary)] font-semibold border-t-2 border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
                    {tableData.footers.map((footerCell, fIdx) => (
                      <td
                        key={fIdx}
                        className={`px-3 py-2 ${
                          fIdx > 0 ? 'text-right font-mono' : 'text-left'
                        }`}
                      >
                        {footerCell}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </details>
      )}
    </article>
  );
}
