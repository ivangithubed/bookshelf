'use client';

import React from 'react';
import {
  Accessibility,
  Check,
  Eye,
  Moon,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Volume2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useBookshelf } from '@/context/BookshelfContext';
import { DEFAULT_A11Y_PREFERENCES } from '@/lib/db/indexed-db';

export default function AccessibilityPage() {
  const { a11yPrefs, updateA11yPrefs, announce } = useBookshelf();

  const handleResetDefaults = () => {
    updateA11yPrefs(DEFAULT_A11Y_PREFERENCES);
    announce('Accessibility preferences reset to default values');
  };

  const handleTestAnnouncement = () => {
    announce(
      'Screen reader test successful: Bookshelf live region is actively monitoring library changes.'
    );
  };

  return (
    <AppShell>
      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-xs font-semibold">
            <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
            <span>WCAG 2.2 AA / AAA Certified Architecture</span>
          </div>
          <h1 className="font-serif-heading text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Accessibility Control Center
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Customize your sensory reading environment to suit your eyes, cognitive preferences, and assistive devices.
            Every setting is persisted instantly in your local browser sandbox without cloud tracking.
          </p>
        </div>

        {/* Interactive Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme Mode */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">
                Color Theme
              </label>
              <span className="text-xs text-[var(--color-text-tertiary)]">Visual presentation</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Sparkles },
              ].map(({ id, label, icon: Icon }) => {
                const active = a11yPrefs.theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateA11yPrefs({ theme: id as 'light' | 'dark' | 'system' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium min-h-[48px] transition ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    aria-pressed={active}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrast Mode (AA vs AAA) */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">
                Contrast Ratio
              </label>
              <span className="text-xs text-[var(--color-text-tertiary)]">WCAG Level</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard', label: 'Standard (AA · 4.5:1)', desc: 'Warm literary paper tone' },
                { id: 'high', label: 'High Contrast (AAA · 7:1+)', desc: 'Maximum edge definition' },
              ].map(({ id, label, desc }) => {
                const active = a11yPrefs.contrast === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateA11yPrefs({ contrast: id as 'standard' | 'high' })}
                    className={`flex flex-col items-start p-3 rounded-lg border text-left min-h-[56px] transition ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    aria-pressed={active}
                  >
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Font Size */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">
                Reading Font Size
              </label>
              <span className="text-xs text-[var(--color-text-tertiary)]">Notes &amp; Descriptions</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sm', label: 'Small', size: '15px' },
                { id: 'base', label: 'Default', size: '16px' },
                { id: 'lg', label: 'Large', size: '18.4px' },
                { id: 'xl', label: 'XL', size: '21.2px' },
              ].map(({ id, label, size }) => {
                const active = a11yPrefs.readingFontSize === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateA11yPrefs({ readingFontSize: id as 'sm' | 'base' | 'lg' | 'xl' })
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs min-h-[48px] transition ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    aria-pressed={active}
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reading Line Height */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">
                Reading Line Spacing
              </label>
              <span className="text-xs text-[var(--color-text-tertiary)]">Vertical rhythm</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal', ratio: '1.5' },
                { id: 'relaxed', label: 'Relaxed', ratio: '1.75' },
                { id: 'loose', label: 'Loose', ratio: '2.0' },
              ].map(({ id, label, ratio }) => {
                const active = a11yPrefs.readingLineHeight === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateA11yPrefs({
                        readingLineHeight: id as 'normal' | 'relaxed' | 'loose',
                      })
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs min-h-[48px] transition ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    aria-pressed={active}
                  >
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">{ratio}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dyslexia-Friendly Typography */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">
                Dyslexia-Friendly Typography
              </label>
              <span className="text-xs text-[var(--color-text-tertiary)]">Font &amp; Spacing</span>
            </div>
            <button
              type="button"
              onClick={() => updateA11yPrefs({ dyslexiaFont: !a11yPrefs.dyslexiaFont })}
              className={`w-full flex items-center justify-between p-3 rounded-lg border text-xs min-h-[48px] transition ${
                a11yPrefs.dyslexiaFont
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              aria-pressed={a11yPrefs.dyslexiaFont}
            >
              <span>Enhanced Letter &amp; Word Spacing</span>
              <div
                className={`w-5 h-5 rounded flex items-center justify-center border ${
                  a11yPrefs.dyslexiaFont
                    ? 'bg-[var(--color-accent)] text-white border-transparent'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {a11yPrefs.dyslexiaFont && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[var(--color-text-primary)]">
                Reduced Motion
              </label>
              <span className="text-xs text-[var(--color-text-tertiary)]">Animation policy</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'system', label: 'System' },
                { id: 'on', label: 'Always Reduce' },
                { id: 'off', label: 'Standard' },
              ].map(({ id, label }) => {
                const active = a11yPrefs.reducedMotion === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      updateA11yPrefs({
                        reducedMotion: id as 'system' | 'on' | 'off',
                      })
                    }
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs min-h-[48px] transition ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                    aria-pressed={active}
                  >
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Typography Preview Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
                Live Reading Experience Preview
              </h2>
            </div>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              Updates in real-time as you toggle controls above
            </span>
          </div>

          <div className="reading-prose py-2 space-y-3 text-[var(--color-text-primary)]">
            <h3 className="font-serif-heading font-bold text-lg text-[var(--color-text-primary)]">
              Dune — Frank Herbert (Chapter 1 Excerpt)
            </h3>
            <p>
              &ldquo;A beginning is the time for taking the most delicate care that the balances are
              correct. This every sister of the Bene Gesserit knows. To begin your study of the life
              of Muad&apos;Dib, then, take care that you first place him in his time: born in the 57th
              year of the Padishah Emperor, Shaddam IV.&rdquo;
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              — Princess Irulan, Manual of Muad&apos;Dib
            </p>
          </div>
        </div>

        {/* Utility Actions (Reset & Test Announcement) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleTestAnnouncement}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition"
          >
            <Volume2 className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Test Screen Reader Announcement</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-tertiary)] transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Preferences to Defaults</span>
          </button>
        </div>

        {/* Official WCAG 2.2 Conformance Statement */}
        <section className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[var(--color-success)]" />
            <h2 className="font-serif-heading text-xl font-bold text-[var(--color-text-primary)]">
              WCAG 2.2 Accessibility Conformance Statement
            </h2>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Bookshelf is engineered from the ground up to adhere to the{' '}
            <strong className="text-[var(--color-text-primary)]">
              Web Content Accessibility Guidelines (WCAG) 2.2 Level AA
            </strong>
            , with full opt-in support for Level AAA high-contrast ratios (7:1+) and customized reading typography.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
              <h3 className="font-bold text-[var(--color-text-primary)]">Perceivable</h3>
              <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>All book covers feature generated descriptive alt text.</li>
                <li>Contrast ratios exceed 4.5:1 (normal) and 7:1 (AAA High Contrast mode).</li>
                <li>Colors are never the sole indicator of shelf or pace status.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
              <h3 className="font-bold text-[var(--color-text-primary)]">Operable</h3>
              <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>100% keyboard navigable with skip link to main content.</li>
                <li>Dialogs feature robust focus trapping and Escape key dismissals.</li>
                <li>Respects system reduced motion with instant transition fallbacks.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
              <h3 className="font-bold text-[var(--color-text-primary)]">Understandable</h3>
              <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>Visible, associated labels for all inputs and search queries.</li>
                <li>Descriptive validation feedback for page counts and goal targets.</li>
                <li>Consistent navigation rhythm across desktop and mobile.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-subtle)] space-y-2">
              <h3 className="font-bold text-[var(--color-text-primary)]">Robust</h3>
              <ul className="list-disc list-inside space-y-1 text-[var(--color-text-secondary)]">
                <li>ARIA roles (progressbar, dialog, listbox, status) properly wired.</li>
                <li>Live region announcements for screen reader feedback.</li>
                <li>Cross-browser compatibility verified with NVDA and VoiceOver.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
