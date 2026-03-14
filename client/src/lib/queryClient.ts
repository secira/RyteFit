import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: BodyInit | Record<string, any> | null;
    headers?: HeadersInit;
  },
): Promise<Response> {
  const { method = "GET", body, headers } = options || {};
  
  // Handle different body types
  let requestHeaders: HeadersInit = { ...headers };
  let requestBody: BodyInit | null = (body instanceof FormData || typeof body === 'string' ? body : null) || null;
  
  // Only add Content-Type for JSON if body is not FormData
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    requestHeaders = { 
      "Content-Type": "application/json",
      ...headers 
    };
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
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
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Handle 304 Not Modified - return undefined to preserve cached data
    if (res.status === 304) {
      return undefined;
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
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh for 5 min
      gcTime: 10 * 60 * 1000, // 10 minutes - unused data kept in cache for 10 min
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
