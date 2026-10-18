'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Sparkles, UserCheck } from 'lucide-react';
import { useBookshelf } from '@/context/BookshelfContext';

export default function GuestPage() {
  const router = useRouter();
  const { isLoading, books } = useBookshelf();

  useEffect(() => {
    // Automatically redirect to /library after mounting
    const timer = setTimeout(() => {
      router.replace('/library');
    }, 400);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shadow-xs">
          <UserCheck className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-accent)] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Frontend Mentor Guest Sandbox</span>
          </div>

          <h1 className="font-serif-heading text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome to Bookshelf
          </h1>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Opening your personal sandbox with {isLoading ? '45 curated volumes' : `${books.length} curated volumes`}.
            No login, passwords, or tracking required.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/library"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-white text-sm font-semibold shadow-md hover:bg-[var(--color-accent-hover)] transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Enter Library Directly</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          Redirecting automatically in a moment...
        </p>
      </div>
    </div>
  );
}
