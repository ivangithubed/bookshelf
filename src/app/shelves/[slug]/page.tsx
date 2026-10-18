import React from 'react';
import { ShelfClientPage } from './ShelfClientPage';

interface ShelfPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): Array<{ slug: string }> {
  return [
    { slug: 'all' },
    { slug: 'currently-reading' },
    { slug: 'want-to-read' },
    { slug: 'read' },
    { slug: 'favorites' },
  ];
}

export default async function ShelfPage({ params }: ShelfPageProps) {
  const { slug } = await params;
  return <ShelfClientPage slug={slug} />;
}
