export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error: string };

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set('content-type', 'application/json');

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof (data as any)?.error === 'string' ? (data as any).error : 'Request failed';
    throw new Error(msg);
  }
  return data as T;
}
