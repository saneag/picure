let locked = false;

// Ignore repeat taps while a pushed screen is still opening.
export function navigateOnce(go: () => void) {
  if (locked) return;
  locked = true;
  setTimeout(() => (locked = false), 1000);
  go();
}
