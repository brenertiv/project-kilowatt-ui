/** Byte-order mark so Excel opens UTF-8 CSVs with the right encoding. */
export const CSV_BOM = '﻿';

function escapeCell(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Builds an RFC 4180 CSV. Cells with commas, quotes or line breaks are quoted; quotes are doubled. */
export function toCsv(headers: string[], rows: string[][], options: { bom?: boolean } = {}): string {
  const lines = [headers, ...rows].map((cells) => cells.map(escapeCell).join(','));
  return `${options.bom ? CSV_BOM : ''}${lines.join('\r\n')}`;
}

/** Triggers a browser download of `csv` named `fileName` (".csv" is appended when missing). */
export function downloadCsv(fileName: string, csv: string) {
  if (typeof document === 'undefined') return;
  const name = fileName.toLowerCase().endsWith('.csv') ? fileName : `${fileName}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Let the click dispatch before revoking the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
