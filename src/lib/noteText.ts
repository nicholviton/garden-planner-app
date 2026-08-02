import DOMPurify from 'dompurify';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function noteTextToHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return DOMPurify.sanitize(trimmed);
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll('\n', '<br>')}</p>`)
    .join('');
}

export function sanitizeNoteHtml(value: string): string {
  return DOMPurify.sanitize(noteTextToHtml(value));
}

export function noteTextToPlainText(value: string): string {
  const container = document.createElement('div');
  container.innerHTML = sanitizeNoteHtml(value);
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim();
}