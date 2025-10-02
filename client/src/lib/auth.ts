let cachedLocalUserId: number | null = null;
let cachedLocalUser: any | null = null;

export async function ensureLocalUser(): Promise<{ id: number } | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null; // Not signed in or error; ignore
    const data = await res.json();
    const id = data?.user?.id;
    if (typeof id === 'number') {
      cachedLocalUserId = id;
      cachedLocalUser = data.user;
      try {
        localStorage.setItem('localUserId', String(id));
        localStorage.setItem('localUser', JSON.stringify(data.user));
      } catch {}
      return { id };
    }
  } catch {}
  return null;
}

export function getLocalUserId(): number | null {
  if (cachedLocalUserId != null) return cachedLocalUserId;
  const fromLs = localStorage.getItem('localUserId');
  if (fromLs) {
    const n = parseInt(fromLs, 10);
    if (!Number.isNaN(n)) {
      cachedLocalUserId = n;
      return n;
    }
  }
  return null;
}

export function getLocalUserCached<T = any>(): T | null {
  if (cachedLocalUser) return cachedLocalUser as T;
  const fromLs = localStorage.getItem('localUser');
  if (!fromLs) return null;
  try {
    cachedLocalUser = JSON.parse(fromLs);
    return cachedLocalUser as T;
  } catch {
    return null;
  }
}
