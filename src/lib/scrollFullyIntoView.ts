// scrollIntoView({ block: 'end' }) is inconsistent for elements that only
// partly fit below the fold — it can undershoot and leave the tail still
// clipped. Read the actual overflow and scroll exactly that far instead.
export function scrollFullyIntoView(el: HTMLElement, margin = 16) {
  const overflow = el.getBoundingClientRect().bottom - window.innerHeight + margin;
  if (overflow > 0) window.scrollBy(0, overflow);
}
