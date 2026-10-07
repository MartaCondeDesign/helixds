import '@helixds/tokens/helix.css';
import '@helixds/wc';

// Plain native click listener — no framework, no custom event plumbing. The shadow-internal
// <button>'s click is a composed UIEvent, so it bubbles out through helix-button as-is.
document.getElementById('primary-btn')?.addEventListener('click', () => {
  const log = document.getElementById('click-log');
  if (log) log.textContent = `Clicked at ${new Date().toLocaleTimeString()} — native click, no wrapper needed.`;
});
