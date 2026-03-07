export function getCookie(reqCookieHeader: string | undefined, name: string): string | undefined {
  if (!reqCookieHeader) return undefined;

  const parts = reqCookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}
