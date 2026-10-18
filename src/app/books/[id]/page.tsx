import React from 'react';
import { BookDetailClientPage } from './BookDetailClientPage';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams(): Array<{ id: string }> {
  return Array.from({ length: 45 }, (_, idx) => ({
    id: `book-${idx + 1}`,
  }));
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  return <BookDetailClientPage id={id} />;
}
