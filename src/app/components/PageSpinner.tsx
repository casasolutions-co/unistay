/** Brand spinner. Full-page by default; `inline` for a panel/list that's loading. */
export default function PageSpinner({ inline = false, label = 'Loading' }: { inline?: boolean; label?: string }) {
  return (
    <div className={inline ? 'us-spinner-wrap' : 'us-spinner-wrap page'} role="status" aria-live="polite">
      <span className="us-spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
