import PageSpinner from './components/PageSpinner';

// Shown on every route navigation while the next page loads (wraps all pages in Suspense).
export default function Loading() {
  return <PageSpinner />;
}
