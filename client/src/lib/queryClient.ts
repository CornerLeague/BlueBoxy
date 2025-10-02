import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function stripUserIdFromUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl, window.location.origin);
    u.searchParams.delete("userId");
    return u.pathname + (u.search ? u.search : "");
  } catch {
    // If it's a relative path without origin, fallback to manual strip
    const [path, qs] = rawUrl.split("?");
    if (!qs) return rawUrl;
    const params = new URLSearchParams(qs);
    params.delete("userId");
    const q = params.toString();
    return q ? `${path}?${q}` : path;
  }
}

function stripUserIdFromBody<T>(payload: T): T {
  if (!payload || typeof payload !== "object") return payload;
  const clone: any = Array.isArray(payload) ? [...(payload as any)] : { ...(payload as any) };
  if ("userId" in clone) delete clone.userId;
  return clone as T;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem("authToken");
  const headers: any = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const legacyId = localStorage.getItem("localUserId") || localStorage.getItem("userId");
  if (legacyId) {
    headers["X-User-Id"] = legacyId;
  }

  const sanitizedUrl = stripUserIdFromUrl(url);
  const sanitizedBody = data ? stripUserIdFromBody(data) : undefined;

  const res = await fetch(sanitizedUrl, {
    method,
    headers,
    body: sanitizedBody ? JSON.stringify(sanitizedBody) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem("authToken");
    const headers: any = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const legacyId = localStorage.getItem("localUserId") || localStorage.getItem("userId");
    if (legacyId) {
      headers["X-User-Id"] = legacyId;
    }

    const url = stripUserIdFromUrl(queryKey[0] as string);
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
