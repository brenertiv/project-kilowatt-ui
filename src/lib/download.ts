/** Triggers a browser download of `text` as a file named `fileName`. */
export function downloadText(fileName: string, text: string, mimeType = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined') return;
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Let the click dispatch before revoking the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
