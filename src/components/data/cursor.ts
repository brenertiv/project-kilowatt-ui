/** Reads the `cursor` out of a `next` or `previous` link the API returns. */
export function cursorFromUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, 'http://localhost').searchParams.get('cursor') ?? undefined;
  } catch {
    return undefined;
  }
}
