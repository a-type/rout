import LibraryPage from '@/pages/LibraryPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/library')({
  component: LibraryPage,
});
